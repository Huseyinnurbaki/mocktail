import { API_MOCKTAIL_URL } from './paths';

/**
 * Parses the JSON returned by a network request
 *
 * @param  {object} response A response from a network request
 *
 * @return {object}          The parsed JSON from the request
 */
async function parseJSON(response) {
  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return { status: response.status };
  }
  try {
    const resp = await response.json();
    resp.status = response.status;
    return resp;
  } catch (error) {
    // If JSON parsing fails, return status only
    return { status: response.status };
  }
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
  return response;
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
  return fetch(url, options).then(checkStatus).then(parseJSON);
}

export function post(url, body) {
  const options = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  };
  return request(url, options);
}

export function put(url, body) {
  const options = {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  };
  return request(url, options);
}

export function del(url, body = {}) {
  const options = {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  };
  return request(url, options);
}

export function get(url) {
  const options = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  return request(url, options);
}

export function testApi(data) {
  const url = `${API_MOCKTAIL_URL}/${data.Endpoint}`;

  // Include API key if configured
  const headers = { 'Content-Type': 'application/json' };
  const apiKey = process.env.REACT_APP_MOCKTAIL_API_KEY;

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const options = {
    method: data.Method,
    body: data.RequestParams,
    headers: headers
  };

  // console.log('DEBUG - Request headers:', headers);

  return request(url, options);
}
