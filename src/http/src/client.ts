import {HttpHandler, Req, res, Res} from "./interface";
import {uri} from "./uri";
import * as http from "http";

export class HttpClient implements HttpHandler {
    constructor() {
    }

    handle(req: Req): Promise<Res> {
        const parsedUri = uri(req.path)
        return new Promise(async resolve => {
            const options = {
                hostname: parsedUri.hostname,
                port: parsedUri.port,
                path: (parsedUri.path ?? '') + (parsedUri.query ?? '') + (parsedUri.fragment ?? ''),
                username: parsedUri.username ?? undefined,
                password: parsedUri.password ?? undefined,
                method: req.method,
                headers: req.headers
            };
            const nodeRequest = http.request(options, nodeResponse => {
                const {statusCode, statusMessage, headers, trailers} = nodeResponse;
                nodeResponse.once('readable', () => {
                    console.log('resolving res');
                    resolve(res({status: statusCode, statusText: statusMessage, body: nodeResponse, headers, trailers}))
                });
                nodeResponse.on('finish', () => console.log('node response finish'))
                nodeResponse.on('close', () => console.log('node response close'))
                nodeResponse.on('end', () => console.log('node response end'))
            });
            if (typeof req.body === 'string' || req.body instanceof Uint8Array) {
                console.log('request start writing body STRING');
                nodeRequest.write(req.body)
                console.log('request DONE writing body STRING');
            } else if (req.body) {
                console.log('request START writing body STREAM');
                for await (const chunk of req.body) nodeRequest.write(chunk)
                console.log('request DONE writing body STREAM');
            }
            nodeRequest.end()
            console.log('request end');
        })

    }

}

export function client(): HttpClient {
    return new HttpClient()
}