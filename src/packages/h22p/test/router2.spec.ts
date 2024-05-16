// the problem so far is
import {JsonArray, JsonBody, JsonObject, Method} from "../src";

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
type serde = (str: string) => string
type matcher<MBody extends Body = Body> = {
    path: string,
    method: string,
    query: { [k: string]: serde },
    headers: { [k: string]: serde },
    body?: MBody
};


// if req matches then handler responds else 404s
type routes<ReqB extends Body = Body, ResB extends Body = Body> = {
    [key: string]: { req: matcher, handler: handler<ReqB, ResB> }
}

interface route<
    ReqB extends Body = Body,
    ResB extends Body = Body,
    MBody extends Body = Body
> {
    req: matcher<MBody>,
    handler: handler<MBody, ResB>
}

type routeHandler<
    ReqB extends Body,
    ResB extends Body,
    R extends route<ReqB, ResB> = route<ReqB, ResB>> = R extends {
    req: matcher,
    handler: handler<ReqB, ResB>
} ? handler<ReqB, ResB> : never;

type api<Routes extends routes<ReqB, ResB>, ReqB extends Body = Body, ResB extends Body = Body> = {
    [Key in keyof Routes]: Routes[Key] extends route<infer RqB extends Body, infer RsB extends Body>
        ? route<RqB, RsB>
        : never
};

type every<O extends { [K in keyof O]: any }> = Extract<O, false>

type ObjectExtends<A extends JsonBody, B extends JsonBody> =
    A extends JsonObject
        ? B extends JsonObject
            ? hasSameKeys<A, B>
            : false
        : A extends Array<infer T>
            ? B extends Array<infer R>
                ? A extends B
                    ? A : 'arrays not extending'
                : 'one array one not array'
            : A extends B
                ? A
                : 'primitive different';

type hasSameKeys<A extends JsonObject, B extends JsonObject> = {
    [K in keyof B]: K extends keyof A
        ? A[K] extends JsonObject
            ? B[K] extends JsonObject
                ? hasSameKeys<A[K], B[K]>
                : B[K] extends undefined
                    ? A
                    : 'one object one not'
            : A[K] extends B[K]
                ? A
                : 'primitive different'
        : 'key in B not in A'; // if key not in B then A still extends it
};
type a = ObjectExtends<{ a: 1 }, {}>;
type b<T extends JsonObject | JsonArray> = T extends JsonObject ? Extract<a[keyof a], object> : T;
type c = b<a>

/*
 TODO infer request body type with a body serde
    path, query, headers, method -> easy just copy router
    but hard: request body
*/
describe('test', () => {
    it('does a thing', async () => {
        const example = {some: {a: '123', b: [1, 2, 3]}};

        const rs = {
            fooRoute: {
                req: {path: '/', query: {}, headers: {}, method: 'GET'},
                handler: async (req: req) => {
                    return {body: {some: 'some'}, headers: {}, status: 200}
                }
            },
            barRoute: {
                req: {path: '/', query: {}, headers: {}, method: 'POST', body: example},
                handler: async (req: req) => {
                    return {body: {other: 'other'}, headers: {}, status: 200}
                }
            }
        }

        function contractfor<
            T extends api<Routes, ReqB, ResB>,
            Routes extends routes<ReqB, ResB>,
            ReqB extends Body,
            ResB extends Body,
        >(api: T): {
            [K in keyof T]: T[K] extends route<infer RqB extends Body, infer RsB extends Body, infer MB extends Body>
                ? routeHandler<MB, RsB>
                : never
        } {
            let ret = {} as any;
            for (let f in api) {
                const r = api[f].handler;
                ret[f] = (req: req) => r(req)
            }
            return ret;
        }

        const c = contractfor(rs)
        const res1 = await c.fooRoute({body: {}, method: 'GET', uri: '/', headers: {}})
        const res2 = await c.barRoute({
            body: {some: {a: '123', b: [1]}, extra: 'stuff'},
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
