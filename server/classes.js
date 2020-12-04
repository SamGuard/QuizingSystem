const { throws } = require('assert');

fs = require('fs');

class ID {
    constructor(ip, id) {
        this.ip = ip;
        this.id = id;
    }
};

class Quiz{
    constructor(){
        this.quiz = JSON.parse(fs.readFileSync("./server/questions.json"));
        
        this.isOpen = false;
        this.round = 0;
        this.q = 0;


    }

    open(){
        this.isOpen = true;
        let connections = global.connections;
        for(let i = 0; i < connections.length; i++){
            connections[i].sendUTF(JSON.stringify({
                purp: "sub",
                data: { open: true, quest: this.getQuestion() },
                time: Date.now(),
                id: connections[i].id.id
            }));
        }
    }

    close(){
        this.isOpen = false;
        let connections = global.connections;
        for(let i = 0; i < connections.length; i++){
            connections[i].sendUTF(JSON.stringify({
                purp: "sub",
                data: { open: false, quest: this.getQuestion() },
                time: Date.now(),
                id: connections[i].id.id
            }));
        }
    }

    getQuestion(){
        return {"round": this.round, "quest": this.q};
    }

    forward(){
        if(this.q != -1 || this.round != -1){
            if(this.q == this.quiz["round" + this.round.toString()].questions){
                if(this.round == this.quiz.rounds){
                    this.q = -1;
                    this.round = -1;
                } else{
                    this.round++;
                    this.q = 0;
                }
            } else {
                this.q++;
            }
        }
        return this.getQuestion();
    }

    backward(){
        if(this.q == -1 || this.round == -1){
            this.round = this.quiz.rounds;
            this.q = this.quiz["round" + this.round.toString()].questions;
        } else if(this.q == 0){
            if(this.round != 0){
                this.round--;
                this.q = this.quiz["round" + this.round.toString()].questions;
            }
        } else {
            this.q--;
        }
        return this.getQuestion();
    }
}

//Stores information about the 2 players
class Team {
    constructor(code, name, playerNames){
        this.code = code;
        this.name = name;

        this.data = {
            code: this.code,
            teamName: this.name,
            playerNames: playerNames,
            answer: {}
        };
    }

    addAnswer(round, ques, ans){
        if(this.data.answer["round" + round.toString()] == undefined){
            this.data.answer["round" + round.toString()] = {};
        }
        this.data.answer["round" + round.toString()]["question" + ques.toString()] = {answer: ans, correct: false, marked: false};
        fs.writeFile("./server/answers/" + this.code + ".json", JSON.stringify(this.data, null, 2), function(err){
            if(err){console.log(err);}
        });
    }
}


module.exports = {ID, Team, Quiz};