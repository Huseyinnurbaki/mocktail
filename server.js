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


var listener = app.listen(8080, function () {
    console.log("Your app is listening on port " + listener.address().port);
});

app.get("/getall/", async function (req, res) {
    res.send("all");
});

app.post('/setall',function(req,res){
    // console.log("User name = " + req.body);
    res.send(JSON.stringify(req.body));
});

// app.use('/', router);
app.use(cors());

// app.get("/", async function (request, response) {
//     let a = await db.fetch("all");
//     response.send(
//         `${a.cases} cases are reported of the COVID-19 Novel Coronavirus strain<br> ${a.deaths} have died from it <br>\n${a.recovered} have recovered from it <br> Get the endpoint /all to get information for all cases <br> get the endpoint /countries for getting the data sorted country wise <br>get the endpoint /countries/[country-name] for getting the data for a specific country`
//     );
// });
// app.get("/all/", async function (req, res) {
//     let all = await db.fetch("all");
//     res.send(all);
// });




// var getall = setInterval(async () => {

// }, 1000);