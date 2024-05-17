import {expect} from "chai";
import {JsonBody, Method} from "../src";
import stream from "stream";

type toQueryString<Qs> = Qs extends `${infer Q1}&${infer Q2}`
    ? `${Q1}=${string}&${toQueryString<Q2>}`
    : Qs extends `${infer Q1}`
        ? `${Q1}=${string}`
        : Qs;

type pathParameterToString<Part> = Part extends `{${infer Name}}` ? string : Part;
type backToPath<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? `${pathParameterToString<PartA>}/${backToPath<PartB>}`
    : pathParameterToString<Path>;

type fullPath<Part> = Part extends `${infer Path}?${infer Query}`
    ? `${backToPath<Path>}?${toQueryString<Query>}`
    : backToPath<Part>;


type Headers = { [key: string]: string };
type MessageBody = stream.Readable | JsonBody | string | undefined;
type BodyType<M extends MessageBody> = M extends infer J extends JsonBody
    ? J
    : M extends stream.Readable
        ? stream.Readable
        : M extends string
            ? string : undefined;
type req<
    Mtd extends Method,
    Uri extends string,
    TBody extends MessageBody,
    Hds extends Headers
> = {
    method: Mtd,
    uri: Uri,
    body: BodyType<TBody>,
    headers: Hds,
}
type res<TBody extends MessageBody, Hds extends Headers> = {
    body: TBody;
    status: number,
    headers: Hds
}

type handler<
    Mtd extends Method,
    Uri extends string,
    ReqB extends MessageBody,
    ResB extends MessageBody,
    ReqHds extends Headers,
    ResHds extends Headers,
> = {
    handle: (req: req<Mtd, Uri, ReqB, ReqHds>) => Promise<res<ResB, ResHds>>
}

function handle<
    Mtd extends Method,
    Uri extends string,
    ReqB extends MessageBody,
    ResB extends MessageBody,
    ReqHds extends Headers,
    ResHds extends Headers,
>(fn: (req: req<Mtd, Uri, ReqB, ReqHds>) => Promise<res<ResB, ResHds>>): handler<Mtd, Uri, ReqB, ResB, ReqHds, ResHds> {
    return {handle: fn}
}

function get<
    Uri extends string,
    ReqB extends MessageBody,
    ResB extends MessageBody,
    ReqHds extends Headers,
    ResHds extends Headers,
>(uri: Uri, body: ReqB, handler: handler<'GET', fullPath<Uri>, ReqB, ResB, ReqHds, ResHds>, headers?: ReqHds): {
    handler: handler<'GET', fullPath<Uri>, ReqB, ResB, ReqHds, ResHds>,
    req: (mtd: 'GET', uri: fullPath<Uri>, body: BodyType<ReqB>, headers: ReqHds) => req<'GET', fullPath<Uri>, ReqB, ReqHds>
} {
    return {
        handler: {handle: (req: req<'GET', fullPath<Uri>, ReqB, ReqHds>) => handler.handle(req)},
        req: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers ?? {}})
    }
}

const routes = {
    getResource: get('/resource/{id}/sub/{subId}?q1&q2', {foo: {bar: 'json'}}, handle(async (req) => {
        const u = req.uri
        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
    }), {"content-type": "text/csv"} as const),
    postJsonResource: get('/resource/{id}', {foo: {baz: 'json'}}, handle(async (req) => {
        const u = req.uri
        return {status: 200, body: {quux: 'json'}, headers: {}}
    })),
    postStringResource: get('/resource/{id}', '', handle(async (req) => {
        const u = req.uri
        return {status: 200, body: 'some response string', headers: {}}
    })),
    postStreamResource: get('/resource/{id}', stream.Readable.from(''), handle(async (req) => {
        const u = req.uri
        return {status: 200, body: stream.Readable.from('123'), headers: {}}
    }))
};

// Todo routing based off routes
//  open api docs based off routes
//  stitch back into main

describe('test', () => {
    it('handle an in-memory type-safe request and response', async () => {
        const response = await routes.getResource.handler.handle({
            method: 'GET',
            uri: '/resource/123/sub/456?q1=v1&q2=v2',
            body: {foo: {bar: 'json'}},
            headers: {"content-type": "text/csv"},
        });
        response.body.bar
        // @ts-expect-error -- foo does not exist on type body
        response.body.foo

        response.headers.foo
        // @ts-expect-error -- foo does not exist on type body
        response.headers.bar
    })

    it('build a type-safe request', async () => {
        const typeSafeRequest = routes.getResource.req(
            'GET',
            '/resource/123/sub/456?q1=v1&q2=v2',
            {foo: {bar: 'json'}},
            {"content-type": "text/csv"}
        );
        expect(typeSafeRequest).deep.eq({uri: '/resource/123/sub/456', body: {foo: {bar: 'json'}}})
        const noQueryProvided = routes.getResource.req(
            'GET',
            // @ts-expect-error
            '/resource/123/sub/456',
            {foo: {bar: 'json'}},
            {}
        );
        const wrongMethod = routes.getResource.req(
            // @ts-expect-error
            'POST',
            '/resource/123/sub?q1=v1&q2=v2',
            {foo: {bar: 'json'}},
            {}
        );
        const wrongUri = routes.getResource.req(
            'GET',
            // @ts-expect-error
            '/resource/123/sub?q1=v1&q2=v2',
            {foo: {bar: 'json'}},
            {}
        );
        const wrongBody = routes.getResource.req(
            'GET',
            '/resource/123/sub/456?q1=v1&q2=v2',
            // @ts-expect-error
            {foo: {bar: 123}},
            {}
        );
        const emptyHeaders = routes.getResource.req(
            'GET',
            '/resource/123/sub/456?q1=v1&q2=v2',
            {foo: {bar: '123'}},
            // @ts-expect-error
            {}
        );
        const wrongHeaders = routes.getResource.req(
            'GET',
            '/resource/123/sub/456?q1=v1&q2=v2',
            {foo: {bar: '123'}},
            // @ts-expect-error
            {"content-type": "text/html"}
        );
    });

    it('handle string body', async () => {
        await routes.postStringResource.handler.handle({
            method: 'GET',
            uri: '/resource/123/sub/456?q1=v1&q2=v2',
            // @ts-expect-error -- not a string body
            body: {foo: {bar: 'json'}},
            headers: {"content-type": "text/csv"},
        });
        const response = await routes.postStringResource.handler.handle({
            method: 'GET',
            uri: '/resource/123/sub/456?q1=v1&q2=v2',
            body: 'any thing',
            headers: {"content-type": "text/csv"},
        });
        response.body.slice
        // @ts-expect-error -- foo does not exist on type body
        response.body.foo
    });

    it('handle stream body', async () => {
        await routes.postStreamResource.handler.handle({
            method: 'GET',
            uri: '/resource/123/sub/456?q1=v1&q2=v2',
            // @ts-expect-error -- not a stream body
            body: 'string',
            headers: {"content-type": "text/csv"},
        });
        const response = await routes.postStreamResource.handler.handle({
            method: 'GET',
            uri: '/resource/123/sub/456?q1=v1&q2=v2',
            body: stream.Readable.from('any thing'),
            headers: {"content-type": "text/csv"},
        });
        response.body.read
        // @ts-expect-error -- foo does not exist on type body
        response.body.foo
    });

})


