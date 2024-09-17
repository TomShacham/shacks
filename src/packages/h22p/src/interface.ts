import {IncomingHttpHeaders, OutgoingHttpHeaders} from "node:http";
import * as stream from "node:stream";
import {h22pStream} from "./body";

export interface HttpHandler<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
> {
    handle(req: Req): Promise<Res>
}

export type HttpMessageBody = JsonBody | string | Buffer | stream.Readable | ReadableStream | undefined;
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
        : B extends ReadableStream
            ? ReadableStream
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
    return (typeof body === 'object' && '_read' in body)
        || body instanceof ReadableStream
}

export function isSimpleBody(body: HttpMessageBody): body is string | Buffer {
    return typeof body === 'string' || isBuffer(body);
}

export type toQueryString<Qs> = Qs extends `${infer Q1}&${infer Q2}`
    ? `${Q1}=${string}&${toQueryString<Q2>}`
    : Qs extends `${infer Q1}`
        ? `${Q1}=${string}`
        : Qs;
export type pathPart<Part> = Part extends `${infer Start}?${infer Query}` ? Start : Part;
export type queryPart<Part> = Part extends `${infer Start}?${infer Query}` ? Query : '';
export type isPathParameter<Part> = Part extends `{${infer Name}}` ? Name : never;
export type pathParameters<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? isPathParameter<PartA> | pathParameters<PartB>
    : isPathParameter<Path>;
export type emptyToString<S extends string> = S extends '' ? string : S;
export type queriesFromString<Part> = Part extends `${infer Name}&${infer Rest}` ? Name | queriesFromString<Rest> : Part;
export type queryParameters<Path extends string> = Path extends ''
    ? { [key: string]: string }
    : toObj<queriesFromString<withoutFragment<Path>>>
export type getQueryKey<Part> = Part extends `${infer k}=${infer v}` ? k : never;
export type queryObject<Part> = toObj<getQueryKey<queriesFromString<Part>>>
export type toObj<union extends string> = {
    [Key in union]: string;
};
export type withoutFragment<Path> = Path extends `${infer PartA}#${infer PartB}` ? PartA : Path;
export type expandPathParameterOrWildcard<Part extends string> = Part extends `{${infer Name}}`
    ? `${string}/`
    : Part extends `*`
        ? string
        : `${Part}/`;
type backToPath<Path extends string> = Path extends `${infer PartA}/${infer PartB}`
    ? `${expandPathParameterOrWildcard<PartA>}${backToPath<PartB>}`
    : expandPathParameterOrWildcard<Path>;
export type expandUri<Part extends string> = Part extends `${infer Path}?${infer Query}`
    ? `${backToPath<Path>}?${toQueryString<Query>}`
    : backToPath<Part>;