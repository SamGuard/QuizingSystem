$.post("/answers", {"secret": password}, function(result) {
    console.log(result);
});

var qnum = 1;
var roundnum = 0;
var password = "";

function dispans(response) {
    console.log("updating the answers");
    $("#markboxes").empty();
    for (var i = 0; i < response.length; i++) {
        console.log(response[i]);
        if(!response[i].answers["round"+roundnum]){
            continue;
        }
        /*if (roundnum == 5 && qnum == 2) {
            // image question 300x300
            $("#markboxes").append(
                $("<div>").prop({
                    id: response[i].code,
                    className: 'markbox',
                    innerHTML: response[i].teamName + "<br><img src='" + response[i].answers["round"+roundnum]["question"+qnum].answer + "'>",
                    value: "0",
                    style: "height: 350px"
                })
            );
        } else {*/
            $("#markboxes").append(
                $("<div>").prop({
                    id: response[i].code,
                    className: 'markbox',
                    innerHTML: response[i].teamName + "<br>" + response[i].answers["round"+roundnum]["question"+qnum].answer,
                    value: "0"
                })
            );
        //}

        if (response[i].answers["round"+roundnum]["question"+qnum].marked) {
            if (response[i].answers["round"+roundnum]["question"+qnum].correct) {
                $("#"+ response[i].code).css("background-color", "#80ff80")
            } else {
                $("#"+ response[i].code).css("background-color", "#ff8080")
            }
        }
        // 0:unmarked, 1:correct, 2:incorrect, 3:censored
        $("#"+ response[i].code).click(function () {
            // console.log($(this).attr("value"));
            var state = parseInt($(this).attr("value"));
            state++;
            if (state > 3) {
                state = 0;
            }

            var correct = "false";
            if (state == 1) {
                correct = "true";
            }

            switch (state) {
                case 0:
                    $(this).css("color", "black")
                    $(this).css("background-color", "#f0f0f0")
                    if (roundnum == 5 && qnum == 2) {
                        $(this).children('img').eq(0).css("visibility", "visible");
                    }
                    break;
                case 1:
                    $(this).css("background-color", "#80ff80")
                    break;
                case 2:
                    $(this).css("background-color", "#ff8080")
                    break;
                case 3:
                    $(this).css("color", "#808080")
                    $(this).css("background-color", "#808080")
                    if (roundnum == 5 && qnum == 2) {
                        $(this).children('img').eq(0).css("visibility", "hidden");
                    }
                    break;
            }

            $.post("/mark", {"secret": password, "round": roundnum, "question" : qnum, "code": $(this).attr("id"), "correct": correct}, function(result) {
                console.log(result);
            });
            console.log(state);
            $(this).attr("value", ""+state);
        });
    }
}

$(document).ready(function () {

    $("#roundno").text("Round: " + roundnum);
    $("#questionno").text("Question: " + qnum);

    password = $("#password").attr("value");
    $("#password").change(function () {
        password = $("#password").attr("value");
        console.log(password);
    });

    $("#prev").click(function () {
        console.log("prev");
        $.post("/control", {"secret": password, "command": "prev"}, function(result) {
            console.log(result);
            var response = JSON.parse(result);
            if (roundnum != response.round) {
                qnum = 1;
            }
            roundnum = response.round;
            $("#roundno").text("Round: " + response.round);
            $.post("/answers", {"secret": password}, function(result) {
                var response = JSON.parse(result);
                dispans(response);
            });
        });
    });

    $("#next").click(function () {
        console.log("next");
        $.post("/control", {"secret": password, "command": "next"}, function(result) {
            console.log(JSON.parse(result));
            var response = JSON.parse(result);
            if (roundnum != response.round) {
                qnum = 1;
            }
            roundnum = response.round;
            $("#roundno").text("Round: " + response.round);
            $.post("/answers", {"secret": password}, function(result) {
                var response = JSON.parse(result);
                dispans(response);
            });
        });
    });

    $("#open").click(function () {
        console.log("open");
        $.post("/control", {"secret": password, "command": "open"}, function(result) {
            console.log(result);
        });
    });

    $("#close").click(function () {
        console.log("close");
        $.post("/control", {"secret": password, "command": "close"}, function(result) {
            console.log(result);
        });
        $.post("/answers", {"secret": password}, function(result) {
            console.log(JSON.parse(result));
            var response = JSON.parse(result);
            for (var i = 0; i < response.length; i++) {
                console.log(response[i]);
            }
            dispans(response);
        });
    });

    $("#prevq").click(function () {
        console.log("prevq");
        if (qnum > 1) {
            qnum--;
        }
        $("#questionno").text("Question: " + qnum);
        $.post("/answers", {"secret": password}, function(result) {
            var response = JSON.parse(result);
            dispans(response);
        });
    });

    $("#nextq").click(function () {
        console.log("nextq");
        if (qnum < 5) {
            qnum++;
        }
        $("#questionno").text("Question: " + qnum);
        $.post("/answers", {"secret": password}, function(result) {
            var response = JSON.parse(result);
            dispans(response);
        });
    });

    $("#subcount").click(function () {
        $.post("/answers", {"secret": password}, function(result) {
            var response = JSON.parse(result);
            var count = 0;
            for (var i = 0; i < response.length; i++) {
                if(response[i].answers["round"+roundnum]){
                    count++;
                }
            }
            $("#subcount").text("Submissions: " + count);
        });
    });
});
