import {h22p, HttpHandler, HttpRequest, HttpRequestHeaders, HttpResponse, MessageBody, Method} from "./interface";
import {URI} from "./uri";
import * as http from "http";
import {TypedHttpRequest} from "./router";
import stream from "node:stream";
import {h22pStream} from "./body";

export class HttpClient implements HttpHandler {
    constructor(public baseUrl: string = '') {
    }

    handle(req: HttpRequest | TypedHttpRequest<any, MessageBody<any>, string, Method, HttpRequestHeaders>): Promise<HttpResponse> {
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
                // TODO what do headers really look like;do we get the value as `number` as IncomingHttpHeaders suggests
                nodeResponse.once('readable', () => {
                    resolve(h22p.response({
                        status: statusCode,
                        statusText: statusMessage,
                        body: nodeResponse,
                        headers: (headers as HttpRequestHeaders),
                        trailers
                    }))
                });
            });
            if (req.body instanceof h22pStream) {
                if (!req.body.stream) {
                    nodeRequest.write('');
                } else {
                    for await (const chunk of req.body.stream) {
                        nodeRequest.write(chunk)
                    }
                }
            } else if (req.body instanceof stream.Readable) {
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
