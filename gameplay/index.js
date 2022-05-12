const SendSocketToFunTimer = require("./FunTargetTimer").GetSocket; 
const SendSocketToDoubleChance = require("./DoubleChance").GetSocket;
const SendSocketToSxTeenCard = require("./SixteenCards").GetSocket; 
const SendSocketToSpin2 = require("./Spin2Timer").GetSocket;

function sendSocket(socket){
    SendSocketToFunTimer(socket)
    SendSocketToSxTeenCard(socket)
    SendSocketToDoubleChance(socket)
    SendSocketToSpin2(socket)
}

module.exports.sendSocket = sendSocket;