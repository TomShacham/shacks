import {HttpHandler, Req, res, Res} from "./interface";
import {uri} from "./uri";
import * as http from "http";

export class HttpClient implements HttpHandler {
    constructor() {
    }

    handle(req: Req): Promise<Res> {
        const parsedUri = uri(req.path)
        return new Promise(resolve => {
            const nodeRequest = http.request({
                hostname: parsedUri.hostname,
                port: parsedUri.port,
                path: parsedUri.path + parsedUri.query + parsedUri.fragment,
                username: parsedUri.username ?? undefined,
                password: parsedUri.password ?? undefined,
                method: req.method,
                headers: req.headers
            }, nodeResponse => {
                const {statusCode, statusMessage, headers} = nodeResponse;
                let body = '';
                nodeResponse.setEncoding('utf8');
                nodeResponse.on('data', (chunk) => {
                    body += chunk;
                });
                nodeResponse.on('end', () => {
                    resolve(res({status: statusCode, statusText: statusMessage, body, headers}))
                });
            });
            nodeRequest.write(req.body)
            nodeRequest.end()
        })

    }

}

export function client(): HttpClient {
    return new HttpClient()
}