import * as http from "http";
import {IncomingHttpHeaders, OutgoingHttpHeaders} from "http";
import * as stream from "stream";
import {HttpClient} from "./client";
import {httpServer, HttpServer} from "./server";

export interface HttpHandler {
    handle(req: HttpRequest): Promise<HttpResponse>
}

export type Payload = string | Buffer;
export type HttpMessageBody = stream.Readable | Payload;


export interface HttpMessage {
    headers?: OutgoingHttpHeaders | IncomingHttpHeaders
    trailers?: NodeJS.Dict<string>
    body?: HttpMessageBody
}

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CONNECT' | 'TRACE' | 'HEAD' | 'OPTIONS';

export interface HttpRequest extends HttpMessage {
    // Note: The TE request header needs to be set to "trailers" to allow trailer fields.
    method: Method
    headers: IncomingHttpHeaders
    path: string
    version?: string
}

export interface HttpResponse extends HttpMessage {
    headers: OutgoingHttpHeaders
    status: number
    statusText?: string
}

export function isSimpleBody(body: stream.Duplex | AsyncIterable<string | Buffer> | string | Buffer): body is string | Buffer {
    return typeof body === 'string' || body instanceof Buffer;
}

export class h22p {
    static response(res?: Partial<HttpResponse>): HttpResponse {
        return {status: 200, headers: {}, ...res}
    }

    static request(req?: Partial<HttpRequest>): HttpRequest {
        return {method: 'GET', path: '/', headers: {}, ...req}
    }

    static isRequest(msg: HttpMessage): msg is HttpRequest {
        return 'method' in msg;
    }

    static isResponse(msg: HttpMessage): msg is HttpResponse {
        return 'status' in msg;
    }

    static client(): HttpClient {
        return new HttpClient()
    }

    static async server(handler: HttpHandler, port = 0): Promise<HttpServer> {
        return httpServer(handler, port);
    }

    static get(path: string = '/', headers: http.IncomingHttpHeaders = {}): HttpRequest {
        return {method: 'GET', path, headers}
    }

    static post(path = '/', body: HttpMessageBody = '', headers: http.IncomingHttpHeaders = {}): HttpRequest {
        return {method: 'POST', body, path, headers}
    }

    static put(path = '/', body: HttpMessageBody = '', headers: http.IncomingHttpHeaders = {}): HttpRequest {
        return {method: 'PUT', body, path, headers}
    }

    static patch(path = '/', body: HttpMessageBody = '', headers: http.IncomingHttpHeaders = {}): HttpRequest {
        return {method: 'PATCH', body, path, headers}
    }

    static delete(path = '/', body: HttpMessageBody = '', headers: http.IncomingHttpHeaders = {}): HttpRequest {
        /*
            Interestingly, DELETE needs a content length header or to set transfer-encoding to chunked
                for node to be happy, even though POST, PUT and PATCH can figure themselves out...
         */
        if (isSimpleBody(body)) {
            const contentLength = body.length.toString();
            return {method: 'DELETE', body, path, headers: {...headers, "content-length": contentLength}}
        } else {
            return {method: 'DELETE', body, path, headers: {...headers, "transfer-encoding": "chunked"}}
        }
    }

    static options(path = '/', headers: http.IncomingHttpHeaders = {}): HttpRequest {
        return {method: 'OPTIONS', path, headers}
    }

    static head(path = '/', headers: http.IncomingHttpHeaders = {}): HttpRequest {
        return {method: 'HEAD', path, headers}
    }
}


/*
 The Trailer response header allows the sender to include additional fields at the end of chunked messages
 in order to supply metadata that might be dynamically generated while the message body is sent,
 such as a message integrity check, digital signature, or post-processing status.
*/
