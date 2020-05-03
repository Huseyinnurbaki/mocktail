/* eslint-disable no-undef */
var express = require("express")
var path = require("path")
var app = express()
var cors = require("cors")
var db = require("quick.db")
var bodyParser = require("body-parser")
var _ = require("lodash")
const jsonfile = require("jsonfile")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ limit: "40MB" }))

var listener = app.listen(7080, function () {
  console.log("Your app is listening on port " + listener.address().port)
})

app.get("/getall", async function (req, res) {
  let vals = await db.fetch("allRequests")
  if (!_.isEmpty(vals)) {
    vals = [].concat(vals).reverse()
  }
  res.send(vals)
})

app.get("/exportall", async function (req, res) {
  const vals = await db.fetch("allRequests")
  var file = path.join(__dirname, "/public/mocktail.json")
  const obj = { apis: vals }
  const writoToJsonSuccessBoolean = await jsonfile.writeFile(
    file,
    obj,
    { spaces: 2 },
    function (err) {
      if (err) {
        console.error(err)
      }
    }
  )
  console.log(writoToJsonSuccessBoolean)

  res.sendFile(file)

})

app.post("/savetemplate", async function (req, res) {
  // validasyon yazılacak
  let requestsWeOwn = await db.get("allRequests")
  // console.log(requestsWeOwn);
  let updateFlag = false
  if (requestsWeOwn !== null) {
    for (let index = 0; index < requestsWeOwn.length; index++) {
      if (requestsWeOwn[index].key === req.body.body.key) {
        requestsWeOwn[index] = req.body.body
        updateFlag = true
      }
    }
  } else {
    requestsWeOwn = []
  }
  if (!updateFlag) {
    requestsWeOwn.push(req.body.body)
  }
  try {
    await db.set("allRequests", requestsWeOwn)
  } catch (err) {
    console.log(err)
    //TODO: Handle
  }

  res.send(requestsWeOwn)
})

app.get("/cascadeall", async function (req, res) {
  // ne var ne yok temizler
  await db.delete("allRequests")

  res.send("True")
})

app.get("/mocktail/:endpoint", async function (req, res) {
  // validasyon yazılacak
  let potentialResponse = { status: "404 endpoint does not exist." }
  let vals = await db.fetch("allRequests")
  for (let index = 0; index < vals.length; index++) {
    if (
      vals[index].method === "get" &&
      vals[index].endpoint === req.params.endpoint
    ) {
      potentialResponse = vals[index].response
      potentialResponse.status = "success"
    }
  }
  res.send(potentialResponse)
})

// shallowly checks the request body
app.post("/mocktail/:endpoint", async function (req, res) {
  let potentialResponse = { status: "404 endpoint does not exist." }
  let vals = await db.fetch("allRequests")
  for (let index = 0; index < vals.length; index++) {
    if (
      vals[index].method === "post" &&
      vals[index].endpoint === req.params.endpoint
    ) {
      const incomingRequestKeys = Object.keys(req.body.body)
      const templateRequestKeys = Object.keys(vals[index].request)
      potentialResponse = vals[index].request
      potentialResponse.status = "success"

      if (incomingRequestKeys.length === templateRequestKeys.length) {
        for (let k = 0; k < incomingRequestKeys.length; k++) {
          if (incomingRequestKeys[k] !== templateRequestKeys[k]) {
            potentialResponse = {
              status:
                "Your request body does not match your request template. There might be a typo or irrelevant item/object in your request",
            }
            break
          }
        }
      } else {
        potentialResponse = {
          status:
            "The number of keys in your request does not match your template. You are sending extra or less data.",
        }
      }
    }
  }
  res.send(potentialResponse)
})

app.get("/delete/:endpointkey", async function (req, res) {
  let potentialResponse = { status: "Could not delete." }
  let requestsWeOwn = await db.fetch("allRequests")
  for (let index = 0; index < requestsWeOwn.length; index++) {
    if (requestsWeOwn[index].key === req.params.endpointkey) {
      console.log(requestsWeOwn)
      requestsWeOwn.splice(index, 1)
      console.log(requestsWeOwn)
      await db.set("allRequests", requestsWeOwn)
      potentialResponse = { status: "success" }
    }
  }
  res.send(potentialResponse)
})

app.use(cors())
