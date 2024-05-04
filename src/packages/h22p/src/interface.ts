import * as http from "http";
import {IncomingHttpHeaders, OutgoingHttpHeaders} from "http";
import * as stream from "stream";
import {HttpClient} from "./client";
import {httpServer, HttpServer} from "./server";
import {TypedHttpRequest} from "./router";

export interface HttpHandler<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse> {
    handle(req: Req): Promise<Res>
}

export interface TypedHttpHandler<
    B extends HttpMessageBody,
    Path extends string = string,
    M extends Method = Method,
    Res extends HttpMessageBody = any,
> {
    handle(req: TypedHttpRequest<B, Path, M>): Promise<HttpResponse<Res>>
}

// non json
export type SimpleBody =
    | stream.Readable
    | string
    | Buffer;
export type HttpMessageBody = JsonBody | SimpleBody | undefined;

export type HttpRequestBody<J extends JsonBody, M extends Method> =
    M extends 'POST' | 'PUT' | 'PATCH' | 'DELETE'
        ? J extends infer Json ? Json : SimpleBody
        : undefined;
/*
*  technically Json can be just a primitive eg "null" or 123;
*   but I'd rather the type reflected the 99.9% use case: a list or object of JsonValues
*   so that you don't accidentally use just a JsonValue and get no compiler help
* */
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonBody = JsonValue[] | { [key: string]: JsonValue };
// export type BodyType<B extends HttpMessageBody> = B extends infer J extends JsonBody
//     ? B
//     : B extends infer J extends string
//         ? string :
//         B extends infer J extends Buffer
//             ? Buffer
//             : B extends infer J extends stream.Readable
//                 ? stream.Readable
//                 : typeof undefined


export interface HttpMessage<B extends HttpMessageBody> {
    headers?: OutgoingHttpHeaders | IncomingHttpHeaders
    trailers?: NodeJS.Dict<string>
    body: B
}

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CONNECT' | 'TRACE' | 'HEAD' | 'OPTIONS';
export type MethodWithBody = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequest<
    B extends HttpMessageBody = any,
    P extends string = string,
    M extends Method = Method
> extends HttpMessage<B> {
    method: M
    headers: IncomingHttpHeaders
    path: P
    version?: string
}

export interface HttpResponse<
    B extends HttpMessageBody = any,
> extends HttpMessage<B> {
    headers: OutgoingHttpHeaders
    status: number
    statusText?: string
}

export function isSimpleBody(body: HttpMessageBody): body is string | Buffer {
    return typeof body === 'string' || body instanceof Buffer;
}

export class h22p {
    static response<B extends HttpMessageBody>(res?: Partial<HttpResponse<B>>): HttpResponse<B> {
        return {status: 200, headers: {}, body: undefined as B, ...res}
    }

    static request(req?: Partial<HttpRequest>): HttpRequest {
        return {method: 'GET', path: '/', headers: {}, body: undefined, ...req}
    }

    static client(baseUrl: string): HttpClient {
        return new HttpClient(baseUrl)
    }

    static async server(handler: HttpHandler, port = 0, host: string = '127.0.0.1'): Promise<HttpServer> {
        return httpServer(handler, port, host);
    }

    static get(path: string = '/', headers: http.IncomingHttpHeaders = {}): HttpRequest {
        return {method: 'GET', body: undefined, path, headers}
    }

    static post<B extends HttpMessageBody>(path = '/', headers: http.IncomingHttpHeaders = {}, body: B): HttpRequest<B> {
        return {method: 'POST', body, path, headers}
    }

    static put<B extends HttpMessageBody>(path = '/', headers: http.IncomingHttpHeaders = {}, body: B): HttpRequest<B> {
        return {method: 'PUT', body, path, headers}
    }

    static patch<B extends HttpMessageBody>(path = '/', headers: http.IncomingHttpHeaders = {}, body: B): HttpRequest<B> {
        return {method: 'PATCH', body, path, headers}
    }

    static delete<B extends HttpMessageBody>(path = '/', headers: http.IncomingHttpHeaders = {}, body: B): HttpRequest<B> {
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
        return {method: 'OPTIONS', path, headers, body: undefined}
    }

    static head(path = '/', headers: http.IncomingHttpHeaders = {}): HttpRequest {
        return {method: 'HEAD', path, headers, body: undefined}
    }

}


/*
 The Trailer response header allows the sender to include additional fields at the end of chunked messages
 in order to supply metadata that might be dynamically generated while the message body is sent,
 such as a message integrity check, digital signature, or post-processing status.
*/
