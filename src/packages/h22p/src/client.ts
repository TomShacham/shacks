import {h22p, HttpHandler, HttpRequest, HttpResponse, Method} from "./interface";
import {URI} from "./uri";
import * as http from "http";
import {TypedHttpRequest} from "./router";
import stream from "node:stream";

export class HttpClient implements HttpHandler {
    constructor(public baseUrl: string = '') {
    }

    handle(req: HttpRequest | TypedHttpRequest<any, string, Method>): Promise<HttpResponse> {
        const parsedUri = URI.of(this.baseUrl + req.path)
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
                    resolve(h22p.response({
                        status: statusCode,
                        statusText: statusMessage,
                        body: nodeResponse,
                        headers,
                        trailers
                    }))
                });
            });
            if (req.body instanceof stream.Readable) {
                for await (const chunk of req.body) {
                    nodeRequest.write(chunk)
                }
            } else if (req.body instanceof Buffer || typeof req.body === 'string') {
                nodeRequest.write(req.body)
            } else if (typeof req.body === 'object') {
                nodeRequest.write(JSON.stringify(req.body))
            }
            nodeRequest.end()
        })

    }
}
