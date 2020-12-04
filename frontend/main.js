function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

class ConnectionHandler {
    constructor() {
        this.isHost = true;
        this.gameRunning = false;
        this.teamCode = null;
        this.teamName = null;
        this.playerNames = null;
        this.id = makeid(12);
        console.log("Your id is: " + this.id);

        this.IP = null;

        //When testing this on my local machine the protocol is http so this 
        //automatically switches the connection type
        if (location.protocol == "https:") {
            this.IP = "wss://" + window.location.host;
        } else {
            this.IP = "ws://" + window.location.host;
        }
        this.socket = new WebSocket(this.IP);
        
    }

    joinTeam() {
        let data = JSON.stringify({
            purp: "jointeam",
            data: { code: this.teamCode, name: this.teamName, playerNames: this.playerNames },
            time: Date.now(),
            id: this.id
        });
        this.socket.send(data);
    }

    getQuestion(){
        let data = JSON.stringify({
            purp: "getquest",
            data: {},
            time: Date.now(),
            id: this.id
        });
        this.socket.send(data);
    }

    answer(){
        let data = JSON.stringify({
            purp: "submit",
            data: { code: this.teamCode, answers: {question1: "1", question2:"awdad", question3: "112341"} },
            time: Date.now(),
            id: this.id
        });
        this.socket.send(data);
    }
};

let conHandler = new ConnectionHandler();
let audio = new Audio();

conHandler.socket.onopen = function (e) {
    let data = JSON.stringify({
        purp: "setid",
        data: {},
        time: Date.now(),
        id: conHandler.id
    });
    conHandler.socket.send(data);

    console.log("[open] Connection established");
};

conHandler.socket.onmessage = function (event) {
    //console.log(`[message] Data received from server: ${event.data}`);
    let data = JSON.parse(event.data);

    if (data.id != conHandler.id) {
        console.log("Invalid ID: " + data.id);
        return;
    }

    if (data.purp == "jointeam") {
        if (data.data.success == false) {
            console.log("Failed to joined team");
            conHandler.teamCode = null;
            return;
        }
        conHandler.teamName = data.data.name;
        console.log("Joined team");
        $('#codePage').hide();
        if (conHandler.teamName == null) {
            $('#namePage').show();
            $('#questionPage').hide();
        }
        else {
            $('#teamNameTitle').text("Team: " + conHandler.teamName);
            $('#questionPage').show();
            $('#namePage').hide();
        }
        
        //Change screen or something
    } 
    else if (data.purp == "getquest") {
        console.log(data.data.quest);
    } 
    else if (data.purp == "sub") {
        console.log(data.data);
    } 
    else if (data.purp == "error") {
        console.log("Error: ", data.data.error);
    } 
    else {
        console.log("Error purpose not recognise");
    }

};

conHandler.socket.onclose = function (event) {
    if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
        console.log('[close] Connection died');
    }
    alert("Lost connection please refresh the page");
};

conHandler.socket.onerror = function (error) {
    console.log(`[error] ${error.message}`);
};

$(document).ready(function () {
    $('#codePage').show();
    $('#namePage').hide();
    $('#questionPage').hide();

    $('#submitCodeButton').click(function () {
        conHandler.teamCode = $('#codeInput').val();
        conHandler.joinTeam();
    });

    $('#submitNameButton').click(function () {
        conHandler.teamName = $('#nameInput').val();
        conHandler.playerNames = $('#playerNamesInput').val();
        conHandler.joinTeam();
    });

    $('#getQuestionButton').click(function () {
        conHandler.getQuestion();
        conHandler.answer();

    });

});