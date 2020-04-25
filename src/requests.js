
import axios from 'axios';


export function getTemplate(url) {
    axios
        .get(url, {
            headers: {
                'content-type': 'application/json',
            },
        })
        .then(function (response) {
            console.log(response);
            return response;
        })
        .catch(function (error) {
            console.log(error);
            return error;
        });
}
export function postTemplate(data) {
    axios.post(data.url, {
        body: data.body
    })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
}
export function saveTemplate(data) {
    axios.post('http://localhost:3000/savetemplate', {
        body: data.body
    })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
}