const http = require('http');//For the http server
const webSocketServer = require("websocket").server;
const app = require("./server/app");//Controls the http routing
const shortID = require("short-id");//Used to generate the room codes
const {ID, Room, Map} = require('./server/classes.js')


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

rooms = [];//Stores all the rooms

//Generates an id for the room code
function genCode() {
    return shortID.generate().toLowerCase();
}

//This should be implemented, basically a way of filtering IPs. Such as multiple users from the same IP
//Not really necessary for us tho
function isOriginAllowed(ip) {
    return true;
}

//Starts a new room and sets host
function addRoom(id) {
    let code = genCode();//Rooms code
    rooms.push(new Room(code, id));
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
function findRoomByCode(roomCode) {
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].code == roomCode) {
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
//The message is coming from
function setID(mess, conn) {
    conn.id = new ID(conn.remoteAddress, mess.id);
}

//Calls addRoom and send back the data, not too sure why its in 2 seperate functions tho
function createRoom(mess, conn) {
    conn.sendUTF(JSON.stringify({
        purp: "createroom",
        data: { roomCode: addRoom(conn.id) },
        time: Date.now(),
        id: conn.id.id
    }));
}

//Allows a client to join an existing room given a room code, as well as sends out a 
//Message to all other clients saying another player has connected
function joinRoom(mess, conn) {
    conn.id = new ID(conn.remoteAddress, mess.id);
    let roomIndex = findRoomByCode(mess.data.roomCode);

    if (roomIndex != -1) {
        conn.sendUTF(JSON.stringify({
            purp: "joinroom",
            data: { roomCode: rooms[roomIndex].code, playerNumber: rooms[roomIndex].addPlayer(new ID(conn.remoteAddress, mess.id)) },
            time: Date.now(),
            id: conn.id.id
        }));

        let clients = rooms[roomIndex].getClients();

        for(let i = 0; i < clients.length; i++){
            let connIndex = findPlayerByID(clients[i]);
            connections[connIndex].sendUTF(JSON.stringify({
                purp: "updateWaitingRoom",
                data: { numPlayers: clients.length },
                time: Date.now(),
                id: connections[connIndex].id.id
            }));
        }
    } else {
        conn.sendUTF(JSON.stringify({
            purp: "joinroom",
            data: { roomCode: -1 },
            time: Date.now(),
            id: conn.id.id
        }));
    }
}

//Starts game on all players, can only be done by host
function startRoom(mess, conn){
    let roomID = findRoomByCode(mess.data.roomCode);
    if(roomID != -1 && rooms[roomID].isHost(conn.id)){
        let clients = rooms[roomID].getClients();
        let mapData = rooms[roomID].getMap();
        for(let i = 0; i < clients.length; i++){
            let conn = findPlayerByID(clients[i]);
            connections[conn].sendUTF(JSON.stringify({
                purp: "start",
                data: {map: mapData},
                time: Date.now(),
                id: connections[conn].id.id
            }));
        }
    }
}

//Removes room, can only be done by host
function destroyRoom(mess, conn) {
    let roomID = new ID(conn.remoteAddress, mess.roomID);
    let roomIndex = findRoomByCode(roomID);
    if (roomIndex != -1 && rooms[roomID].isHost(conn.id)) {
        rooms.splice(roomIndex, 1);
    }
}

//Removes player from room
function removePlayer(id) {
    let playerIndex = findPlayerByID(id);

    if (playerIndex != -1) {
        connections.splice(playerIndex, 1);
    } else {
        return;
    }

    for(let i = 0; i < rooms.length; i++){
        for(let j = 0; j < rooms[i].clients.length; j++){
            if(compareID(id, rooms[i].clients[j]) == true){
                rooms[i].clients.splice(j, 1);
                if(rooms[i].length == 0){
                    rooms.splice(i, 1);
                }
                return;
            }
        }
    }

}

//Requests the game state to change, can only be done by host
//This is things such as: accept responses, next question etc 
function req(mess, conn){
    let roomID = mess.data.roomCode;
    let data = mess.data.objects;
    let player = mess.data.player;

    let room = findRoomByCode(roomID);
    if(room.isHost(conn.id)){
        let dataOut = rooms[room].updateGame(data, player);
        let clients = rooms[room].getClients();
        for(let i = 0; i < clients.length; i++){
            let connIndex = findPlayerByID(clients[i]);
            connections[connIndex].sendUTF(JSON.stringify({
                purp: "update",
                data: {objects: dataOut.objects, players: dataOut.players},
                time: Date.now(),
                id: connections[connIndex].id.id
            }));   
        }
    }
}

function endGame(mess, conn){
    let roomID = mess.data.roomCode;
    let data = mess.data.objects;

    let room = findRoomByCode(roomID);
    let clients = rooms[room].getClients();

    for(let i = 0; i < clients.length; i++){
        let connIndex = findPlayerByID(clients[i]);
        connections[connIndex].sendUTF(JSON.stringify({
            purp: "end",
            data: {},
            time: Date.now(),
            id: connections[connIndex].id.id
        }));   
    }
}


//Needs replacing (if its actually needed)
function newGame(mess, conn){
    let roomID = mess.data.roomCode;
    let data = mess.data.objects;

    let room = findRoomByCode(roomID);

    rooms[room].newMap();

    startRoom(mess, conn);
}

function handleMessage(mess, conn) {
    mess = JSON.parse(mess);
    if (mess.purp == "setid") {
        setID(mess, conn);
    } else if (mess.purp == "createroom") {
        createRoom(mess, conn);
    } else if (mess.purp == "joinroom") {
        joinRoom(mess, conn);
    } else if(mess.purp == "startroom"){
        startRoom(mess, conn);
    } else if (mess.purp == "destroyroom") {
        destroyRoom(mess, conn);
    } else if(mess.purp == "req"){
        req(mess, conn);
    } else if(mess.purp == "end"){
        endGame(mess, conn);
    } else if(mess.purp == "newGame"){
        newGame(mess, conn);
    } else {
        conn.sendUTF(JSON.stringify({
            purp: "error",
            data: { error: "Purpose not recognise" },
            time: Date.now(),
            id: mess.id
        }));
    }
}

var WebSocketServer = require('websocket').server;

wss = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

let connections = [];

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