import {HttpHandler, Req, res, Res} from "./interface";
import {uri} from "./uri";
import * as http from "http";

export class HttpClient implements HttpHandler {
    constructor() {
    }

    handle(req: Req): Promise<Res> {
        const parsedUri = uri(req.path)
        return new Promise(async resolve => {
            const nodeRequest = http.request({
                hostname: parsedUri.hostname,
                port: parsedUri.port,
                path: (parsedUri.path ?? '') + (parsedUri.query ?? '') + (parsedUri.fragment ?? ''),
                username: parsedUri.username ?? undefined,
                password: parsedUri.password ?? undefined,
                method: req.method,
                headers: req.headers
            }, nodeResponse => {
                const {statusCode, statusMessage, headers, trailers} = nodeResponse;
                nodeResponse.on('readable', () => {
                    resolve(res({status: statusCode, statusText: statusMessage, body: nodeResponse, headers, trailers}))
                });
            });
            if (typeof req.body === 'string' || req.body instanceof Uint8Array) {
                return nodeRequest.end(req.body)
            } else if (req.body) {
                for await (const chunk of req.body) nodeRequest.write(chunk)
            }
            nodeRequest.end()
        })

    }

}

export function client(): HttpClient {
    return new HttpClient()
}