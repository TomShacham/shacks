// the problem so far is
import {JsonBody, Method} from "../src";

type Body = JsonBody | undefined;
type BodyType<B extends Body> = B extends JsonBody ? JsonBody : undefined;
type Headers = { [key: string]: string };
type req<ReqB extends Body> = {
    body: ReqB,
    headers: Headers,
    uri: string,
    method: Method
}
type res<ResB extends Body> = {
    body: ResB,
    headers: Headers,
    status: number
}
type handler<
    MatcherBody extends Body,
    ResB extends Body
> = (req: req<MatcherBody>) => Promise<res<ResB>>
type serde = (str: string) => string
type matcher<MBody extends Body = Body> = {
    uri: string,
    method: Method,
    headers: { [k: string]: serde },
    body?: MBody
};


// if req matches then handler responds else 404s
type routes<ReqB extends Body, ResB extends Body> = {
    [key: string]: { req: matcher, handler: handler<ReqB, ResB> }
}

interface route<
    MatcherBody extends Body,
    ResB extends Body
> {
    req: matcher<MatcherBody>,
    handler: handler<MatcherBody, ResB>
}

type routeHandler<
    MatcherBody extends Body,
    ResB extends Body,
    R extends route<MatcherBody, ResB> = route<MatcherBody, ResB>
> = handler<MatcherBody, ResB>;

type api<Routes extends routes<ReqB, ResB>, ReqB extends Body = Body, ResB extends Body = Body> = {
    [Key in keyof Routes]: Routes[Key] extends route<infer RqB extends Body, infer RsB extends Body>
        ? route<RqB, RsB>
        : route<ReqB, ResB>
};

/*
 TODO infer request body type with a body serde
    path, headers, method -> easy just copy router
    but hard: request body
*/

function get<
    Uri extends string,
    ResB extends Body,
    MatcherBody extends Body,
>(uri: Uri, headers: Headers, handler: handler<BodyType<MatcherBody>, ResB>)
    : route<BodyType<MatcherBody>, ResB> {
    return {
        req: {uri, headers: {}, method: 'GET', body: undefined},
        handler
    }
}

function post<
    Uri extends string,
    MatcherBody extends Body,
    ResB extends Body,
>(uri: Uri, headers: Headers, body: BodyType<MatcherBody>, handler: handler<BodyType<MatcherBody>, ResB>)
    : route<BodyType<MatcherBody>, ResB> {
    return {
        req: {uri, headers: {}, body, method: 'POST'},
        handler
    }
}


describe('test', () => {
    it('does a thing', async () => {
        const example = {some: {a: '123', b: [1, 2, 3]}};

        const rs = {
            fooRoute: get('/', {},
                async (req) => {
                    const body = req.body;
                    return {body: {some: 'some'}, headers: {}, status: 200}
                }),
            barRoute: post('/', {}, example,
                async (req) => {
                    const body = req.body;
                    return {body: {other: 'other'}, headers: {}, status: 200}
                })
        }

        function contract<
            T extends api<Routes, ReqB, ResB>,
            Routes extends routes<ReqB, ResB>,
            ReqB extends Body,
            ResB extends Body,
        >(api: T): {
            [K in keyof T]: T[K] extends route<
                    infer MatcherBody extends Body,
                    infer RsB extends Body
                >
                ? routeHandler<MatcherBody, RsB>
                : never
        } {
            let ret = {} as any;
            for (let f in api) {
                const r = api[f].handler;
                ret[f] = (req: req<ReqB>) => r(req)
            }
            return ret;
        }

        const c = contract(rs)
        const res1 = await c.fooRoute({body: {}, method: 'GET', uri: '/', headers: {}})
        const res2 = await c.barRoute({
            body: {bar: {a: '123', b: []}},
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
