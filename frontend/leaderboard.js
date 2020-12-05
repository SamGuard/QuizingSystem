var password = "";


$(document).ready(function () {
    $('#password').on('input', function() {
        password = $("#password").attr("value");

        $.post("/answers", {"secret": password}, function(result) {
            console.log(result);
        });

        $.post("/answers", {"secret": password}, function(result) {
            let data = JSON.parse(result);
            let scores = [];
            for(let t = 0; t < data.length; t++){
                let score = 0;
                for(let r = 1; r <= 6; r++){
                    if(data[t].answers["round" + r.toString()]){
                        for(let q = 1; q <= 5; q++){
                            if(data[t].answers["round" + r.toString()]["question" + q.toString()].correct == true){
                                score++;
                            }
                        }
                    }
                }
                scores.push({name: data[t].teamName, score: score});
            }
            scores.sort(function(a, b){return b.score - a.score});
            $('#leaderboard').empty();
            for(let i = 0; i < scores.length; i++){
                $('#leaderboard').append(`<div class="markbox"> ${scores[i].name} ${scores[i].score}</div>`);
            }
        });
    });
});