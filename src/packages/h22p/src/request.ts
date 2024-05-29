import {HttpMessageBody, HttpRequest, HttpRequestHeaders, isSimpleBody, Method} from "./interface";

export class Req {
    static of<
        M extends Method,
        B extends HttpMessageBody,
        Uri extends string,
        ReqHds extends HttpRequestHeaders,
    >(req?: Partial<HttpRequest<M, Uri, B, ReqHds>>): HttpRequest<M, Uri, B, ReqHds> {
        return {method: 'GET' as M, uri: '/' as Uri, body: undefined as B, headers: {} as ReqHds, ...req}
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
}