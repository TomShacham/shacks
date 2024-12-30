import {Body, HttpHandler, HttpRequest, HttpResponse, Req, Res} from "@shacks/h22p";
import {expect} from "chai";
import {describe} from "mocha"
import * as crypto from 'crypto';
import {AsyncLocalStorage} from "node:async_hooks";
import {Clock, SystemClock} from "../../src/time/clock";
import {Route, Router} from "@shacks/h22p-router";
import {h22pServer, nodeHttpClient} from "@shacks/h22p-node";

class OpenTracingHttpHandler implements HttpHandler {
    constructor(
        private handler: HttpHandler,
        private storage: AsyncLocalStorage<TraceContext>,
        private uuidGenerator: () => string = crypto.randomUUID,
        private clock: Clock = new SystemClock(),
        private writer: (log: string[]) => any = console.log
    ) {
    }

    async handle(req: HttpRequest): Promise<HttpResponse> {
        const traceId = this.storage.getStore()?.ids?.traceId ?? this.uuid();
        const spanId = this.storage.getStore()?.ids?.spanId;
        const thisSpanId = this.uuid();
        const traceContext = {
            ids: {
                traceId,
                spanId: thisSpanId,
                parentId: spanId
            }
        };
        this.storage.run(traceContext, () => {
        });
        const start = this.clock.now();
        if (!req.headers['X-B3-TraceId']) {
            req.headers['X-B3-TraceId'] = traceId;
        }
        if (!req.headers['X-B3-SpanId']) {
            req.headers['X-B3-SpanId'] = thisSpanId;
        }
        if (!req.headers['X-B3-ParentId']) {
            req.headers['X-B3-ParentId'] = spanId;
        }
        const httpResponse = await this.handler.handle(req);
        const end = this.clock.now();
        return httpResponse;
    }

    private uuid() {
        return this.uuidGenerator()
    }
}

describe('open telemetry', () => {
    xit('tracing http requests', async () => {
        const router = Router.of({
            getRoot: Route.get('/', async (req) => {
                return Res.ok({body: JSON.stringify(req.headers)});
            }),
            postRoot: Route.post('/', async () => Res.created({body: 'hello, post'}))
        });
        let uuid = 1;
        const uuidGenerator = () => (uuid++).toString();
        const storage = new AsyncLocalStorage<TraceContext>();
        const debugHandler = new OpenTracingHttpHandler(router, storage, uuidGenerator);
        const {port, close} = await h22pServer(debugHandler);
        const httpClient = nodeHttpClient(`http://localhost:${port}`);
        const withTracing = new OpenTracingHttpHandler(httpClient, storage, uuidGenerator);
        const response1 = await withTracing.handle(Req.get('/'));
        // const response2 = await client.handle(Req.post('http://localhost/', {}));
        const val = await Body.json(response1.body);
        expect(val).deep.eq({
            "X-B3-TraceId": "1",
            "X-B3-SpanId": "2",
        })

        await close();
    })
})

type TraceContext = {
    ids: {
        spanId: string | undefined;
        traceId: string | undefined;
        parentId: string | undefined;
    } | undefined
}