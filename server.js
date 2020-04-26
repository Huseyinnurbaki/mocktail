var express = require("express");
var app = express();
var cors = require("cors");
var request = require("request");
var axios = require("axios");
var db = require("quick.db");
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
    // await db.push('allRequests', req.body.body);
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
    // let keyy = await db.fetch("keys");
    console.log(vals);
    // let all = await db.fetch("all");
    res.send(requestsWeOwn);
});

app.get("/cascadeall", async function (req, res) {
    // ne var ne yok temizler
    await db.delete('allRequests');
    await db.delete('keys');

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



// app.post("/savetemplate", async function (req, res) {
//     // validasyon yazılacak
//     // let allKeys = await db.fetch("keys");
//     const updateParameter = await db.has('keys', [req.body.body.key]);
//     console.log(updateParameter);
//     const item = {
//         [req.body.body.key]: req.body.body
//     };
//     if (updateParameter) {
//         let vals = await db.fetch("allRequests");
//         for (let index = 0; index < vals.length; index++) {
//             console.log(vals[index]);
//             let checkValue = vals[index].key;
//             console.log(checkValue);


//             if (checkValue === req.body.body.key) {
//                 const upd = await db.delete(vals[index]);
//                 let tmp = await db.fetch("allRequests");
//                 console.log(tmp);

//             }
//             const element = array[index];

//         }

//     } else {
//         await db.push('keys', req.body.body.key);
//     }

//     await db.push('allRequests', req.body.body);




//     let vals = await db.fetch("allRequests");
//     let keyy = await db.fetch("keys");
//     console.log(keyy);
//     // let all = await db.fetch("all");
//     res.send(vals);
// });