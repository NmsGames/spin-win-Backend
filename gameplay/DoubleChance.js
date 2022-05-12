"use strict"
const debug = require("debug")("test");
const events = require("../Constants").events;
const commonVar = require("../Constants").commonVar;
const timerVar = require("../Constants").timerVar;
const state = require("../Constants").state;
const gameId   = 1;
const gameRoom = require("../Constants").SelectGame[gameId];
const {PreviousWinData,calcWinningPoints,JoinGame,setRoundCount,calcWinningNo } = require("../services/DoubleChanceGame");
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

function StartDoubleChanceTimerGame(data){
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
        previousWinData:previousWinData,  
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


 
//Send Winning number
async function sendWinningNo() {
	let winArr = await calcWinningNo();
	Sockets.to(gameRoom).emit(events.OnWinNo,winArr); 
	return true;
}

 
//game timers------------------------------------------
async function CalculatePoints(){ 
	console.log('CalculatePoints')
	let PlayerWinBets = await calcWinningPoints();  
	if(PlayerWinBets != 404){
		const datas = {
			status:200,
			data:{
				outer_win:PlayerWinBets[0].outer_win,
				inner_win:PlayerWinBets[0].inner_win,
				win_points:PlayerWinBets[0].win_points,
				player_id:PlayerWinBets[0].player_id,
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
	    Sockets.to(gameRoom).emit(events.OnTimerStart);
	    debug("betting...");
	    OnTimerStart();
	}

	async function OnTimerStart() {
	    timer--;
	    switch (timer) {
			case  59:
	            debug("calculate amount")
				await CalculatePoints()
		        break;   
	        case  12:
	            debug("stop betting")
		        Sockets.to(gameRoom).emit(events.OnTimeUp);
		        break;    
	        case  6: 
	            gameState = state.cannotBet;
	            debug("winning no calculate")
		    	sendWinningNo(Sockets.id)
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
	
 

//---------------Send API Timer------------------------------
	async function gameTimer() {
	    return new Promise((resolve) => {
	        resolve(timer)
	    });
	}
//----------------------END----------------------------------

module.exports.StartDoubleChGame = StartDoubleChanceTimerGame;
module.exports.GetSocket = GetSocket;
module.exports.gameTimer = gameTimer;