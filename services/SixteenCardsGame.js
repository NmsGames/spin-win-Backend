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
        let sql =  `SELECT * FROM (SELECT * FROM scrd_current_round ORDER by scrd_id DESC LIMIT 1,10) sub ORDER BY scrd_id ASC`
        let data = await db.query(sql);
        if(isValidArray(data)){
            for (var i = 0; i < data.length; i++) { 
            	let winNo  = data[i].win_no?data[i].win_no:0; 
                result[i]= { winNo };
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
		const{playerId,gameId,points, faceCards,allFaceCards,allcards} = req; 
		let checkUser = await userById(playerId); 
		if(checkUser.length == 0) return sendResponse(status,"Invalid User.",data); 
        let user = checkUser[0];
		let distId = user.distributor_id;
		let current_date = moment(new Date()).format("YYYY-MM-DD");
		let sql = 'SELECT count(*) as cnt FROM `scrd_current_round` WHERE date(created) =?'; 
	    let checkRound = await db.query(sql,[current_date]);  
		// Check already bet confirmed
		const roundDate = moment(new Date()).format("YYYYMMDD")+5;
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
			points:points,
			no_0:allcards.no_0,
			no_1:allcards.no_1,
			no_2:allcards.no_2,
			no_3:allcards.no_3,
			no_4:allcards.no_4,
			no_5:allcards.no_5,
			no_6:allcards.no_6,
			no_7:allcards.no_7,
			no_8:allcards.no_8,
			no_9:allcards.no_9,
			no_10:allcards.no10,
			no_11:allcards.no11,
            no_12:allcards.no12,
            no_13:allcards.no13,
            no_14:allcards.no14,
            no_15:allcards.no15,
			nof0:faceCards.no_0,
			nof1:faceCards.no_1,
			nof2:faceCards.no_2,
			nof3:faceCards.no_3,  
			noaf0:allFaceCards.no_0,
			noaf1:allFaceCards.no_1,
			noaf2:allFaceCards.no_2,
			noaf3:allFaceCards.no_3,
		}  
	    let sql2 = `INSERT INTO round_report set ?`;
		let saveBet = await db.query(sql2,formData);

		let updateBal = userPoints - points;
		let saveBal = await saveUserPoints(updateBal,playerId); 
	 
        status  = 200;
        message = 'Bet Confirmed';
        data    = {playerId,balance:updateBal}
        return sendResponse(status,message,data);

    } catch (err){
        debug(err);
	}   
    
}

 
async function setRoundCount(){
	let D = new Date();
	let RoundCount = D.getTime();
	let date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    try {
		let current_date = moment(new Date()).format("YYYY-MM-DD");
		let sql1  = 'SELECT count(*) as cnt FROM `scrd_current_round` WHERE date(created) =?';  
    	let WinNo = GetRandomNo(0,15);
    	let WinX  = '2x'; 
     	let sql   = `INSERT INTO scrd_current_round (round_count, win_no , win_x) VALUES (?,?,?)`;
		let saveRound  = await db.query(sql,[RoundCount,WinNo,WinX]);  
		let checkRound = await db.query(sql1,[current_date]);   
		const date = moment(new Date()).format("YYYYMMDD")+5;
		let sql5 = `SELECT * FROM scrd_current_round ORDER by scrd_id DESC LIMIT 0,1`;
	    let roundData = await db.query(sql5); 
		const tRound = (parseInt(date)+parseInt((checkRound[0].cnt)))
		let sql2 = `UPDATE scrd_current_round SET round_count=? WHERE scrd_id = ?`;
		  await db.query(sql2,[tRound,roundData[0].scrd_id]);
	 
        return tRound;
    } catch (err){
        debug(err);
	}  

}





async function calcWinningNo(RoundCount){
	let message;
	let status =404;
	let data = {}
    try { 
		let sql = `SELECT * FROM scrd_current_round ORDER by scrd_id DESC LIMIT 0,1`;
	    let roundData = await db.query(sql); 

	    if(!isValidArray(roundData)) return sendResponse(status,"Unable to send winning no..",data);
	    let win_no = roundData[0].win_no; 
	    status  = 200;
        message = 'Winning No'; 
		data = {win_no}  
        return sendResponse(status,message,data);
    } catch (err){
        debug(err);
	}  
}

async function calcWinningPoints (){ 
 
	try {
		let playeWinningArray = [];   
		let sql4 = `SELECT * FROM scrd_current_round ORDER by scrd_id DESC LIMIT 1,1`;
		let roundData = await db.query(sql4);  
		if(!isValidArray(roundData)) return sendResponse(404,"Unable to send winning no..",{});
		let win_no = roundData[0].win_no;  
		let current_date = moment(new Date()).format("YYYY-MM-DD");
		let sql1         = 'SELECT count(*) as cnt FROM `scrd_current_round` WHERE date(created) =?';   
		let checkRound   = await db.query(sql1,[current_date]);  
		const date       = moment(new Date()).format("YYYYMMDD")+5;
		const RoundCount = (parseInt(date)+parseInt((checkRound[0].cnt))-1)  
		let sql =  `SELECT * FROM round_report WHERE game= ? AND round_count= ? AND status= ?`;
		let players = await db.query(sql,[2,RoundCount,1]);
		let winning_rate1 = 4
		let winning_rate2 = 16
		let winning_rate3 = 3
		if(isValidArray(players)){ 
			 
			for(let bet of players )
			{
				let win_points =  0;
				let {
					no_0,no_1,no_2,no_3,no_4,no_5,no_6,no_7,no_8,no_9,no_10,no_11,
					no_12,no_13,no_14,no_15,
					nof0,nof1,nof2,noaf0,nof3,noaf1,noaf2,noaf3,player_id,id} = bet;
				let userPoints = await getUserPoints(player_id); 
				 
				switch (win_no) {
					case 0: win_points = ((no_0 * winning_rate2)+(nof0 *winning_rate3)+(noaf0 * winning_rate1)); break;
					case 1: win_points = ((no_1 * winning_rate2)+(nof0 * winning_rate3)+(noaf1 *winning_rate1)); break;
					case 2: win_points = ((no_2 * winning_rate2)+(nof0 * winning_rate3)+(noaf2 *winning_rate1)); break;
					case 3: win_points = ((no_3 * winning_rate2)+(nof0 *winning_rate3)+(noaf3 * winning_rate1)); break;
					case 4: win_points = ((no_4 * winning_rate2)+(nof1 *winning_rate3)+(noaf0 * winning_rate1)); break;
					case 5: win_points = ((no_5 * winning_rate2)+(nof1 *winning_rate3)+(noaf1 * winning_rate1)); break;
					case 6: win_points = ((no_6 * winning_rate2)+(nof1 *winning_rate3)+(noaf2 * winning_rate1)); break;
					case 7: win_points = ((no_7 * winning_rate2)+(nof1 *winning_rate3)+(noaf3 * winning_rate1)); break;
					case 8: win_points = ((no_8 * winning_rate2)+(nof2 *winning_rate3)+(noaf0 * winning_rate1)); break;
					case 9: win_points = ((no_9 * winning_rate2)+(nof2 *winning_rate3)+(noaf1 * winning_rate1)); break;
					case 10: win_points =((no_10 * winning_rate2)+(nof2 *winning_rate3)+(noaf2 * winning_rate1)); break;
					case 11: win_points =((no_11 * winning_rate2)+(nof2 *winning_rate3)+(noaf3 * winning_rate1)); break;
					case 12: win_points =((no_12 * winning_rate2)+(nof3 *winning_rate3)+(noaf0 * winning_rate1)); break;
					case 13: win_points =((no_13 * winning_rate2)+(nof3 *winning_rate3)+(noaf1 * winning_rate1)); break;
					case 14: win_points =((no_14 * winning_rate2)+(nof3 *winning_rate3)+(noaf2 * winning_rate1)); break;
					case 15: win_points =((no_15 * winning_rate2)+(nof3 *winning_rate3)+(noaf3 * winning_rate1)); break;
				}  
			 
				const updateData = {
					winning_amount:win_points,
					win_no:win_no,
					is_winning_amount_add:1,
					status:2
				}
				sql = `UPDATE round_report SET ? WHERE id= ?`; 
				let update_sql = await db.query(sql,[updateData,id]);  
				if(win_points > 0){
					let updateBal  = userPoints + win_points;
					let saveBal = await saveUserPoints(updateBal,player_id); 
					playeWinningArray.push({status:200,win_no,player_id,win_points,balance:updateBal})
				} else{  
					playeWinningArray.push({status:200,win_no,player_id,win_points:0,balance:updateBal})
				} 
				
			} 
			return playeWinningArray 	
		} else{
			playeWinningArray.push({status:200,win_no,player_id:0,win_points:0,balance:0})
			return playeWinningArray
		} 
	} catch (error) { 
		return 500 
	}
     
}

 


module.exports = {getUserPoints,PreviousWinData,JoinGame,setRoundCount,calcWinningNo,calcWinningPoints};

