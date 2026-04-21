import { getObjByKey } from "./Storage";
export const POSTNETWORK = async (url, payload, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    if (token) {
        let loginRes = await getObjByKey('loginResponse');
        console.log(loginRes)
        // Extract token - prioritize loginRes.token, then loginRes.data (if it's a string), then loginRes.data.token
        const authToken = loginRes?.token || (typeof loginRes?.data === 'string' ? loginRes.data : loginRes?.data?.token) || loginRes?.data;
        headers = { ...headers, Authorization: "Bearer " + authToken }
    }
    return await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    }).then((response) => response.json())
        .then((response) => {
            return response
        }).catch(error => {
            console.error('error' + error);
        });

}

export const POSTNETWORKFORM = async (url, payload, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
    };
    if (token) {
        let loginRes = await getObjByKey('loginResponse');
        // Extract token - prioritize loginRes.token, then loginRes.data (if it's a string), then loginRes.data.token
        const authToken = loginRes?.token || (typeof loginRes?.data === 'string' ? loginRes.data : loginRes?.data?.token) || loginRes?.data;
        headers = { ...headers, Authorization: "Bearer " + authToken }
    }
    try {
        return Promise.all([await fetch(url, {
            method: 'POST',
            headers: headers,
            body: payload,
            redirect: 'follow'
        }).then((response) => response.json())
            .then((response) => {
                return response
            }).catch(error => {
                console.error('error' + error);
            })])
    } catch (err) {
        console.log(err);
    }

}
export const GETNETWORK = async (url, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    if (token) {
        
        let loginRes = await getObjByKey('loginResponse');
        headers = { ...headers, Authorization: "Bearer " + loginRes.token }
        // console.log(loginRes);
    }
    return fetch(url, {
        method: 'GET',
        headers: headers
    })
        .then((response) => response.json())
        .then(response => {
            return response
        }).catch(error => {
            console.error(error);
        });
}

export const PUTNETWORK = async (url, payload, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    if (token) {
        let loginRes = await getObjByKey('loginResponse');
        console.log(loginRes)
        headers = { ...headers, Authorization: "Bearer " + loginRes.token }
    }
    return await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(payload)
    }).then((response) => response.json())
        .then((response) => {
            return response
        }).catch(error => {
            console.error('error' + error);
        });

}

export const DELETENETWORK = async (url, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    if (token) {
        let loginRes = await getObjByKey('loginResponse');
        // Extract token - prioritize loginRes.token, then loginRes.data (if it's a string), then loginRes.data.token
        const authToken = loginRes?.token || (typeof loginRes?.data === 'string' ? loginRes.data : loginRes?.data?.token) || loginRes?.data;
        headers = { ...headers, Authorization: "Bearer " + authToken }
    }
    return await fetch(url, {
        method: 'DELETE',
        headers: headers
    }).then((response) => response.json())
        .then((response) => {
            return response
        }).catch(error => {
            console.error('error' + error);
        });
}