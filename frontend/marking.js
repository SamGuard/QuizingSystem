$.post("/answers", {"secret": "FuckYourChickenStrips"}, function(result) {
    console.log(result);
});

$(document).ready(function () {
    $("#prev").click(function () {
        console.log("prev");
        $.post("/control", {"secret": "FuckYourChickenStrips", "command": "prev"}, function(result) {
            console.log(result);
        });
    });


    $("#next").click(function () {
        console.log("next");
        $.post("/control", {"secret": "FuckYourChickenStrips", "command": "next"}, function(result) {
            console.log(result);
        });
    });


    $("#open").click(function () {
        console.log("open");
        $.post("/control", {"secret": "FuckYourChickenStrips", "command": "open"}, function(result) {
            console.log(result);
        });
    });

    $("#close").click(function () {
        console.log("close");
        $.post("/control", {"secret": "FuckYourChickenStrips", "command": "close"}, function(result) {
            console.log(result);
        });
    });
});
