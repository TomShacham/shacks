// the problem so far is
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


// if req matches then handler responds else 404s
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


describe('test', () => {
    it('does a thing', async () => {
        const example = {reqBody: {a: '123', b: [1, 2, 3]}};

        const rs = {
            fooRoute: get('/', async (req) => {
                const foo = req.body
                return {body: {some: 'some'}, status: 200, headers: {}}
            }),
            barRoute: post('/', example, async (req) => {
                req.body?.reqBody.a
                return {body: {other: 'other'}, headers: {}, status: 200}
            })
        }

        function contractfor<
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

        const c = contractfor(rs)
        const res1 = await c.fooRoute({method: 'GET', uri: '/', headers: {}, body: undefined})
        const res2 = await c.barRoute({
            body: {reqBody: {a: '123', b: [1]}},
            method: 'GET',
            uri: '/',
            headers: {}
        })

        console.log(res1.body.some);
        console.log(res2.body.other);


        // client (req, handler) => Promise<res>
        //   - just passes the req to the handler
        //   - needs to know what req to construct for a route
        // server (req, handler) => Promise<res>
        //   - does some business using req info then sends res
        //   - needs to match the actual request to a route

        // so define some routes that is some partial of a req and a handler


    });
})
