"use strict"
const debug = require("debug")("test");
const events = require("../Constants").events;
const commonVar = require("../Constants").commonVar;
const timerVar = require("../Constants").timerVar;
const state = require("../Constants").state;
const gameId   = 2;
const gameRoom = require("../Constants").SelectGame[gameId];
const {PreviousWinData,JoinGame,setRoundCount,calcWinningNo,calcWinningPoints} = require("../services/SixteenCardsGame");
const playerManager   = require('../utils/PlayerDataManager');


let Sockets;
let gameState;
let RoundCount;
let timer = timerVar.bettingTimer;
 
let previousWinData = new Array(10);
 
function GetSocket(SOCKET) {
    Sockets = SOCKET;
    ResetTimers(); 
}

function StartSixteenCardsTimerGame(data){
	SendCurrentRoundInfo(data);
	OnSendTimer(data)
	OnSendUserInfo(data)
	OnPlaceBet(data);
	OnleaveGameRoom(data);
}

function OnleaveGameRoom(data){
	let socket = data[commonVar.socket];
	socket.on(events.onleaveRoom,function(data){  
	    try{
		    socket.leave(gameRoom);
		    socket.removeAllListeners(events.OnTimer);
		    socket.removeAllListeners(events.OnUserInfo);
		    socket.removeAllListeners(events.OnPlaceBet);
            socket.removeAllListeners(commonVar.test);
            socket.removeAllListeners(events.onleaveRoom);
            socket.removeAllListeners(events.OnTakeAmount);
            socket.emit(events.onleaveRoom,{success:`successfully leave ${gameRoom} game.`});
	    }catch(err){
	        debug(err);
	    }
	})
}

async function SendCurrentRoundInfo(data) {
    let socket = data[commonVar.socket];
    let player = playerManager.GetPlayerData(socket.id);
    let previousWinData = await PreviousWinData(RoundCount); 
    let obj = {
    	balance : player.balance,
        gametimer:timer, 
        previousWinData:previousWinData 
    }
    socket.emit(events.OnCurrentTimer, obj)
}



function OnSendTimer(data){
	let socket = data[commonVar.socket];
	socket.on(events.OnTimer, async (data) => {
		let result = (timer) ? timer : 0   
    	socket.emit(events.OnTimer, {result});
    })
}


function OnSendUserInfo(data){
	let socket = data[commonVar.socket];
	socket.on(events.OnUserInfo, () => {
		SendCurrentRoundInfo(data)
    })
}

function OnPlaceBet(data) {
	let socket = data[commonVar.socket];
    socket.on(events.OnPlaceBet, async(data) => {
    	let result = await JoinGame(data,RoundCount,gameState);  //db 
    	Sockets.to(gameRoom).emit(events.OnPlaceBet, result);
    });
}

 

async function sendWinningNo() {
	let winArr = await calcWinningNo(RoundCount);
	Sockets.to(gameRoom).emit(events.OnWinNo,winArr); 
	return true;
}



 
//game timers------------------------------------------
// calculate amount
async function CalculatePoints(){ 
	let PlayerWinBets = await calcWinningPoints();   
	if(PlayerWinBets[0].status ==200){
		const datas = {
			status:200,
			data:{
				win_no:PlayerWinBets[0].win_no, 
				win_points:PlayerWinBets[0].win_points,
				player_id:PlayerWinBets[0].player_id,
				balance:PlayerWinBets[0].balance,

			}
		}
		Sockets.to(gameRoom).emit(events.OnWinAmount,datas); 
	}else{
		const datas = {
			status:200,
			data:{
				win_no:PlayerWinBets[0].win_no, 
				win_points:0,
				player_id:0,
				balance:PlayerWinBets[0].balance,

			}
		}
		Sockets.to(gameRoom).emit(events.OnWinAmount,datas); 
	} 
	
}
	async function ResetTimers() {
		timer = timerVar.bettingTimer;
		gameState = state.canBet;
		RoundCount = await setRoundCount();
		console.log('round start',RoundCount)
	    Sockets.to(gameRoom).emit(events.OnTimerStart);
	    debug("betting...");
	    OnTimerStart();
	}

	async function OnTimerStart() {
	    timer--;
	    switch (timer) {
			case  59:
	            debug("Calculate winning betting")
		   await CalculatePoints();
		        break;  
	        case  12:
	            debug("stop betting")
		        Sockets.to(gameRoom).emit(events.OnTimeUp);
		        break;    
	        case  6: 
	            gameState = state.cannotBet;
	            debug("winning no calculate")
		    	sendWinningNo()
	            break;
	        case  0:
		        await sleep(timerVar.intervalDalay);
		        debug("Waiting...");
		        ResetTimers(); 
		        return;     
        }

	    await sleep(timerVar.delay);
	    OnTimerStart();
	}

	function sleep(ms) {
	    return new Promise((resolve) => {
	        setTimeout(resolve, ms);
	    });
	}
	
//game timers-----------------END-------------------------




//---------------Send API Timer------------------------------
	async function gameTimer() {
	    return new Promise((resolve) => {
	        resolve(timer)
	    });
	}
//----------------------END----------------------------------





module.exports.StartSixteenCrdGame = StartSixteenCardsTimerGame;
module.exports.GetSocket = GetSocket;
module.exports.gameTimer = gameTimer;