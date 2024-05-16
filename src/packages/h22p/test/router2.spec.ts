import {expect} from "chai";
import {JsonBody, Method} from "../src";

type Body = JsonBody | string | undefined;
type BodyType<B extends Body> = B extends infer J extends JsonBody
    ? J
    : B extends string
        ? string
        : undefined;

type Headers = { [key: string]: string };
type req<ReqB extends Body> = {
    body: BodyType<ReqB>,
    headers: Headers,
    uri: string,
    method: Method
}
type res<ResB extends Body> = {
    body: ResB,
    headers: Headers,
    status: number
}

interface handler<ReqB extends Body, ResB extends Body> {
    handle: (req: req<ReqB>) => Promise<res<ResB>>
}

interface notFoundHandler extends handler<any, 'Not Found'> {
}

type matcher<MBody extends Body> = {
    uri: string,
    method: Method,
    body?: MBody
};

type routes<ReqB extends Body, ResB extends Body> = {
    [key: string]: { matcher: matcher<ReqB>, handler: handler<ReqB, ResB> }
}

interface route<
    MatcherBody extends Body,
    ResB extends Body,
> {
    matcher: matcher<MatcherBody>,
    handler: handler<MatcherBody, ResB>
}

type api<Routes extends routes<ReqB, ResB>, ReqB extends Body, ResB extends Body> = {
    [Key in keyof Routes]: Routes[Key] extends route<infer RqB extends Body, infer RsB extends Body>
        ? route<RqB, RsB>
        : never
};

type router<Routes extends routes<ReqB, ResB>, ReqB extends Body, ResB extends Body> =
    handler<ReqB, ResB>
    | notFoundHandler;

function get<
    Uri extends string,
    ResB extends Body,
    MatcherBody extends undefined,
>(uri: Uri, handler: handler<MatcherBody, ResB>)
    : route<MatcherBody, ResB> {
    return {
        matcher: {uri, method: 'GET', body: undefined},
        handler
    }
}

function post<
    Uri extends string,
    MatcherBody extends Body,
    ResB extends Body,
>(uri: Uri, body: MatcherBody, handler: handler<MatcherBody, ResB>)
    : route<MatcherBody, ResB> {
    return {
        matcher: {uri, body, method: 'POST'},
        handler
    }
}

type backToPath<Part> = Part extends `{${infer Name}}` ? string : Part;
type reversePathParameters<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? `${backToPath<PartA>}/${reversePathParameters<PartB>}`
    : backToPath<Path>;

function handle<ReqB extends Body, ResB extends Body>(handler: (req: req<ReqB>) => Promise<res<ResB>>)
    : handler<ReqB, ResB> {
    return {handle: handler}
}

function router<Routes extends routes<ReqB, ResB>, ReqB extends Body, ResB extends Body>(
    routes: Routes
): router<Routes, ReqB, ResB> {
    return handle(async (req: req<ReqB>) => {
        for (const route of Object.values(routes)) {
            const matcher = route.matcher;
            if (matcher.uri === req.uri && matcher.method === req.method) {
                return route.handler.handle(req)
            }
        }
        return {status: 404, body: "Not found" as any as ResB, headers: {}}
    })
}

function contract<
    T extends api<Routes, ReqB, ResB>,
    Routes extends routes<ReqB, ResB>,
    ReqB extends Body,
    ResB extends Body,
>(api: T, handler: handler<ReqB, ResB>): {
    [K in keyof T]: T[K] extends route<infer MatcherBody extends Body, infer RsB extends Body>
        ? {
            request: (req: req<MatcherBody>) => req<MatcherBody>,
            handler: handler<BodyType<MatcherBody>, RsB>
        }
        : never
} {
    let ret = {} as any;
    for (let f in api) {
        const r = api[f].handler;
        ret[f] = {
            request: (req: req<ReqB>) => req,
            handler: handle((req: req<ReqB>) => handler.handle(req))
        }
    }
    return ret;
}

// TODO
// - type-safe way of matching a route.
// - give a client to the contract ?

describe('test', () => {
    it('infer type', async () => {
        const example = {reqBody: {a: '123', b: [1, 2, 3] as [number, number, number]}};

        const routes = {
            getResource: get('/', handle(async (req) => {
                const foo = req.body
                try {
                    // @ts-expect-error
                    req.body.foo
                } catch (e) {
                    console.log('expecting this error')
                }
                return {body: {some: 'json'}, status: 200, headers: {}}
            })),
            postResource: post('/', example, handle(async (req) => {
                const a = req.body?.reqBody.a
                try {
                    // @ts-expect-error
                    req.body?.reqBody.c
                } catch (e) {
                    console.log('expecting this error')
                }
                return {body: {other: 'thing'}, headers: {}, status: 200}
            }))
        };

        const r = router(routes);
        const c = contract(routes, r);
        const getResponse = await c.getResource.handler.handle({method: 'GET', uri: '/', headers: {}, body: undefined});
        const postResponse = await c.postResource.handler.handle({
            body: {reqBody: {a: '123', b: [1, 2, 3]}},
            method: 'POST',
            uri: '/',
            headers: {}
        });

        // router can handle it but response body is not preserved...
        expect(
            (await c.getResource.handler.handle(
                {method: 'GET', uri: '/', headers: {}, body: undefined}
            )).body.some).eq('json');

        // router not found
        expect(await r.handle(
            {method: 'GET', uri: '/unmatching-route', headers: {}, body: undefined}
        )).deep.eq({"body": "Not found", "headers": {}, "status": 404});


        // response body is type-safe :)
        expect(getResponse.body.some).eq('json');
        expect(postResponse.body.other).eq('thing');

        const postResponseBadBody1 = await c.postResource.handler.handle({
            // @ts-expect-error - other: property should not be there
            body: {reqBody: {a: '123', b: [1], other: 'property'}},
            method: 'GET',
            uri: '/',
            headers: {}
        });

        const postResponseBadBody2 = await c.postResource.handler.handle({
            // @ts-expect-error - b needs to have length 3
            body: {reqBody: {a: '123', b: [1]}},
            method: 'GET',
            uri: '/',
            headers: {}
        });
    });
})
