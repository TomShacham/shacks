import {HttpHandler, HttpRequest, HttpRequestHeaders, HttpResponse, isBuffer, isStream, Method} from "./interface";
import {URI} from "./uri";
import * as http from "http";
import {Res} from "./response";
import {IncomingMessage} from "node:http";

export class NodeHttpClient implements HttpHandler {
    constructor(public baseUrl: string = '') {
    }

    handle(req: HttpRequest): Promise<HttpResponse> {
        return new Promise(async resolve => {
            const options = this.nodeRequestFrom(req);
            const nodeRequest = http.request(options, nodeResponse => {
                // TODO what do headers really look like;do we get the value as `number` as IncomingHttpHeaders suggests
                nodeResponse.once('readable', () => {
                    resolve(this.h22pResponseFrom(nodeResponse))
                });
            });
            if (this.isReadMethod(req.method)) {
                // we do not write a body if it's a GET or HEAD etc. so this just does nothing
            } else if (isStream(req.body)) {
                for await (const chunk of req.body) {
                    nodeRequest.write(chunk)
                }
            } else if (isBuffer(req.body) || typeof req.body === 'string') {
                nodeRequest.write(req.body);
            } else if (typeof req.body === 'object') {
                nodeRequest.write(JSON.stringify(req.body));
            }
            nodeRequest.end()
        })
    }

    private nodeRequestFrom(req: HttpRequest) {
        const parsedUri = URI.parse(this.baseUrl + req.uri)
        return {
            hostname: parsedUri.hostname,
            port: parsedUri.port,
            path: (parsedUri.path ?? '') + (parsedUri.query ?? '') + (parsedUri.fragment ?? ''),
            username: parsedUri.username ?? undefined,
            password: parsedUri.password ?? undefined,
            method: req.method,
            headers: req.headers
        };
    }

    private h22pResponseFrom(nodeResponse: IncomingMessage) {
        const {statusCode, statusMessage, headers, trailers} = nodeResponse;
        return Res.of({
            status: statusCode,
            statusText: statusMessage,
            body: nodeResponse,
            headers: (headers as HttpRequestHeaders),
            trailers
        });
    }

    private isReadMethod<R, B, Path, M>(method: Method) {
        return method === 'GET' || method === 'OPTIONS' || method === 'HEAD' || method === 'TRACE' || method === 'CONNECT';
    }
}

export function nodeClient(baseUrl: string = ''): NodeHttpClient {
    return new NodeHttpClient(baseUrl)
}
