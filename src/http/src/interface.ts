import {IncomingHttpHeaders, OutgoingHttpHeaders} from "http";

export interface HttpHandler {
    handle(req: Req): Promise<Res>
}

type Payload = string | Uint8Array;

export interface HttpMessage<TBody extends Payload> {
    headers?: OutgoingHttpHeaders | IncomingHttpHeaders
    trailers?: NodeJS.Dict<string>
    body?: AsyncIterable<TBody> | TBody
}

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'CONNECT' | 'HEAD' | 'OPTIONS';

export interface Req<TBody extends Payload = string> extends HttpMessage<TBody> {
    // Note: The TE request header needs to be set to "trailers" to allow trailer fields.
    method: Method
    headers: IncomingHttpHeaders
    path: string
    version?: string
}

export interface Res<TBody extends Payload = string> extends HttpMessage<TBody> {
    headers: OutgoingHttpHeaders
    status: number
    statusText?: string
}

export function res(res?: Partial<Res>): Res {
    return {status: 200, headers: {}, ...res}
}

export function req(req?: Partial<Req>): Req {
    return {method: 'GET', path: '/', headers: {}, ...req}
}

/*
 The Trailer response header allows the sender to include additional fields at the end of chunked messages
 in order to supply metadata that might be dynamically generated while the message body is sent,
 such as a message integrity check, digital signature, or post-processing status.
*/
