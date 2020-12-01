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
        this.quiz = fs.readFileSync("./server/questions.json");

        this.round = 1;
        this.q = 1;


    }

    getQuestion(){
        return {"round": this.round, "quest": this.q};
    }

    forward(){
        if(this.q == this.quiz.questions){
            if(this.round == this.quiz.rounds.length){
                return {"round": -1, "quest": -1};
            }
            this.round++;
            this.q = 1;
        } else {
            this.q++;
        }
        return getQuestion();
    }

    backward(){
        if(this.q == 1){
            if(this.round == 1){
                return {"round": -1, "quest": -1};
            }
            this.round--;
            this.q = 1;
        } else {
            this.q--;
        }
        return getQuestion();
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
        fs.writeFile("./server/answers/" + this.code + ".json", JSON.stringify(this.data), function(err){
            if(err){console.log(err);}
        });
    }
}


module.exports = {ID, Team, Quiz};