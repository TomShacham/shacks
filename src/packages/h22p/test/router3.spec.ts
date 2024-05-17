import {expect} from "chai";
import {JsonBody, Method} from "../src";

type pathParameterToString<Part> = Part extends `{${infer Name}}` ? string : Part;
type backToPath<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? `${pathParameterToString<PartA>}/${backToPath<PartB>}`
    : pathParameterToString<Path>;

type req<
    Mtd extends Method,
    Uri extends string,
    TBody extends JsonBody
> = {
    method: Mtd,
    uri: Uri,
    body: TBody
}
type res<TBody extends JsonBody> = {
    body: TBody;
    status: number
}

type handler<
    Mtd extends Method,
    Uri extends string,
    ReqB extends JsonBody,
    ResB extends JsonBody,
> = {
    handle: (req: req<Mtd, Uri, ReqB>) => Promise<res<ResB>>
}

function handle<
    Mtd extends Method,
    Uri extends string,
    ReqB extends JsonBody,
    ResB extends JsonBody,
>(fn: (req: req<Mtd, Uri, ReqB>) => Promise<res<ResB>>): handler<Mtd, Uri, ReqB, ResB> {
    return {handle: fn}
}

function get<
    Uri extends string,
    ReqB extends JsonBody,
    ResB extends JsonBody,
>(uri: Uri, body: ReqB, handler: handler<'GET', backToPath<Uri>, ReqB, ResB>): {
    handler: handler<'GET', backToPath<Uri>, ReqB, ResB>,
    req: (mtd: 'GET', uri: backToPath<Uri>, body: ReqB) => req<'GET', backToPath<Uri>, ReqB>
} {
    return {
        handler: {handle: (req: req<'GET', backToPath<Uri>, ReqB>) => handler.handle(req)},
        req: (mtd, uri, body) => ({method: mtd, uri, body})
    }
}

const routes = {
    getResource: get('/resource/{id}/sub/{subId}', {foo: {bar: 'json'}}, handle(async (req) => {
        const u = req.uri
        return {status: 200, body: {bar: 'json'}}
    })),
    postResource: get('/resource/{id}', {foo: {baz: 'json'}}, handle(async (req) => {
        const u = req.uri
        return {status: 200, body: {quux: 'json'}}
    }))
};

describe('test', () => {
    it('handle an in-memory type-safe request and response', async () => {
        const response = await routes.getResource.handler.handle({
            method: 'GET',
            uri: '/resource/123/sub/456',
            body: {foo: {bar: 'json'}}
        });
        response.body.bar
        // @ts-expect-error -- foo does not exist on type body
        response.body.foo
    })

    it('build a type-safe request', async () => {
        const typeSafeRequest = routes.getResource.req(
            'GET',
            '/resource/123/sub/456',
            {foo: {bar: 'json'}}
        );
        expect(typeSafeRequest).deep.eq({uri: '/resource/123/sub/456', body: {foo: {bar: 'json'}}})

        const wrongMethod = routes.getResource.req(
            // @ts-expect-error
            'POST',
            '/resource/123/sub',
            {foo: {bar: 'json'}}
        );
        const wrongUri = routes.getResource.req(
            'GET',
            // @ts-expect-error
            '/resource/123/sub',
            {foo: {bar: 'json'}}
        );
        const wrongBody = routes.getResource.req(
            'GET',
            '/resource/123/sub/456',
            // @ts-expect-error
            {foo: {bar: 123}}
        );
    })
})


