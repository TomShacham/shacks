import {IncomingHttpHeaders, OutgoingHttpHeaders} from "http";
import * as stream from "stream";
import {HttpClient} from "./client";
import {httpServer, HttpServer} from "./server";
import {TypedHttpRequest} from "./router";
import {h22pStream} from "./body";

export interface HttpHandler<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse> {
    handle(req: Req): Promise<Res>
}

export interface TypedHttpHandler<
    B extends HttpMessageBody,
    Msg extends MessageBody<B>,
    Path extends string = string,
    M extends Method = Method,
    Hds extends HttpRequestHeaders = HttpRequestHeaders,
    Res extends HttpMessageBody = any,
> {
    handle(req: TypedHttpRequest<B, Msg, Path, M, Hds>): Promise<HttpResponse<Res>>
}

// non json
export type SimpleBody =
    | stream.Readable
    | string
    | Buffer;
export type HttpMessageBody = JsonBody | SimpleBody | undefined;
export type MessageBody<B extends HttpMessageBody> = h22pStream<B> | HttpMessageBody;
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
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonBody = JsonValue[] | { [key: string]: JsonValue };
export type BodyType<B extends HttpMessageBody> = B extends infer J extends JsonBody
    ? B
    : B extends infer J extends string
        ? string :
        B extends infer J extends Buffer
            ? Buffer
            : B extends infer J extends h22pStream<infer X>
                ? X
                : B extends infer J extends stream.Readable
                    ? stream.Readable
                    : typeof undefined


export type ReadMethods = 'GET' | 'CONNECT' | 'TRACE' | 'HEAD' | 'OPTIONS';
export type WriteMethods = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type Method = ReadMethods | WriteMethods;

export function isReadMethod<R, B, Path, M>(method: Method) {
    return method === 'GET' || method === 'OPTIONS' || method === 'HEAD' || method === 'TRACE' || method === 'CONNECT';
}

export type HttpRequestHeaders = { [name: keyof IncomingHttpHeaders]: string | string[] | undefined }
export type HttpResponseHeaders = { [name: keyof OutgoingHttpHeaders]: string | string[] | undefined }
export type HttpHeaders = HttpRequestHeaders | HttpResponseHeaders;

export interface HttpRequest<
    B extends HttpMessageBody = any,
    Msg extends MessageBody<B> = MessageBody<B>,
    P extends string = string,
    M extends Method = Method
> {
    method: M
    headers: HttpRequestHeaders
    path: P
    version?: string
    body: Msg
    trailers?: NodeJS.Dict<string>
}

export interface HttpResponse<
    B extends HttpMessageBody = any,
> {
    headers: HttpResponseHeaders
    status: number
    body: B
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

    static request(req?: Partial<HttpRequest>): HttpRequest {
        return {method: 'GET', path: '/', headers: {}, body: undefined, ...req}
    }

    static client(baseUrl: string): HttpClient {
        return new HttpClient(baseUrl)
    }

    static async server(handler: HttpHandler, port = 0, host: string = '127.0.0.1'): Promise<HttpServer> {
        return httpServer(handler, port, host);
    }

    static get(path: string = '/', headers: HttpRequestHeaders = {}): HttpRequest {
        return {method: 'GET', body: undefined, path, headers}
    }

    static post<B extends HttpMessageBody>(path = '/', headers: HttpRequestHeaders = {}, body: B): HttpRequest<B> {
        return {method: 'POST', body: body, path, headers}
    }

    static put<B extends HttpMessageBody>(path = '/', headers: HttpRequestHeaders = {}, body: B): HttpRequest<B> {
        return {method: 'PUT', body: body, path, headers}
    }

    static patch<B extends HttpMessageBody>(path = '/', headers: HttpRequestHeaders = {}, body: B): HttpRequest<B> {
        return {method: 'PATCH', body: body, path, headers}
    }

    static delete<B extends HttpMessageBody>(path = '/', headers: HttpRequestHeaders = {}, body: B): HttpRequest<B> {
        /*
            Interestingly, DELETE needs a content length header or to set transfer-encoding to chunked
                for node to be happy, even though POST, PUT and PATCH can figure themselves out...
         */
        if (isSimpleBody(body)) {
            const contentLength = body.length.toString();
            return {method: 'DELETE', body: body, path, headers: {...headers, "content-length": contentLength}}
        } else {
            return {method: 'DELETE', body: body, path, headers: {...headers, "transfer-encoding": "chunked"}}
        }
    }

    static options(path = '/', headers: HttpRequestHeaders = {}): HttpRequest {
        return {method: 'OPTIONS', path, headers, body: undefined}
    }

    static head(path = '/', headers: HttpRequestHeaders = {}): HttpRequest {
        return {method: 'HEAD', path, headers, body: undefined}
    }
}

export enum Status {
    continue = 100,
    switchingProtocols = 101,
    processing = 102,
    earlyHints = 103,
    ok = 200,
    created = 201,
    accepted = 202,
    nonAuthoritativeInformation = 203,
    noContent = 204,
    resetContent = 205,
    partialContent = 206,
    multiStatus = 207,
    alreadyReported = 208,
    imUsed = 226,
    multipleChoices = 300,
    movedPermanently = 301,
    found = 302,
    seeOther = 303,
    notModified = 304,
    useProxy = 305,
    temporaryRedirect = 307,
    permanentRedirect = 308,
    badRequest = 400,
    unauthorized = 401,
    paymentRequired = 402,
    forbidden = 403,
    notFound = 404,
    methodNotAllowed = 405,
    notAcceptable = 406,
    proxyAuthenticationRequired = 407,
    requestTimeout = 408,
    conflict = 409,
    gone = 410,
    lengthRequired = 411,
    preconditionFailed = 412,
    payloadTooLarge = 413,
    uriTooLong = 414,
    unsupportedMediaType = 415,
    rangeNotSatisfiable = 416,
    expectationFailed = 417,
    imATeapot = 419,
    misdirectedRequest = 421,
    unprocessableEntity = 422,
    locked = 423,
    failedDependency = 424,
    tooEarly = 425,
    upgradeRequired = 426,
    preconditionRequired = 428,
    tooManyRequests = 429,
    requestHeaderFieldsTooLarge = 431,
    unavailableForLegalReasons = 451,
    internalServerError = 500,
    notImplemented = 501,
    badGateway = 502,
    serviceUnavailable = 503,
    gatewayTimeout = 504,
    httpVersionNotSupported = 505,
    variantAlsoNegotiates = 506,
    insufficientStorage = 507,
    loopDetected = 508,
    notExtended = 510,
    networkAuthenticationRequired = 511,

}

/*
 The Trailer response header allows the sender to include additional fields at the end of chunked messages
 in order to supply metadata that might be dynamically generated while the message body is sent,
 such as a message integrity check, digital signature, or post-processing status.
*/
