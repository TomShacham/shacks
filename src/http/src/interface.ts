import * as stream from "stream";
import {IncomingHttpHeaders, OutgoingHttpHeaders} from "http";

export interface HttpHandler {
    handle(req: Req): Promise<Res>
}

export interface HttpMessage {
    headers?: OutgoingHttpHeaders | IncomingHttpHeaders
    trailers?: NodeJS.Dict<string>
    body?: stream.Duplex | string
}

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'CONNECT' | 'HEAD' | 'OPTIONS';

export interface Req extends HttpMessage {
    method: Method
    headers: IncomingHttpHeaders
    path: string
    version?: string
}

export interface Res extends HttpMessage {
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


