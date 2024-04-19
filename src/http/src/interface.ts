import {IncomingHttpHeaders, OutgoingHttpHeaders} from "http";
import * as stream from "stream";

export interface HttpHandler {
    handle(req: Req): Promise<Res>
}

export type Payload = string | Uint8Array;
export type HttpMessageBody<TBody extends Payload = string | Uint8Array> =
    | stream.Duplex
    | AsyncIterable<TBody>
    | TBody;

export interface HttpMessage<TBody extends Payload = string> {
    headers?: OutgoingHttpHeaders | IncomingHttpHeaders
    trailers?: NodeJS.Dict<string>
    body?: HttpMessageBody<TBody>
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

export function response(res?: Partial<Res>): Res {
    return {status: 200, headers: {}, ...res}
}

export function request(req?: Partial<Req>): Req {
    return {method: 'GET', path: '/', headers: {}, ...req}
}

export function isReq(msg: HttpMessage): msg is Req {
    return 'method' in msg;
}

export function isRes(msg: HttpMessage): msg is Res {
    return 'status' in msg;
}

/*
 The Trailer response header allows the sender to include additional fields at the end of chunked messages
 in order to supply metadata that might be dynamically generated while the message body is sent,
 such as a message integrity check, digital signature, or post-processing status.
*/
