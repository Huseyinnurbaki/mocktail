/* eslint-disable no-undef */
var express = require("express")
var path = require("path")
var app = express()
var compression = require("compression")
var cors = require("cors")
var db = require("quick.db")
var bodyParser = require("body-parser")
var _ = require("lodash")
const jsonfile = require("jsonfile")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ limit: "40MB" }))
app.use(cors())
app.use(compression())

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, "/client/build")))

var listener = app.listen(7080, function () {
  console.log("Your app is listening on port " + listener.address().port)
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/client/build/index.html"))
})

app.get("/getall", async function (req, res) {
  let vals = await db.fetch("allRequests")
  if (!_.isEmpty(vals)) {
    vals = [].concat(vals).reverse()
  }
  res.send(vals)
})

function isString(value) {
  return typeof value === "string" || value instanceof String
}

function isObject(value) {
  try {
    JSON.parse(value)
    return true
  } catch (error) {
    return true
  }
}

function patternCheck(mock) {
  const getTemplate = {
    endpoint: "",
    response: {},
    method: "get",
    key: "get",
  }

  let toBereturnedObj = {}

  const postTemplate = {
    endpoint: "test",
    request: {},
    response: {},
    method: "get",
    key: "gettest",
  }
  const getTemplateKeys = Object.keys(getTemplate)
  const postTemplateKeys = Object.keys(postTemplate)
  const incomingMockKeys = Object.keys(mock)

  if (mock.method === "get") {
    toBereturnedObj = getTemplate
    if (incomingMockKeys.length < 4) {
      return false
    }
    for (let index = 0; index < getTemplateKeys.length; index++) {
      toBereturnedObj[getTemplateKeys[index]] = mock[getTemplateKeys[index]]
      if (index === 1) {
        if (!isObject(toBereturnedObj[getTemplateKeys[index]])) {
          return false
        }
      } else {
        if (
          _.isEmpty(toBereturnedObj[getTemplateKeys[index]]) ||
          !isString(toBereturnedObj[getTemplateKeys[index]])
        ) {
          return false
        }
      }
    }
    // keys are very important. Must be validated carefully
    toBereturnedObj.endpoint = toBereturnedObj.endpoint.replace(/\s/g, "")
    toBereturnedObj.key = toBereturnedObj.method + toBereturnedObj.endpoint

    return toBereturnedObj
  } else {
    toBereturnedObj = postTemplate
    if (incomingMockKeys.length < 5) {
      return false
    }
    for (let index = 0; index < postTemplateKeys.length; index++) {
      toBereturnedObj[postTemplateKeys[index]] = mock[postTemplateKeys[index]]

      if (index === 1 || index === 2) {
        if (!isObject(toBereturnedObj[postTemplateKeys[index]])) {
          return false
        }
      } else {
        if (!isString(toBereturnedObj[postTemplateKeys[index]])) {
          return false
        }
      }
    }
    // keys are very important. Must be validated carefully
    toBereturnedObj.endpoint = toBereturnedObj.endpoint.replace(/\s/g, "")
    toBereturnedObj.key = toBereturnedObj.method + toBereturnedObj.endpoint
    return toBereturnedObj
  }
}

app.post("/upload", async function (req, res) {
  // console.log(requestsWeOwn);
  let responseMessage = "Json File is not valid."
  let requestsWeOwn = await db.get("allRequests")

  const apis = req.body.body.apis
  if (apis.length < 1) {
    responseMessage = "false"
    res.send(responseMessage)
  }

  if (requestsWeOwn !== null) {
    for (let i = 0; i < apis.length; i++) {
      let element = patternCheck(apis[i])
      if (!element) {
        continue
      }
      // array increases every time but it prevents saving same request template multiple times
      let updateflag = false
      for (let index = 0; index < requestsWeOwn.length; index++) {
        if (requestsWeOwn[index].key === element.key) {
          updateflag = true
          requestsWeOwn[index] = element
        }
      }
      if (!updateflag) {
        requestsWeOwn.push(element)
      }
    }
  } else {
    requestsWeOwn = []
    for (let j = 0; j < apis.length; j++) {
      let element = patternCheck(apis[j])
      if (!element) {
        continue
      }
      requestsWeOwn.push(element)
    }
  }
  await db.delete("recover")
  await db.set("allRequests", requestsWeOwn)

  res.send(true)
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
    await db.delete("recover")
    await db.set("allRequests", requestsWeOwn)
  } catch (err) {
    console.log(err)
    //TODO: Handle
  }

  res.send(requestsWeOwn)
})

app.get("/cascadeall", async function (req, res) {
  // ne var ne yok temizler
  let recover = await db.fetch("allRequests")
  if (recover === null) {
    res.send(false)
  } else {
    await db.set("recover", recover)
    await db.delete("allRequests")
    res.send(true)
  }
})

app.get("/recover", async function (req, res) {
  // returns to the backup after cascade operation
  let recover = await db.fetch("recover")
  if (recover === null) {
    res.send(false)
  } else {
    await db.set("allRequests", recover)
    await db.delete("recover")
    res.send(true)
  }
})

app.get("/mocktail/:endpoint", async function (req, res) {
  // validate ?
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

// app.get("/del", async function (req, res) {
//   // let potentialResponse = { status: "Could not delete." }

//   res.send(fefe)
// })
