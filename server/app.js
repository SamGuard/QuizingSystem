const fs = require('fs');
const express = require('express');//Used for routing http requests

const app = express();
const bodyparse = require("body-parser");
const sha256 = require("sha256");

app.use(bodyparse());
app.use(express.static("frontend"));//Allows public access to the public folder

//All routes are sent to this page as its a single page application
app.post("/control", function(req, res, next){
    let secret = req.body.secret;
    if(secret == undefined || sha256(secret) != "3f3be1a9d2b99e7fa83031f9c467d7e1609fd1b37d20c993d6f8e2b07f142e45"){
        res.send("your secret is wrong");
        return;
    }
    let command = req.body.command;
    if(command == "next"){
        res.send(global.quiz.forward());
    } else if(command == "prev"){
        res.send(global.quiz.backward());
    } else if(command == "open"){
        global.quiz.open();
        res.send(JSON.stringify({success: true, error: ""}));
    } else if(command == "close"){
        global.quiz.close(); 
        res.send(JSON.stringify({success: true, error: ""}));
    } else {
        res.send(JSON.stringify({success: false, error: "Command not recognised"}));
    }
});


app.get("/", function (req, res, next) {
    fs.readFile(process.cwd() + "/frontend/main.html", "utf8", function (err, data) {
        if (err) {
            res.send("<!DOCTYPE html><html>Error 500: File not found!</html>");
            return;
        }
        res.send(data);
    });
});

app.use(function (req, res, next) {
    fs.readFile(process.cwd() + "/frontend/redirect.html", "utf8", function (err, data) {
        if (err) {
            res.send("<!DOCTYPE html><html>Error 500: File not found!</html>");
            return;
        }
        res.send(data);
    });
});

module.exports = app;