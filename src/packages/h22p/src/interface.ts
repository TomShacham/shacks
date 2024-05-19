import {IncomingHttpHeaders, OutgoingHttpHeaders} from "http";
import * as stream from "stream";
import {HttpClient} from "./client";
import {httpServer, HttpServer} from "./server";
import {h22pStream} from "./body";
import {Status} from "./status";

export interface HttpHandler<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
> {
    handle(req: Req): Promise<Res>
}

// non json
export type SimpleBody =
    | stream.Readable
    | string
    | Buffer;
export type HttpMessageBody = JsonBody | SimpleBody | undefined;
export type MessageBody<B extends HttpMessageBody = HttpMessageBody> = h22pStream<B> | B;
export type MessageType<Msg extends MessageBody<B> = MessageBody<any>, B extends HttpMessageBody = any> = Msg extends h22pStream<infer T> ? T : Msg;

export type HttpRequestBody<B extends HttpMessageBody, M extends Method> =
    M extends 'POST' | 'PUT' | 'PATCH' | 'DELETE'
        ? BodyType<B>
        : undefined;
/*
*  technically Json can be just a primitive eg "null" or 123;
*   but I'd rather the type reflected the 99.9% use case: a list or object of JsonValues
*   so that you don't accidentally use just a JsonValue and get no compiler help
* */
export type DictString = { [key: string]: string };
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = string | number | boolean | null | undefined | JsonArray | JsonObject;
export type JsonBody = JsonArray | JsonObject;
export type BodyType<B extends HttpMessageBody> = B extends h22pStream<infer X>
    ? X
    : B extends stream.Readable
        ? stream.Readable
        : B extends infer J extends JsonBody
            ? J
            : B extends infer J extends string
                ? string :
                B extends infer J extends Buffer
                    ? Buffer
                    : typeof undefined;

export type ReadMethods = 'GET' | 'CONNECT' | 'TRACE' | 'HEAD' | 'OPTIONS';
export type WriteMethods = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type Method = ReadMethods | WriteMethods;

export function isReadMethod<R, B, Path, M>(method: Method) {
    return method === 'GET' || method === 'OPTIONS' || method === 'HEAD' || method === 'TRACE' || method === 'CONNECT';
}

export type HttpRequestHeaders = IncomingHttpHeaders
export type HttpResponseHeaders = OutgoingHttpHeaders
export type HttpHeaders = HttpRequestHeaders | HttpResponseHeaders;

export interface HttpRequest<
    Mtd extends Method = Method,
    Uri extends string = string,
    ReqB extends HttpMessageBody = HttpMessageBody,
    ReqHds extends HttpRequestHeaders = HttpRequestHeaders
> {
    method: Mtd
    headers: ReqHds
    uri: Uri
    version?: string
    body: MessageBody<ReqB>
    trailers?: NodeJS.Dict<string>
}

export interface HttpResponse<
    B extends HttpMessageBody = HttpMessageBody,
    Status extends number = number,
    ResHds extends HttpResponseHeaders = HttpResponseHeaders
> {
    headers: ResHds
    status: Status
    body: MessageBody<B>
    statusText?: string
    trailers?: NodeJS.Dict<string>
}

export function isSimpleBody(body: HttpMessageBody): body is string | Buffer {
    return typeof body === 'string' || body instanceof Buffer;
}

export class h22p {
    static response<B extends HttpMessageBody>(res?: Partial<HttpResponse<B>>): HttpResponse<B> {
        return {status: 200, headers: {}, body: undefined as B, ...res}
    }

    static ok<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 200, statusText: 'OK', headers: {}, body: undefined as B, ...res}
    }

    static created<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 201, statusText: 'Created', headers: {}, body: undefined as B, ...res}
    }

    static noContent<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 204, statusText: 'No Content', headers: {}, body: undefined as B, ...res}
    }

    static movedPermanently<B extends HttpMessageBody>(res: {
        headers: { "location": string } & HttpResponseHeaders
    } & Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 301, statusText: 'Moved Permanently', body: undefined as B, ...res};
    }

    static found<B extends HttpMessageBody>(res: {
        headers: { "location": string } & HttpResponseHeaders
    } & Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 302, statusText: 'Found', body: undefined as B, ...res};
    }

    static seeOther<B extends HttpMessageBody>(res: {
        headers: { "location": string } & HttpResponseHeaders
    } & Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 303, statusText: 'See Other', body: undefined as B, ...res};
    }

    static temporaryRedirect<B extends HttpMessageBody>(res: {
        headers: { "location": string } & HttpResponseHeaders
    } & Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 307, statusText: 'Temporary Redirect', body: undefined as B, ...res};
    }

    static permanentRedirect<B extends HttpMessageBody>(res: {
        headers: { "location": string } & HttpResponseHeaders
    } & Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 308, statusText: 'Permanent Redirect', body: undefined as B, ...res};
    }

    static badRequest<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 400, statusText: 'Bad Request', headers: {}, body: undefined as B, ...res};
    }

    static unauthorized<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 401, statusText: 'Unauthorized', headers: {}, body: undefined as B, ...res};
    }

    static forbidden<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 403, statusText: 'Forbidden', headers: {}, body: undefined as B, ...res};
    }

    static notFound<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 404, statusText: 'Not Found', headers: {}, body: undefined as B, ...res};
    }

    static methodNotAllowed<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 405, statusText: 'Method Not Allowed', headers: {}, body: undefined as B, ...res};
    }

    static internalServerError<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 500, statusText: 'Internal Server Error', headers: {}, body: undefined as B, ...res};
    }

    static badGateway<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 502, statusText: 'Bad Gateway', headers: {}, body: undefined as B, ...res};
    }

    static serviceUnavailable<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 503, statusText: 'Service Unavailable', headers: {}, body: undefined as B, ...res};
    }

    static gatewayTimeout<B extends HttpMessageBody>(res?: Partial<Omit<HttpResponse<B>, 'status' | 'statusText'>>): HttpResponse<B> {
        return {status: 504, statusText: 'Gateway Timeout', headers: {}, body: undefined as B, ...res};
    }

    static request<
        M extends Method,
        B extends HttpMessageBody,
        Uri extends string,
        ReqHds extends HttpRequestHeaders,
    >(req?: Partial<HttpRequest<M, Uri, B, ReqHds>>): HttpRequest<M, Uri, B, ReqHds> {
        return {method: 'GET' as M, uri: '/' as Uri, body: undefined as B, headers: {} as ReqHds, ...req}
    }

    static client(baseUrl: string = ''): HttpClient {
        return new HttpClient(baseUrl)
    }

    static async server(handler: HttpHandler, port = 0, host: string = '127.0.0.1'): Promise<HttpServer> {
        return httpServer(handler, port, host);
    }

    static get<
        B extends HttpMessageBody,
        Uri extends string,
        ReqHds extends HttpRequestHeaders,
    >(path: string = '/', headers: HttpRequestHeaders = {}): HttpRequest<'GET', Uri, undefined, ReqHds> {
        return {method: 'GET', body: undefined, uri: path as Uri, headers: headers as ReqHds}
    }

    static post<
        B extends HttpMessageBody,
        Uri extends string,
        ReqHds extends HttpRequestHeaders,
    >(path = '/' as Uri, body: B, headers: ReqHds = {} as ReqHds): HttpRequest<"POST", Uri, B, ReqHds> {
        return {method: 'POST', body: body, uri: path, headers}
    }

    static put<
        B extends HttpMessageBody,
        Uri extends string,
        ReqHds extends HttpRequestHeaders,
    >(path = '/' as Uri, body: B, headers: ReqHds = {} as ReqHds): HttpRequest<"PUT", Uri, B, ReqHds> {
        return {method: 'PUT', body: body, uri: path, headers}
    }

    static patch<
        B extends HttpMessageBody,
        Uri extends string,
        ReqHds extends HttpRequestHeaders,
    >(path = '/' as Uri, body: B, headers: ReqHds = {} as ReqHds): HttpRequest<"PATCH", Uri, B, ReqHds> {
        return {method: 'PATCH', body: body, uri: path, headers}
    }

    static delete<
        B extends HttpMessageBody,
        Uri extends string,
        ReqHds extends HttpRequestHeaders,
    >(path = '/' as Uri, body: B, headers: ReqHds = {} as ReqHds): HttpRequest<"DELETE", Uri, B, ReqHds> {
        /*
            Interestingly, DELETE needs a content length header or to set transfer-encoding to chunked
                for node to be happy, even though POST, PUT and PATCH can figure themselves out...
         */
        if (isSimpleBody(body)) {
            const contentLength = body.length.toString();
            return {method: 'DELETE', body: body, uri: path, headers: {...headers, "content-length": contentLength}}
        } else {
            return {method: 'DELETE', body: body, uri: path, headers: {...headers, "transfer-encoding": "chunked"}}
        }
    }

    static options<
        B extends HttpMessageBody,
        Uri extends string,
        ReqHds extends HttpRequestHeaders,
    >(path = '/', headers: HttpRequestHeaders = {}): HttpRequest<'OPTIONS', Uri, undefined, ReqHds> {
        return {method: 'OPTIONS', uri: path as Uri, body: undefined, headers: headers as ReqHds}
    }

    static head<
        B extends HttpMessageBody,
        Uri extends string,
        ReqHds extends HttpRequestHeaders,
    >(path = '/', headers: HttpRequestHeaders = {}): HttpRequest<'HEAD', Uri, undefined, ReqHds> {
        return {method: 'HEAD', uri: path as Uri, body: undefined, headers: headers as ReqHds}
    }

    static Status = Status;
}

/*
 The Trailer response header allows the sender to include additional fields at the end of chunked messages
 in order to supply metadata that might be dynamically generated while the message body is sent,
 such as a message integrity check, digital signature, or post-processing status.
*/
