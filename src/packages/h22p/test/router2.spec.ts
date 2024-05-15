// the problem so far is
import {JsonBody, Method} from "../src";

type Body = JsonBody | undefined;
type req<ReqB extends Body = Body> = {
    body: ReqB,
    headers: { [key: string]: string },
    uri: string,
    method: Method
}
type res<ResB extends Body = Body> = {
    body: ResB,
    headers: { [key: string]: string },
    status: number
}
type handler<ReqB extends Body = Body, ResB extends Body = Body> = (req: req<ReqB>) => Promise<res<ResB>>
type serde = { ser: (str: string) => string, de: (str: string) => string }
type matcher = {
    path: string,
    method: string,
    query: { [k: string]: serde },
    headers: { [k: string]: serde },
    body?: serde
};


// if req matches then handler responds else 404s
type routes<ReqB extends Body = Body, ResB extends Body = Body> = {
    [key: string]: { req: matcher, handler: handler<ReqB, ResB> }
}
type route<ReqB extends Body = Body, ResB extends Body = Body> = { req: matcher, handler: handler<ReqB, ResB> }
type routeHandler<ReqB extends Body, ResB extends Body, R extends route<ReqB, ResB> = route<ReqB, ResB>> = R extends {
    req: matcher,
    handler: handler<ReqB, ResB>
} ? handler<ReqB, ResB> : never;

type api<Routes extends routes<ReqB, ResB>, ReqB extends Body = Body, ResB extends Body = Body> = {
    [Key in keyof Routes]: Routes[Key] extends route<infer RqB extends Body, infer RsB extends Body>
        ? route<RqB, RsB>
        : never
};

/*
 TODO pass through response body type
    and infer request body type with a body serde ?
*/
describe('test', () => {
    it('does a thing', async () => {
        const rs = {
            fooRoute: {
                req: {path: '/', query: {}, headers: {}, method: 'GET' as Method},
                handler: async (req: req) => {
                    return {body: {some: 'json'}, headers: {}, status: 200}
                }
            }
        }

        function contractfor<
            T extends api<Routes, ReqB, ResB>,
            Routes extends routes<ReqB, ResB>,
            ReqB extends Body,
            ResB extends Body
        >(api: T): {
            [K in keyof T]: T[K] extends route<infer RqB extends Body, infer RsB extends Body>
                ? routeHandler<RqB, RsB>
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
        const resp = await c.fooRoute({body: {}, method: 'GET', uri: '/', headers: {}})

        console.log(resp.body.some);


        // client (req, handler) => Promise<res>
        //   - just passes the req to the handler
        //   - needs to know what req to construct for a route
        // server (req, handler) => Promise<res>
        //   - does some business using req info then sends res
        //   - needs to match the actual request to a route

        // so define some routes that is some partial of a req and a handler


    });
})
