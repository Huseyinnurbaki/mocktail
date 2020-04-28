var express = require("express");
var app = express();
var cors = require("cors");
var db = require("quick.db");
var bodyParser = require("body-parser");
var _ = require('lodash');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



var listener = app.listen(7080, function () {
    console.log("Your app is listening on port " + listener.address().port);
});

app.get("/getall", async function (req, res) {
    let vals = await db.fetch("allRequests");
    res.send(vals);
});


app.post("/savetemplate", async function (req, res) {
    // validasyon yazılacak
    let requestsWeOwn = await db.get('allRequests');
    console.log(requestsWeOwn);
    let updateFlag = false;
    if(requestsWeOwn !== null){
        for (let index = 0; index < requestsWeOwn.length; index++) {
            if(requestsWeOwn[index].key === req.body.body.key){
                requestsWeOwn[index] = req.body.body;
                updateFlag = true;
            }
        }
    } else {
        requestsWeOwn = [];
    }
    if(!updateFlag){
        requestsWeOwn.push(req.body.body);
    }
    await db.set('allRequests', requestsWeOwn);

    let vals = await db.fetch("allRequests");
    console.log(vals);
    res.send(requestsWeOwn);
});

app.get("/cascadeall", async function (req, res) {
    // ne var ne yok temizler
    await db.delete('allRequests');

    res.send("Done..");
});




app.get("/mocktail/:endpoint", async function (req, res) {
    // validasyon yazılacak
    let potentialResponse = {"error": "404 endpoint does not exist."}
    let vals = await db.fetch("allRequests");
    for (let index = 0; index < vals.length; index++) {
        if (vals[index].method === 'get' && vals[index].endpoint === req.params.endpoint) {
            potentialResponse = vals[index].response;
            potentialResponse.status = "success";
        }
    }
    res.send(potentialResponse);
});


// shallowly checks the request body
app.post("/mocktail/:endpoint", async function (req, res) {
    let potentialResponse = {"error": "404 endpoint does not exist."}
    let vals = await db.fetch("allRequests");
    for (let index = 0; index < vals.length; index++) {
        if (vals[index].method === 'post' && vals[index].endpoint === req.params.endpoint) {
            const incomingRequestKeys = Object.keys(req.body.body); 
            const templateRequestKeys = Object.keys(vals[index].request);
            potentialResponse = vals[index].request;
            potentialResponse.status = "success";

            if(incomingRequestKeys.length === templateRequestKeys.length) {
                for (let k = 0; k < incomingRequestKeys.length; k++) {
                    if(incomingRequestKeys[k] !== templateRequestKeys[k]){
                        potentialResponse = {"error": "Your request body does not match your request template. There might be a typo or irrelevant item/object in your request"};
                        break;
                    }
                }
            } else {
                potentialResponse = {"error": "The number of keys in your request does not match your template. You are sending extra or less data."}
            }
        }
    }
    res.send(potentialResponse);
});


app.use(cors());
