const http = require('http');//For the http server
const webSocketServer = require("websocket").server;
const app = require("./server/app");//Controls the http routing
const shortID = require("short-id");//Used to generate the room codes
const sha256 = require("sha256");
const {ID, Team, Quiz} = require('./server/classes.js')

//Has to be global as needed in the api and socket
global.quiz = new Quiz();
global.teams = [];//Stores all the rooms
global.connections = [];

const port = process.env.PORT || 3000;//Use port 3000 unless process.env.PORT is set as this variable is set when deployed to heroku

const server = http.createServer(app);//Creates the http server using app.js

server.listen(port);//Listen for incoming connections

console.log("listening on port " + port);


//WebSocketServer
/*

WebSocketServer message structure:
{
    purp (purpose of the message),
    data {} (object containing more information if needed),
    time (UTC time),
    id (id of the user the message if comming from or being sent to)
}

When the server recieves a message over the socket its purpose must have a purpose
of either:
createroom - to create a new room
joinroom - to join a room
start - to let the players know to start the game
req - request for the game state to change, can only be used by host of the game <-----------------IMPORTANT ONE
error - if something has gone wrong  

All socket messeges go into the function handleMessage
*/


//ID stores the ID of each user to connect, this is so people using the same IP can play

//--------------------------
// MORE CODE IN classes.js |
//--------------------------

let teams = global.teams;
let quiz = global.quiz;


for(let i = 0; i < 100; i++){
    teams.push(new Team(i.toString(), null));
}

//This should be implemented, basically a way of filtering IPs. Such as multiple users from the same IP
//Not really necessary for us tho
function isOriginAllowed(ip) {
    return true;
}

//Starts a new room and sets host
function addRoom(id) {
    let code = genCode();//Rooms code
    teams.push(new Room(code, id));
    console.log("Created room, IP: " + id.ip + " room code: " + code);
    return code;
}

//Compares two ID's
function compareID(id1, id2) {
    if (id1.ip == id2.ip && id1.id == id2.id) {
        return true;
    }
    return false;
}

//finds a room by its room code
function findTeamByCode(code) {
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].code == code) {
            return i;
        }
    }
    return -1;
}

//Finds a player in a room by the players ID
function findPlayerByID(id) {
    for (let i = 0; i < connections.length; i++) {
        if (connections[i].id && compareID(id, connections[i].id)) {
            return i;
        }
    }
    return -1;
}

//When a new client connects, this function is called to give it an ID so we can identify who
//The message is coming from. Takes a team code and team name
function setID(mess, conn) {
    conn.id = new ID(conn.remoteAddress, mess.id);
}

function joinTeam(mess, conn){
    let code = mess.data.code;
    if(code == undefined){
        console.log("error in set id");
        return;
    }

    let teamIndex = findTeamByCode(code);

    if(teamIndex == -1) { // team code doesn't exist
        conn.sendUTF(JSON.stringify({
            purp: "jointeam",
            data: { success: false },
            time: Date.now(),
            id: mess.id
        }));
        return;
    }
    
    let team = teams[teamIndex];
    if(team.name == null && mess.data.name != null){
        team.name = mess.data.name;
    }

    conn.sendUTF(JSON.stringify({
        purp: "jointeam",
        data: { success: true, name: team.name },
        time: Date.now(),
        id: mess.id
    }));
}

function getQuest(mess, conn){
    conn.sendUTF(JSON.stringify({
        purp: "getquest",
        data: { quest: quiz.getQuestion() },
        time: Date.now(),
        id: mess.id
    }));
    return;
}

function submit(mess, conn){
    if(quiz.isOpen == false){
        return;
    }
    let code = mess.data.code;
    if(code == undefined){
        console.log("error in submit");
        return;
    }

    let teamIndex = findTeamByCode(code);

    if(teamIndex == -1){
        conn.sendUTF(JSON.stringify({
            purp: "error",
            data: { error: "incorrect team code" },
            time: Date.now(),
            id: mess.id
        }));
        return;
    }

    let team = teams[teamIndex];

    team.addAnswer(quiz.round, quiz.q, mess.data.answer + mess.time);
}

function handleMessage(mess, conn) {
    mess = JSON.parse(mess);
    if (mess.purp == "setid") {
        setID(mess, conn);
    } else if(mess.purp == "jointeam"){
        joinTeam(mess, conn)
    } else if(mess.purp == "getquest"){
        getQuest(mess, conn);
    } else if(mess.purp == "submit"){
        submit(mess, conn);
    } else {
        conn.sendUTF(JSON.stringify({
            purp: "error",
            data: { error: "Purpose not recognise" },
            time: Date.now(),
            id: mess.id
        }));
    }
}

function removePlayer(conn){
    let playerIndex = findPlayerByID(conn.id);
    if(playerIndex == -1){
        return;
    }

    connections.splice(playerIndex, 1);
}


var WebSocketServer = require('websocket').server;

wss = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

let connections = global.connections;

wss.on('request', function (request) {
    if (!isOriginAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted. IP: ' + connection.remoteAddress);

    connection.on('message', function (message) {
        //console.log('Received Message: ' + message.utf8Data);
        handleMessage(message.utf8Data, connection);
    });
    connection.on('close', function (reasonCode, description) {
        removePlayer(connection.id);
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

    connections.push(connection);

});