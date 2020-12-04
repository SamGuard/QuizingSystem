const { throws } = require('assert');

fs = require('fs');

class ID {
    constructor(ip, id) {
        this.ip = ip;
        this.id = id;
    }
};

class Quiz {
    constructor() {
        this.quiz = JSON.parse(fs.readFileSync("./server/questions.json"));

        this.isOpen = true;
        this.round = 0;
    }

    open() {
        this.isOpen = true;
        let connections = global.connections;
        for (let i = 0; i < connections.length; i++) {
            connections[i].sendUTF(JSON.stringify({
                purp: "sub",
                data: { open: true, round: this.getRound() },
                time: Date.now(),
                id: connections[i].id.id
            }));
        }
    }

    close() {
        this.isOpen = false;
        let connections = global.connections;
        for (let i = 0; i < connections.length; i++) {
            connections[i].sendUTF(JSON.stringify({
                purp: "sub",
                data: { open: false, round: this.getRound() },
                time: Date.now(),
                id: connections[i].id.id
            }));
        }
    }

    getRound(){
        if(this.round != -1 && this.q != -1){
            let x = this.quiz["round" + this.round.toString()];
            x.round = this.round;
            return x;
        } else {
            return {round: -1, questions: -1, name: "Quiz End"};
        }
    }

    forward() {
        if(this.round != -1){
            if (this.round == this.quiz.rounds) {
                this.round = -1;
            } else {
                this.round++;
            }
        } 

        let connections = global.connections;
        for (let i = 0; i < connections.length; i++) {
            connections[i].sendUTF(JSON.stringify({
                purp: "getround",
                data: { round: this.getRound() },
                time: Date.now(),
                id: connections[i].id.id
            }));
        }

        return this.getRound();
    }

    backward() {
        if(this.round == -1){
            this.round = this.quiz.rounds;
        } else if(this.round > 0){
            this.round--;
        }

        let connections = global.connections;
        for (let i = 0; i < connections.length; i++) {
            connections[i].sendUTF(JSON.stringify({
                purp: "getround",
                data: { round: this.getRound() },
                time: Date.now(),
                id: connections[i].id.id
            }));
        }

        return this.getRound();
    }
}

//Stores information about the 2 players
class Team {
    constructor(code) {
        this.code = code;
        this.isSetup = false;
    }

    setup(name, playerNames){
        this.name = name;
        

        this.data = {
            code: this.code,
            teamName: this.name,
            playerNames: playerNames,
            answers: {}
        };

        this.isSetup = true;
    }

    addAnswers(round, questions, ans) {
        if(this.isSetup == false){
            console.log("Cannot add answer, team not setup");
            return -1;
        }

        for(let i = 1; i <= questions; i++){
            if (this.data.answers["round" + round.toString()] == undefined) {
                this.data.answers["round" + round.toString()] = {};
            }

            this.data.answers["round" + round.toString()]["question" + i.toString()] = {answer: ans["question" + i.toString()], correct: false, marked: false};
        }

        this.save();
    }

    save(){
        fs.writeFile("./server/answers/" + this.code + ".json", JSON.stringify(this.data, null, 2), function(err){
            if(err){console.log(err);}
        });
    }
}


module.exports = { ID, Team, Quiz };