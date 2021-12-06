import { API_MOCKTAIL_URL } from "./paths";

/**
 * Parses the JSON returned by a network request
 *
 * @param  {object} response A response from a network request
 *
 * @return {object}          The parsed JSON from the request
 */
function parseJSON(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  return response.json();
}

/**
 * Checks if a network request came back fine, and throws an error if not
 *
 * @param  {object} response   A response from a network request
 *
 * @return {object|undefined} Returns either the response, or throws an error
 */
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

/**
 * Requests a URL, returning a promise
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 *
 * @return {object}           The response data
 */
function request(url, options) {
  return fetch(url, options)
    .then(checkStatus)
    .then(parseJSON);
}

export function post(url, body) {
  const options = {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
  };
  return request(url, options);
}
export function del(url, body={}) {
  const options = {
    method: 'Delete',
    body,
    headers: { 'Content-Type': 'application/json' },
  };
  return request(url, options);
}

export function get(url) {
  const options = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  return request(url, options);
}

export function testApi(data) {
  const url = `${API_MOCKTAIL_URL}/${data.Endpoint}`
  const options = {
    method: data.Method,
    body: data.RequestParams,
    headers: { 'Content-Type': 'application/json' },
  };
  return request(url, options);
}
