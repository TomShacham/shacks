import {IncomingHttpHeaders, OutgoingHttpHeaders} from "http";
import stream from "stream";
import {h22pStream} from "./body";

export interface HttpHandler<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
> {
    handle(req: Req): Promise<Res>
}

export type HttpMessageBody = JsonBody | string | Buffer | stream.Readable | undefined;
export type MessageBody<B extends HttpMessageBody = HttpMessageBody> = h22pStream<B> | B;

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
export type HttpRequestHeaders = IncomingHttpHeaders
export type HttpResponseHeaders = OutgoingHttpHeaders

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

// TODO set content-type header if not set and body type can be inferred as object / string / stream etc


/*
 The Trailer response header allows the sender to include additional fields at the end of chunked messages
 in order to supply metadata that might be dynamically generated while the message body is sent,
 such as a message integrity check, digital signature, or post-processing status.
*/
export function isBuffer(body: HttpMessageBody): body is Buffer {
    return typeof body === 'object' && body.constructor && body.constructor.name === 'Buffer';
}

export function isStream(body: MessageBody): body is stream.Readable {
    return typeof body === 'object' && '_read' in body;
}

export function isSimpleBody(body: HttpMessageBody): body is string | Buffer {
    return typeof body === 'string' || isBuffer(body);
}