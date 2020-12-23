class ResponseHelper {
    constructor(request, response) {
        this.request = request;
        this.response = response;
    }

    sendDataResponse(data = {}) {
        this.sendResponse(200, data);
    }

    sendListResponse(list = [], total = 0) {
        this.sendResponse(200, {
            list,
            total
        })
    }

    sendErrorResponse(status, info) {
        let message = '';
        if(info instanceof Error) {
            message = info.message;
        }
        else {
            message = info;
        }

        this.sendResponse(status, {
            status,
            message
        })
    }

    sendResponse(status, data) {
        this.response.setStatusCode(status);

        let body = null;

        if(status == 200) {
            body = {
                data
            }
        }
        else {
            body = data;
        }

        this.response.setHeader('content-type', 'application/json;charset=utf-8');

        this.response.send(JSON.stringify(body));
    }
}

module.exports = {
    ResponseHelper
}