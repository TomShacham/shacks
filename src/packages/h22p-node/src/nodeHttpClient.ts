import {
    HttpHandler,
    HttpRequest,
    HttpRequestHeaders,
    HttpResponse,
    isBuffer,
    isStream,
    Method,
    Res,
    URI
} from "@shacks/h22p";
import * as http from "http";
import * as https from "https";
import {IncomingMessage} from "node:http";

export type HttpClientOptions = { baseUrl?: string, timeout?: number };

export class NodeHttpClient implements HttpHandler {
    constructor(
        public options: HttpClientOptions = {},
    ) {
        this.options.baseUrl = this.options.baseUrl ?? "";
        this.options.timeout = this.options.timeout ?? 30_000;
    }

    handle(req: HttpRequest): Promise<HttpResponse> {
        return new Promise(async resolve => {
            const controller = new AbortController();
            const signal = controller.signal;
            const timeout = setTimeout(() => controller.abort(), this.options.timeout);
            if (this.options.timeout === 0) controller.abort();
            const options = this.nodeRequestFrom(req, signal);
            const request = options.protocol.includes("https") ? https.request : http.request;
            const nodeRequest = request(options, nodeResponse => {
                // TODO what do headers really look like; do we get the value as `number` as IncomingHttpHeaders suggests
                nodeResponse.once('readable', () => {
                    resolve(this.h22pResponseFrom(nodeResponse))
                });
            });
            nodeRequest.on('socket', () => {
                clearTimeout(timeout)
            })
            nodeRequest.on('error', (e: Error) => {
                const timedOut = e.name === 'AbortError';
                if (timedOut) resolve(Res.gatewayTimeout({body: e.message}));
                const dnsLookupFailed = e.message.includes('ENOTFOUND');
                if (dnsLookupFailed) resolve(Res.serviceUnavailable({body: e.message}))
            })
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

    private nodeRequestFrom(req: HttpRequest, signal: AbortSignal) {
        const parsedUri = URI.parse(this.options.baseUrl + req.uri)
        return {
            protocol: parsedUri.protocol,
            hostname: parsedUri.hostname,
            port: parsedUri.port,
            path: (parsedUri.path ?? '') + (parsedUri.query ?? '') + (parsedUri.fragment ?? ''),
            username: parsedUri.username ?? undefined,
            password: parsedUri.password ?? undefined,
            method: req.method,
            headers: this.removeUndefinedHeaders(req.headers),
            signal
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

    private removeUndefinedHeaders(headers: HttpRequestHeaders) {
        return Object.entries(headers).reduce((acc, [name, value]) => {
            if (value) acc[name] = value;
            return acc;
        }, {} as { [key: string]: string | string[] });
    }
}

export function nodeHttpClient(options: HttpClientOptions = {baseUrl: ''}): NodeHttpClient {
    return new NodeHttpClient(options)
}
