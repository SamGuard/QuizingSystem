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
        this.q = 0;
    }

    open() {
        this.isOpen = true;
        let connections = global.connections;
        for (let i = 0; i < connections.length; i++) {
            connections[i].sendUTF(JSON.stringify({
                purp: "sub",
                data: { open: true, quest: this.getQuestion() },
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
                data: { open: false, quest: this.getQuestion() },
                time: Date.now(),
                id: connections[i].id.id
            }));
        }
    }

    getQuestion() {
        return { "round": this.round, "quest": this.q };
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
        if (this.q != -1 || this.round != -1) {
            if (this.q == this.quiz["round" + this.round.toString()].questions) {
                if (this.round == this.quiz.rounds) {
                    this.q = -1;
                    this.round = -1;
                } else {
                    this.round++;
                    this.q = 0;
                }
            } else {
                this.q++;
            }
        }

        let connections = global.connections;
        for (let i = 0; i < connections.length; i++) {
            connections[i].sendUTF(JSON.stringify({
                purp: "getquest",
                data: { quest: this.getQuestion(), round: this.quiz["round" + this.getQuestion().round.toString()] },
                time: Date.now(),
                id: connections[i].id.id
            }));
        }

        return this.getQuestion();
    }

    backward() {
        if (this.q == -1 || this.round == -1) {
            this.round = this.quiz.rounds;
            this.q = this.quiz["round" + this.round.toString()].questions;
        } else if (this.q == 0) {
            if (this.round != 0) {
                this.round--;
                this.q = this.quiz["round" + this.round.toString()].questions;
            }
        } else {
            this.q--;
        }

        let connections = global.connections;
        for (let i = 0; i < connections.length; i++) {
            connections[i].sendUTF(JSON.stringify({
                purp: "getquest",
                data: { round: this.quiz["round" + this.getQuestion().round.toString()] },
                time: Date.now(),
                id: connections[i].id.id
            }));
        }

        return this.getQuestion();
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