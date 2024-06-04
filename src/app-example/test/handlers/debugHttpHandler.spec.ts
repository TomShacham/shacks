import {Req, Res, Route, Router} from "../../../packages/h22p/src";
import {expect} from "chai";
import {describe, it} from "mocha"
import {LoggerInMemory} from "../../src/logs/logger";
import {DebugHttpHandler} from "../../src/handlers/debugHttpHandler";

describe('debug https', () => {
    it('gives timings and overview', async () => {
        const router = Router.of({
            getRoot: Route.get('/', async () => Res.ok({body: 'hello, world'})),
            postRoot: Route.post('/', {}, async () => Res.created({body: 'hello, post'}))
        });
        const loggerInMemory = new LoggerInMemory();
        const debugHandler = new DebugHttpHandler(router, loggerInMemory);
        const response1 = await debugHandler.handle(Req.get('http://localhost/'));
        const response2 = await debugHandler.handle(Req.post('http://localhost/', {}));
        expect(loggerInMemory.logs[0].match(
            new RegExp(`GET to http://localhost/ gave response 200 OK in \\d{1,2}\\.?\\d{1,2} ms`))
        ).not.eq(null);
    })
})