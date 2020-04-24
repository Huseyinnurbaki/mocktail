
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
            debugger;
            console.log(response);
        })
        .catch(function (error) {
            debugger;
            console.log(error);
        });
}