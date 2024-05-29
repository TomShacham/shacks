import {HttpMessageBody, HttpResponse, HttpResponseHeaders} from "./interface";

export class Res {
    static of<B extends HttpMessageBody>(res?: Partial<HttpResponse<B>>): HttpResponse<B> {
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
}