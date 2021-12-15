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

    answer(answers){
        let data = JSON.stringify({
            purp: "submit",
            data: { code: this.teamCode, answers: answers},
            time: Date.now(),
            id: this.id
        });
        this.socket.send(data);
    }
};

let conHandler = new ConnectionHandler();
let audio = new Audio();
let ctx, lastX, lastY;
let mousePressed = false;
let isCanvasRound = false;

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
        console.log(data.data);
        updateRound(data.data);
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
    else if (data.purp == "getround") {
        console.log(data.data);
        updateRound(data.data);
    } 
    else if (data.purp == "sub") {
        console.log(data.data);
        updateRound(data.data);

    } else if(data.purp == "confirmsub"){
        $('#submitSuccess').show();
    }
    else if (data.purp == "error") {
        console.log("Error: ", data.data.error);
    } 
    else {
        console.log("Error purpose not recognise");
    }
};

function initCanvas(){
    ctx = document.getElementById('canvas').getContext("2d");

    $('#canvas').mousedown(function (e) {
        mousePressed = true;
        Draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, false);
    });

    $('#canvas').mousemove(function (e) {
        if (mousePressed) {
            Draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, true);
        }
    });

    $('#canvas').mouseup(function (e) {
        mousePressed = false;
    });
	    $('#canvas').mouseleave(function (e) {
        mousePressed = false;
    });
}

function clearArea() {
    // Use the identity matrix while clearing the canvas
    ctx.clearRect(0, 0, ctx.canvas.width * 2, ctx.canvas.height * 2);
}

function Draw(x, y, isDown) {
    if (isDown) {
        ctx.beginPath();
        ctx.strokeStyle = $('#selColor').val();
        ctx.lineWidth = $('#selWidth').val();
        ctx.lineJoin = "round";
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.stroke();
    }
    lastX = x; lastY = y;
}

function updateRound(data) {
    if (data.round.round == 0) {
        console.log("please wait for quiz");
        $('#roundName').hide();
        $('#questionBlock').hide();
        $('#roundInfo').text("Please wait for the quiz to begin!");
        $('#roundInfo').show();
        $('#submitSuccess').hide();

        // please wait for quiz to begin
    }
    else if (data.round.round == -1) { 
        // end of quiz
        $('#roundName').hide();
        $('#questionBlock').hide();
        $('#roundInfo').text("End of quiz!");
        $('#roundInfo').show();
        $('#submitSuccess').hide();
    }
    else {
        if (data.open == false) {
            console.log("please wait for round");
            $('#roundName').show();
            $('#roundName').text("Round " + data.round.round + " - " + data.round.name);
            $('#questionBlock').hide();
            $('#roundInfo').text("Please wait for the next round to begin!");
            $('#roundInfo').show();
            $('#submitSuccess').hide();
            // please wait for round to begin
        }
        else {
            console.log("display question boxes");
            $('#submitSuccess').hide();
            $('#roundName').show();
            $('#roundName').text("Round " + data.round.round + " - " + data.round.name);
            $('#questionBlock').show();
            $('#answerBoxes').empty();
            isCanvasRound = false;
            for (let i = 1; i < 6; i++) {
                /*if(data.round.round == 5 && i == 2){
                    $('#answerBoxes').append(`Question ${i}: <br>  
                    <canvas id="canvas" width="300" height="300" style="width: 600px; height: 600px; border: 2px solid powderblue;"></canvas>
                    <br>
                    <button id="clearCanvas" class="btn draw-border">Clear</button>
                    <br><br>`);
                    initCanvas();
                    ctx = document.getElementById('canvas').getContext("2d");
                    ctx.scale(0.5, 0.5);
                    isCanvasRound = true;
                    $('#clearCanvas').click(function(){clearArea()});
                } else {*/
                    $('#answerBoxes').append(`Question ${i}:  <input class='answerBox' id='answer${i}' type='text' spellcheck='false'><br><br>`);
                //}
            }

            $('#roundInfo').hide();
            // display question boxes
        }
    }
}

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

    $('#submitRoundButton').click(function () {
        let x;
        if(isCanvasRound == true){
            x = {question1: $('#answer1').val(), question2: document.getElementById('canvas').toDataURL("image/png"), question3: $('#answer3').val(), question4: $('#answer4').val(), question5: $('#answer5').val()}; 
        }else{
            x = {question1: $('#answer1').val(), question2: $('#answer2').val(), question3: $('#answer3').val(), question4: $('#answer4').val(), question5: $('#answer5').val()};
        }
        conHandler.answer(x);
    });

});
