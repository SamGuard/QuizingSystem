fs = require('fs');

class ID {
    constructor(ip, id) {
        this.ip = ip;
        this.id = id;
    }
};

//Stores information about the 2 players
class Room {
    constructor(roomCode, hostID) {
        this.MAX_PLAYERS = 20;
        this.code = roomCode;
        this.clients = [];
        this.players = 0;

        this.addPlayer(hostID);

        this.hostID = hostID;
    }

    getClients(){
        return this.clients;
    }

    addPlayer(id) {
        if(this.players < this.MAX_PLAYERS){
            this.clients.push(id);
            this.players++;
        }
        return this.players-1;
    }

    isHost(id){
        if(compareID(id, this.hostID)){
            return true;
        } else {
            return false;
        }
    }
}


module.exports = {ID, Room, Map};