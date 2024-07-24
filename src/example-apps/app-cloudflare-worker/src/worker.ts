import {Method, Req, Res} from '@shacks/h22p'
import {Request} from "@cloudflare/workers-types"
import {Route, Router} from "@shacks/h22p-router";
import {whatIsAStartup} from "./blog/what-is-a-startup";
import {styles} from './styles';
import {welcome} from "./blog/welcome";
import {index} from "./blog/ddia";
import {ddiaPart1} from "./blog/ddia/ddiaPart1";
import {ddiaPart2} from "./blog/ddia/ddiaPart2";
import {ddiaPart3} from "./blog/ddia/ddiaPart3";
import {ddiaPart4} from "./blog/ddia/ddiaPart4";
import {ddiaPart5} from "./blog/ddia/ddiaPart5";
import {ddiaPart6} from "./blog/ddia/ddiaPart6";
import {ddiaPart7} from "./blog/ddia/ddiaPart7";
import {ddiaPart8} from "./blog/ddia/ddiaPart8";
import {ddiaPart9} from "./blog/ddia/ddiaPart9";

export default {
    async fetch(request: Request) {
        const url = new URL(request.url).toString();
        const body = (request.body === null ? undefined : request.body) as ReadableStream | undefined;
        const headers = request.headers;
        let hds: { [name: string]: string } = {}
        for (const key of headers.keys()) {
            const value = headers.get(key);
            if (value !== null) hds[key] = value;
        }
        const method = request.method.toUpperCase() as Method;
        const req = Req.of({method, uri: url, body: body, headers: hds})
        const router = Router.of(routes);
        const res = await router.handle(req);
        const responseHeaders = res.headers as Record<string, string>;

        return new Response(res.body as ReadableStream, {
            headers: new Headers(responseHeaders),
            status: res.status,
            statusText: res.statusText
        });
    }
}

const routes = {
    styles: Route.get('/styles.css', async (req) => {
        return Res.ok({body: styles, headers: {'content-type': 'text/css'}});
    }),
    welcome: Route.get('/blog/welcome', async (req) => {
        return Res.ok({body: welcome, headers: {'content-type': 'text/html'}});
    }),
    whatIsAStartup: Route.get('/blog/what-is-a-startup', async (req) => {
        return Res.ok({body: whatIsAStartup, headers: {'content-type': 'text/html'}});
    }),
    ddiaIndex: Route.get('/blog/ddia', async (req) => {
        return Res.ok({body: index, headers: {'content-type': 'text/html'}});
    }),
    ddiaPart1: Route.get('/blog/ddia/part-1-reliable-scalable-and-maintainable-systems', async (req) => {
        return Res.ok({body: ddiaPart1, headers: {'content-type': 'text/html'}});
    }),
    ddiaPart2: Route.get('/blog/ddia/part-2-data-models-and-query-languages', async (req) => {
        return Res.ok({body: ddiaPart2, headers: {'content-type': 'text/html'}});
    }),
    ddiaPart3: Route.get('/blog/ddia/part-3-storage-and-retrieval', async (req) => {
        return Res.ok({body: ddiaPart3, headers: {'content-type': 'text/html'}});
    }),
    ddiaPart4: Route.get('/blog/ddia/part-4-encoding-and-evolution', async (req) => {
        return Res.ok({body: ddiaPart4, headers: {'content-type': 'text/html'}});
    }),
    ddiaPart5: Route.get('/blog/ddia/part-5-replication', async (req) => {
        return Res.ok({body: ddiaPart5, headers: {'content-type': 'text/html'}});
    }),
    ddiaPart6: Route.get('/blog/ddia/part-6-partitioning', async (req) => {
        return Res.ok({body: ddiaPart6, headers: {'content-type': 'text/html'}});
    }),
    ddiaPart7: Route.get('/blog/ddia/part-7-transactions', async (req) => {
        return Res.ok({body: ddiaPart7, headers: {'content-type': 'text/html'}});
    }),
    ddiaPart8: Route.get('/blog/ddia/part-8-trouble-with-distributed-systems', async (req) => {
        return Res.ok({body: ddiaPart8, headers: {'content-type': 'text/html'}});
    }),
    ddiaPart9: Route.get('/blog/ddia/part-9-consistency-and-consensus', async (req) => {
        return Res.ok({body: ddiaPart9, headers: {'content-type': 'text/html'}});
    }),
}