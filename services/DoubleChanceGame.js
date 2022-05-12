const debug = require("debug")("test");
const db = require("../config/db.js");
const bcrypt = require('bcrypt');
const moment = require('moment'); 
const {sendResponse,GetRandomNo,isValidArray} = require('./AppService');



async function getUserPoints(playerId){
	try{
		let points = 0;
		let sql = `SELECT * FROM user_points WHERE user_id=? limit ?`;
		let user = await db.query(sql,[playerId,1]);
		if(user.length>0) points = user[0].points;
	    return points;
    } catch (err){
        debug(err);
	}   
}

async function saveUserPoints(points,playerId){
	try{

		sql = `UPDATE user_points SET points= ? WHERE user_id= ? `;
        let saveBalance  = await db.query(sql,[points,playerId]);
	    return true;
    } catch (err){
        debug(err);
	}   
}

async function userById(playerId){
    try{
        let sql = `SELECT * FROM user WHERE user_id=? limit ?`;
	    let user = await db.query(sql,[playerId,1]);
        return user;
    } catch (err) {
        debug(err);
    }     
}

async function PreviousWinData(RoundCount){
    try{
        let limit = 10;
        let result = new Array(limit);
        let sql =  `SELECT * FROM (SELECT * FROM db_current_round ORDER by db_id DESC LIMIT 1,10) sub ORDER BY db_id ASC`
        let data = await db.query(sql);
        if(isValidArray(data)){
            for (var i = 0; i < data.length; i++) { 
            	let outer_win_no  = data[i].win_no?data[i].win_no:0; 
				let inner_win_no  = data[i].db_win_no?data[i].db_win_no:0; 
                result[i]= { outer_win_no,inner_win_no};
            }
        }
        return result;
    } catch (err) {
        debug(err);
    }    
}
 
const JoinGame = async(req,CurrRoundCount,gameState) => {
	let message;
	let status =404;
	let data = {}
	 
	try { 
		let date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss"); 
        if(gameState === 0) return sendResponse(status,"Please wait for game.",data); 
		const{playerId, gameId,points,single,double} = req;
		let checkUser = await userById(playerId); 
		if(checkUser.length == 0) return sendResponse(status,"Invalid User.",data); 
        let user = checkUser[0];
		let distId = user.distributor_id;  
		let current_date = moment(new Date()).format("YYYY-MM-DD");
		let sql = 'SELECT count(*) as cnt FROM `db_current_round` WHERE date(created) =?'; 
	    let checkRound = await db.query(sql,[current_date]);  
		// Check already bet confirmed
		const roundDate = moment(new Date()).format("YYYYMMDD");
		const CurrentRound = parseInt(roundDate)+parseInt(checkRound[0].cnt)
	    let sql1 = 'SELECT * FROM `round_report` WHERE  player_id=? AND distributor_id=? And round_count=? And game=?';
	    let checkCurRound = await db.query(sql1,[playerId,distId,CurrentRound,gameId]); 

	    if(checkCurRound.length > 0) return sendResponse(status,"Already bet is Confirm.",data); 
	    let userPoints = await getUserPoints(playerId);

	    if(userPoints < points) return sendResponse(status,"player not have enough balance.",data);
		const formData ={
			distributor_id:distId,
			round_count:CurrentRound,
			game:gameId,
			created_at:date,
			player_id:playerId,
			no_0:single[0], no_1:single[1], no_2:single[2], no_3:single[3], no_4:single[4], 
			no_5:single[5], no_6:single[6], no_7:single[7], no_8:single[8], no_9:single[9],
			nu_00:double[0], nu_01:double[1],nu_02:double[2], nu_03:double[3], nu_04:double[4], 
			nu_05:double[5],nu_06:double[6], nu_07:double[7], nu_08:double[8], nu_09:double[9],
			nu_10:double[10], nu_11:double[11], nu_12:double[12],nu_12:double[13],
			nu_14:double[14], nu_15:double[15], nu_16:double[16], nu_17:double[17], nu_18:double[18],
			nu_19:double[19], nu_20:double[20], nu_21:double[21], nu_22:double[22], nu_23:double[23], 
			nu_24:double[24], nu_25:double[25], nu_26:double[26], nu_27:double[27], nu_28:double[28],
			nu_29:double[29], nu_30:double[30], nu_31:double[31], nu_32:double[32], nu_33:double[33],
			nu_34:double[34], nu_35:double[35], nu_36:double[36], nu_37:double[37], nu_38:double[38], 
			nu_39:double[39], nu_40:double[40], nu_41:double[41], nu_42:double[42], nu_43:double[43],
			nu_44:double[44], nu_45:double[45], nu_46:double[46], nu_47:double[47], nu_48:double[48], 
			nu_49:double[49], nu_50:double[50], nu_51:double[51], nu_52:double[52], nu_53:double[53],
			nu_54:double[54], nu_55:double[55], nu_56:double[56], nu_57:double[57], 
			nu_58:double[58], nu_59:double[59], nu_60:double[60],nu_61:double[61],
			nu_62:double[62], nu_63:double[63],nu_64:double[64],nu_65:double[65],nu_66:double[66],
			nu_67:double[67], nu_68:double[68],nu_69:double[69],nu_70:double[70],nu_71:double[71],
			nu_72:double[72], nu_73:double[73],nu_74:double[74],nu_75:double[75],nu_76:double[76],
			nu_77:double[77], nu_78:double[78],nu_79:double[79],nu_80:double[80],nu_81:double[81],
			nu_82:double[82], nu_83:double[83],nu_84:double[84],nu_85:double[85],nu_86:double[86],
			nu_87:double[87], nu_88:double[88],nu_89:double[89],nu_90:double[90],nu_91:double[91],
			nu_92:double[92], nu_93:double[93],nu_94:double[94],nu_95:double[95],nu_96:double[96],
			nu_97:double[97], nu_98:double[98],nu_99:double[99] 
		} 
	 
		let sql3 = `INSERT INTO round_report set ?`;
		let saveBet = await db.query(sql3,formData); 

		let updateBal = userPoints - points;
		let saveBal = await saveUserPoints(updateBal,playerId);
  
        status  = 200;
        message = 'Bet Confirmed';
        data    = {playerId,balance:updateBal}
        return sendResponse(status,message,data);

    } catch (err){
        debug(err);
		return sendResponse(500,"database error!",data);
	}   
    
}

 

async function setRoundCount(){
	let D = new Date();
	let RoundCount = D.getTime(); 
    try { 
    	let outer = GetRandomNo(0,9);
		let inner = GetRandomNo(0,9);  
		let current_date = moment(new Date()).format("YYYY-MM-DD");
		let sql1  = 'SELECT count(*) as cnt FROM `db_current_round` WHERE date(created) =?';   
    	let WinX  = '3x'; 
		let sql = `INSERT INTO db_current_round (round_count, win_no ,db_win_no, win_x) VALUES (?,?,?,?)`;
		let saveRoundCount = await db.query(sql,[RoundCount,outer,inner,WinX]);
		let checkRound = await db.query(sql1,[current_date]);   
		const date = moment(new Date()).format("YYYYMMDD"); 
		let sql5 = `SELECT * FROM db_current_round ORDER by db_id DESC LIMIT 0,1`;
	    let roundData = await db.query(sql5); 
		const tRound = (parseInt(date)+parseInt((checkRound[0].cnt)))
		let sql2 = `UPDATE db_current_round SET round_count=? WHERE db_id = ?`;
		  await db.query(sql2,[tRound,roundData[0].db_id]);
        return tRound;
    } catch (err){
        debug(err);
	}  

}


/**Calculate  win no */
async function calcWinningNo(){
	let message;
	let status =404;
	let data = {}
    try { 
        let sql = `SELECT * FROM db_current_round ORDER by db_id DESC LIMIT 0,1`;
	    let roundData = await db.query(sql);  
	    if(!isValidArray(roundData)) return sendResponse(status,"Unable to send winning no..",data);
	    let win_no = roundData[0].win_no?roundData[0].win_no:0;
		let db_win_no = roundData[0].db_win_no?roundData[0].db_win_no:0; 
	    status  = 200;
        message = 'Winning No'; 
		data    = {outer_win_no:win_no,inner_win_no:db_win_no}  
        return sendResponse(status,message,data);
    } catch (err){
        debug(err);
	}  
}






async function calcWinningPoints(){ 
	try {
		let sql4 = `SELECT * FROM db_current_round ORDER by db_id DESC LIMIT 1,1`;
		let roundData = await db.query(sql4);  
		if(!isValidArray(roundData)) return sendResponse(404,"Unable to send winning no..",{});
		let outer_win = roundData[0].win_no;  
		let inner_win = roundData[0].db_win_no;  
		let playeWinningArray = []; 
		let current_date = moment(new Date()).format("YYYY-MM-DD");
		let sql1         = 'SELECT count(*) as cnt FROM `db_current_round` WHERE date(created) =?';   
		let checkRound   = await db.query(sql1,[current_date]);  
		const date       = moment(new Date()).format("YYYYMMDD");
		const RoundCount = (parseInt(date)+parseInt((checkRound[0].cnt))-1)  
		let sql =  `SELECT * FROM round_report WHERE game= ? AND round_count= ? AND status= ? `;
		let players = await db.query(sql,[1,RoundCount,1]);
		let winning_rate1 = 10
		let winning_rate2 = 100 
		let double_win = `${outer_win} + ${inner_win}`
		let double_win_no = parseInt(double_win)
		
		if(isValidArray(players)){ 
			for(let bet of players )
			{
				let win_points =  0;
				let {no_0,no_1,no_2,no_3,no_4,no_5,no_6,no_7,no_8,no_9,
					nu_00,nu_01,nu_02,nu_03,nu_04,nu_05,nu_06,nu_07,nu_08,nu_09,
					nu_10,nu_11,nu_12,nu_13,nu_14,nu_15,nu_16,nu_17,nu_18,nu_19,
					nu_20,nu_21,nu_22,nu_23,nu_24,nu_25,nu_26,nu_27,nu_28,nu_29,
					nu_30,nu_31,nu_32,nu_33,nu_34,nu_35,nu_36,nu_37,nu_38,nu_39,
					nu_40,nu_41,nu_42,nu_43,nu_44,nu_45,nu_46,nu_47,nu_48,nu_49,
					nu_50,nu_51,nu_52,nu_53,nu_54,nu_55,nu_56,nu_57,nu_58,nu_59,
					nu_60,nu_61,nu_62,nu_63,nu_64,nu_65,nu_66,nu_67,nu_68,nu_69,
					nu_70,nu_71,nu_72,nu_73,nu_74,nu_75,nu_76,nu_77,nu_78,nu_79,
					nu_80,nu_81,nu_82,nu_83,nu_84,nu_85,nu_86,nu_87,nu_88,nu_89,
					nu_90,nu_91,nu_92,nu_93,nu_94,nu_95,nu_96,nu_97,nu_98,nu_99,player_id,id} = bet;
				let userPoints = await getUserPoints(player_id); 
				switch (inner_win) {
					case 0: win_points =no_0 * winning_rate1; break;
					case 1: win_points =no_1 * winning_rate1; break;
					case 2: win_points =no_2 * winning_rate1; break;
					case 3: win_points =no_3 * winning_rate1; break;
					case 4: win_points = no_4 * winning_rate1; break;
					case 5: win_points = no_5 * winning_rate1; break;
					case 6: win_points = no_6 * winning_rate1; break;
					case 7: win_points = no_7 * winning_rate1; break;
					case 8: win_points = no_8 * winning_rate1; break;
					case 9: win_points = no_9 * winning_rate1; break; 
				} 
				switch (double_win_no) {
					case 0: win_points =nu_00 * winning_rate2; break;case 26: win_points = nu_26 * winning_rate2; break; 
					case 1: win_points =nu_01 * winning_rate2; break; case 27: win_points = nu_27 * winning_rate2; break; 
					case 2: win_points =nu_02 * winning_rate2; break;case 28: win_points = nu_28 * winning_rate2; break; 
					case 3: win_points =nu_03 * winning_rate2; break; case 29: win_points = nu_29 * winning_rate2; break; 
					case 4: win_points = nu_04 * winning_rate2; break;case 30: win_points = nu_30 * winning_rate2; break; 
					case 5: win_points = nu_05 * winning_rate2; break;case 31: win_points = nu_31 * winning_rate2; break; 
					case 6: win_points = nu_06 * winning_rate2; break;case 32: win_points = nu_32 * winning_rate2; break; 
					case 7: win_points = nu_07 * winning_rate2; break;case 33: win_points = nu_33 * winning_rate2; break; 
					case 8: win_points = nu_08 * winning_rate2; break;case 34: win_points = nu_34 * winning_rate2; break; 
					case 10: win_points = nu_10 * winning_rate2; break; case 35: win_points = nu_35 * winning_rate2; break; 
					case 11: win_points = nu_11 * winning_rate2; break;case 36: win_points = nu_36 * winning_rate2; break;  
					case 12: win_points = nu_12 * winning_rate2; break; case 38: win_points = nu_38 * winning_rate2; break; 
					case 13: win_points = nu_13 * winning_rate2; break; case 39: win_points = nu_39 * winning_rate2; break; 
					case 14: win_points = nu_14 * winning_rate2; break; case 40: win_points = nu_40 * winning_rate2; break; 
					case 15: win_points = nu_15 * winning_rate2; break; case 41: win_points = nu_41 * winning_rate2; break; 
					case 16: win_points = nu_16 * winning_rate2; break; case 42: win_points = nu_42 * winning_rate2; break; 
					case 17: win_points = nu_17 * winning_rate2; break; case 43: win_points = nu_43 * winning_rate2; break; 
					case 19: win_points = nu_19 * winning_rate2; break;case 44: win_points = nu_44 * winning_rate2; break;  
					case 18: win_points = nu_18 * winning_rate2; break; case 45: win_points = nu_45 * winning_rate2; break; 
					case 20: win_points = nu_20 * winning_rate2; break; case 46: win_points = nu_46 * winning_rate2; break; 
					case 21: win_points = nu_21 * winning_rate2; break; case 47: win_points = nu_47 * winning_rate2; break; 
					case 22: win_points = nu_22 * winning_rate2; break;case 48: win_points = nu_48 * winning_rate2; break;  
					case 23: win_points = nu_23 * winning_rate2; break; case 49: win_points = nu_49 * winning_rate2; break; 
					case 24: win_points = nu_24 * winning_rate2; break; case 50: win_points = nu_50 * winning_rate2; break; 
					case 25: win_points = nu_25 * winning_rate2; break; case 51: win_points = nu_51 * winning_rate2; break; 
					case 52: win_points =nu_52 * winning_rate2; break;case 53: win_points = nu_53 * winning_rate2; break; 
					case 54: win_points =nu_54 * winning_rate2; break; case 55: win_points = nu_55 * winning_rate2; break; 
					case 56: win_points =nu_56 * winning_rate2; break;case 57: win_points = nu_57 * winning_rate2; break; 
					case 58: win_points =nu_58 * winning_rate2; break;case 59: win_points = nu_59 * winning_rate2; break; 
					case 60: win_points = nu_60 * winning_rate2; break;case 61: win_points = nu_61 * winning_rate2; break; 
					case 62: win_points = nu_62 * winning_rate2; break;case 63: win_points = nu_63 * winning_rate2; break; 
					case 64: win_points = nu_64 * winning_rate2; break;case 65: win_points = nu_65 * winning_rate2; break; 
					case 66: win_points = nu_66 * winning_rate2; break;case 67: win_points = nu_67 * winning_rate2; break; 
					case 68: win_points = nu_68 * winning_rate2; break;case 69: win_points = nu_69 * winning_rate2; break; 
					case 70: win_points = nu_70 * winning_rate2; break; case 71: win_points = nu_71 * winning_rate2; break; 
					case 72: win_points = nu_72 * winning_rate2; break;case 73: win_points = nu_73 * winning_rate2; break;  
					case 74: win_points = nu_74 * winning_rate2; break; case 75: win_points = nu_75 * winning_rate2; break; 
					case 76: win_points = nu_76 * winning_rate2; break; case 77: win_points = nu_77 * winning_rate2; break; 
					case 78: win_points = nu_78 * winning_rate2; break; case 79: win_points = nu_79 * winning_rate2; break; 
					case 80: win_points = nu_80 * winning_rate2; break; case 81: win_points = nu_81 * winning_rate2; break; 
					case 82: win_points = nu_82 * winning_rate2; break; case 83: win_points = nu_83 * winning_rate2; break; 
					case 84: win_points = nu_84 * winning_rate2; break; case 85: win_points = nu_85 * winning_rate2; break; 
					case 86: win_points = nu_86 * winning_rate2; break;case 87: win_points = nu_87 * winning_rate2; break;  
					case 88: win_points = nu_88 * winning_rate2; break; case 89: win_points = nu_89 * winning_rate2; break; 
					case 90: win_points = nu_90 * winning_rate2; break; case 91: win_points = nu_91 * winning_rate2; break; 
					case 92: win_points = nu_92 * winning_rate2; break; case 93: win_points = nu_93 * winning_rate2; break; 
					case 94: win_points = nu_94 * winning_rate2; break;case 95: win_points = nu_95 * winning_rate2; break;  
					case 96: win_points = nu_96 * winning_rate2; break; case 97: win_points = nu_97 * winning_rate2; break; 
					case 98: win_points = nu_98 * winning_rate2; break; case 99: win_points = nu_99 * winning_rate2; break;  
				}  

			
				let isWinAmtadd = (win_points > 0) ? 0 : 1; 
				const updateData = {
					winning_amount:win_points,
					outer_win:outer_win,
					inner_win:inner_win,
					is_winning_amount_add:1,
					status:2
				}
				sql = `UPDATE round_report SET ? WHERE id= ?`; 
				let update_sql = await db.query(sql,[updateData,id]);  
				if(win_points > 0){
					let updateBal  = userPoints + win_points;
					let saveBal = await saveUserPoints(updateBal,player_id); 
					playeWinningArray.push({outer_win,inner_win,player_id,win_points,balance:updateBal})
				} else{ 
					playeWinningArray.push({outer_win,inner_win,player_id,win_points:0,balance:userPoints})
				} 
				
			}
			return playeWinningArray	
		}else{ 
			return 404
		}
	} catch (error) {
		return 500
	}  
}	


module.exports = {getUserPoints,PreviousWinData,JoinGame,setRoundCount,calcWinningNo,calcWinningPoints};
 

