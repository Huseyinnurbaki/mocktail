var express = require("express");
var app = express();
var cors = require("cors");
var request = require("request");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("quick.db");
const path = require('path');
// const router = express.Router();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// router.get('/selam', function (req, res) {
//     res.sendFile(path.join(__dirname + '/panel/index.html'));
//     //__dirname : It will resolve to your project folder.
// });


var listener = app.listen(7080, function () {
    console.log("Your app is listening on port " + listener.address().port);
});

app.get("/getall", async function (req, res) {
    let vals = await db.fetch("allRequests");
    res.send(vals);
});


app.post("/savetemplate", async function (req, res) {
    // validasyon yazılacak
    let isThereAnyValue = await db.fetch("isThereAnyValue");
    if (isThereAnyValue === null) {
        await db.set('isThereAnyValue', true);
        await db.push('allRequests', req.body);
    } else {
        await db.push('allRequests', req.body);
    }
    let vals = await db.fetch("allRequests");

    // let all = await db.fetch("all");
    res.send(vals);
});

app.get("/cascadeall", async function (req, res) {
    // ne var ne yok temizler
    await db.delete('allRequests');
    await db.delete('isThereAnyValue');

    res.send("Done..");
});


app.post('/updatetemplate',function(req,res){
    // single delete ve update bununla yapılacak
    res.send(JSON.stringify(req.body));
});

app.post("/mocktail", async function (req, res) {
    // validasyon yazılacak
    let isThereAnyValue = await db.fetch("isThereAnyValue");
    if (isThereAnyValue === null) {
        await db.set('isThereAnyValue', true);
        await db.push('allRequests', req.body);
    } else {
        await db.push('allRequests', req.body);
    }
    let vals = await db.fetch("allRequests");

    // let all = await db.fetch("all");
    res.send(vals);
});


// app.use('/', router);
app.use(cors());
