import {expect} from "chai";
import {JsonBody} from "../src";

type pathParameterToString<Part> = Part extends `{${infer Name}}` ? string : Part;
type backToPath<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? `${pathParameterToString<PartA>}/${backToPath<PartB>}`
    : pathParameterToString<Path>;

type req<Uri extends string, TBody extends JsonBody> = {
    uri: Uri,
    body: TBody
}
type res<TBody extends JsonBody> = {
    body: TBody;
    status: number
}

type handler<
    Uri extends string,
    ReqB extends JsonBody,
    ResB extends JsonBody,
> = {
    handle: (req: req<Uri, ReqB>) => Promise<res<ResB>>
}

function handle<
    Uri extends string,
    ReqB extends JsonBody,
    ResB extends JsonBody,
>(fn: (req: req<Uri, ReqB>) => Promise<res<ResB>>): handler<Uri, ReqB, ResB> {
    return {handle: fn}
}

type routes<
    O extends { [key: string]: handler<Uri, ReqB, ResB> },
    Uri extends string,
    ReqB extends JsonBody,
    ResB extends JsonBody
> = {
    [K in keyof O]: handler<Uri, ReqB, ResB> extends infer R extends handler<infer U, infer RqB, infer RsB>
        ? handler<U, RqB, RsB>
        : handler<Uri, ReqB, ResB>
}


function get<
    Uri extends string,
    ReqB extends JsonBody,
    ResB extends JsonBody,
>(uri: Uri, body: ReqB, handler: handler<backToPath<Uri>, ReqB, ResB>): {
    handler: handler<backToPath<Uri>, ReqB, ResB>,
    req: (uri: backToPath<Uri>, body: ReqB) => req<backToPath<Uri>, ReqB>
} {
    return {
        handler: {handle: (req: req<backToPath<Uri>, ReqB>) => handler.handle(req)},
        req: (uri, body) => ({uri, body})
    }
}

type x = { getResource: handler<`/resource/${string}/sub/${string}`, { foo: { bar: string } }, { bar: string }> };
type y = x extends routes<{}, string, JsonBody, JsonBody> ? true : false;

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
            uri: '/resource/123/sub/456',
            body: {foo: {bar: 'json'}}
        });
        response.body.bar
        // @ts-expect-error -- foo does not exist on type body
        response.body.foo
    })
    it('build a type-safe request', async () => {
        const typeSafeRequest = routes.getResource.req(
            '/resource/123/sub/456',
            {foo: {bar: 'json'}}
        );
        expect(typeSafeRequest).deep.eq({uri: '/resource/123/sub/456', body: {foo: {bar: 'json'}}})
        const doesntTypeCheck = routes.getResource.req(
            // @ts-expect-error
            '/resource/123/sub',
            {foo: {bar: 'json'}}
        );
        const alsoDoesntTypeCheck = routes.getResource.req(
            '/resource/123/sub/456',
            // @ts-expect-error
            {foo: {bar: 123}}
        );
    })
})


