"use strict"
const JoinRoom = require("./JoinRoom").JoinRoom;
const debug = require("debug")("test");
const commonVar = require("../Constants").commonVar;
const selectGame = require("../Constants").SelectGame;
const StartFunTrGame     = require("../gameplay/FunTargetTimer").StartFunTrGame; 
const StartDoubleChGame  = require("../gameplay/DoubleChance").StartDoubleChGame;  
const StartSixteenCrdGame= require("../gameplay/SixteenCards").StartSixteenCrdGame;  
const Spin2CrdGame = require("../gameplay/Spin2Timer").StartSpin2Game;  
async function MatchPlayer(data) {

    let result = await JoinRoom(data);
    if (result.result === commonVar.success) {
        debug("successfully Match the room " + result[commonVar.roomName]);
        data[commonVar.roomName] = result[commonVar.roomName];
    }  
    switch (data[commonVar.roomName]) {
    	case selectGame[1]: StartDoubleChGame(data);break;
        case selectGame[2]: StartSixteenCrdGame(data);break;
        case selectGame[3]: StartFunTrGame(data); break;
        case selectGame[4]: Spin2CrdGame(data); break;
        default :  break;
    }
}

module.exports.MatchPlayer = MatchPlayer;