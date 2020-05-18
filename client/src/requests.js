import axios from "axios"
import app_url from "./paths"

export function saveTemplate(data) {
  const body = data.body
  body.key = data.body.method + data.body.endpoint
  let endpoint = app_url + "savetemplate"
  axios
    .post(endpoint, {
      body,
    })
    .then(function (response) {
      console.log(response)
    })
    .catch(function (error) {
      console.log(error)
    })
}
