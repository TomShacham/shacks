import {HTTP, HttpHandler, HttpRequest, HttpResponse} from "./interface";
import {URI} from "./uri";
import * as http from "http";

export class HttpClient implements HttpHandler {
    constructor() {
    }

    handle(req: HttpRequest): Promise<HttpResponse> {
        const parsedUri = URI.of(req.path)
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
                    resolve(HTTP.response({
                        status: statusCode,
                        statusText: statusMessage,
                        body: nodeResponse,
                        headers,
                        trailers
                    }))
                });
            });
            if (typeof req.body === 'string' || req.body instanceof Uint8Array) {
                nodeRequest.write(req.body)
            } else if (req.body) {
                for await (const chunk of req.body) nodeRequest.write(chunk)
            }
            nodeRequest.end()
        })

    }
}
