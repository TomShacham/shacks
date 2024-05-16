import {JsonBody, Method} from "../src";

type Body = JsonBody | undefined;
type BodyType<B extends Body> = B extends infer J extends JsonBody ? J : undefined;
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
type handler<ReqB extends Body, ResB extends Body> = (req: req<ReqB>) => Promise<res<ResB>>
type matcher<MBody extends Body> = {
    uri: string,
    method: Method,
    body?: MBody
};

type routes<ReqB extends Body, ResB extends Body> = {
    [key: string]: { req: matcher<ReqB>, handler: handler<ReqB, ResB> }
}

interface route<
    MatcherBody extends Body,
    ResB extends Body,
> {
    req: matcher<MatcherBody>,
    handler: handler<MatcherBody, ResB>
}

type api<Routes extends routes<ReqB, ResB>, ReqB extends Body, ResB extends Body> = {
    [Key in keyof Routes]: Routes[Key] extends route<infer RqB extends Body, infer RsB extends Body>
        ? route<RqB, RsB>
        : never
};

function get<
    Uri extends string,
    ResB extends Body,
    MatcherBody extends undefined,
>(uri: Uri, handler: handler<MatcherBody, ResB>)
    : route<MatcherBody, ResB> {
    return {
        req: {uri, method: 'GET', body: undefined},
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
        req: {uri, body, method: 'POST'},
        handler
    }
}

type backToPath<Part> = Part extends `{${infer Name}}` ? string : Part;
type reversePathParameters<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? `${backToPath<PartA>}/${reversePathParameters<PartB>}`
    : backToPath<Path>;


describe('test', () => {

    it('infer type', async () => {
        const example = {reqBody: {a: '123', b: [1, 2, 3] as [number, number, number]}};

        const routes = {
            getResource: get('/', async (req) => {
                const foo = req.body
                return {body: {some: 'some'}, status: 200, headers: {}}
            }),
            postResource: post('/', example, async (req) => {
                req.body?.reqBody.a
                return {body: {other: 'other'}, headers: {}, status: 200}
            })
        }

        function contract<
            T extends api<Routes, ReqB, ResB>,
            Routes extends routes<ReqB, ResB>,
            ReqB extends Body,
            ResB extends Body,
        >(api: T): {
            [K in keyof T]: T[K] extends route<infer MatcherBody extends Body, infer RsB extends Body>
                ? handler<BodyType<MatcherBody>, RsB>
                : never
        } {
            let ret = {} as any;
            for (let f in api) {
                const r = api[f].handler;
                ret[f] = (req: req<ReqB>) => r(req)
            }
            return ret;
        }

        const c = contract(routes)
        const getResponse = await c.getResource({method: 'GET', uri: '/', headers: {}, body: undefined})
        const postResponse = await c.postResource({
            body: {reqBody: {a: '123', b: [1, 2, 3]}},
            method: 'GET',
            uri: '/',
            headers: {}
        })

        // response body is type-safe :)
        console.log(getResponse.body.some);
        console.log(postResponse.body.other);

        const postResponseBadBody1 = await c.postResource({
            // @ts-expect-error - other: property should not be there
            body: {reqBody: {a: '123', b: [1], other: 'property'}},
            method: 'GET',
            uri: '/',
            headers: {}
        })

        const postResponseBadBody2 = await c.postResource({
            // @ts-expect-error - b needs to have length 3
            body: {reqBody: {a: '123', b: [1]}},
            method: 'GET',
            uri: '/',
            headers: {}
        })

        // client (req, handler) => Promise<res>
        //   - just passes the req to the handler
        //   - needs to know what req to construct for a route
        // server (req, handler) => Promise<res>
        //   - does some business using req info then sends res
        //   - needs to match the actual request to a route

        // so define some routes that is some partial of a req and a handler


    });
})
