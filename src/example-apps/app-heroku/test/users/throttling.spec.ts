import {describe} from "mocha";
import {expect} from "chai";
import {HttpHandler, HttpRequest, Req, Res} from "@shacks/h22p";
import {TickingClock} from "../../src/time/clock";
import {IPThrottling} from "../../src/handlers/ipThrottling";


describe('throttling', function () {
    /*
        even though we could do this at the edge, it's useful to know we can do it at the app level too
     */
    it('throttles based on IP', async () => {
        const delegate = new class implements HttpHandler {
            async handle(req: HttpRequest) {
                return Res.ok({body: 'hello, world'});
            }
        };
        const tickingClock = new TickingClock();
        const reqPerMinute = 1;
        const checkingInterval = 1;

        const ipThrottling = new IPThrottling(delegate, tickingClock, reqPerMinute, {}, checkingInterval);
        const req = Req.get('/', {"X-IP": "1.1.1.1"});
        const {status: status1, body: body1} = await ipThrottling.handle(req);
        expect({status: status1, body: body1}).deep.eq({status: 200, body: 'hello, world'});

        const {status: status2, body: body2} = await ipThrottling.handle(req);
        expect({status: status2, body: body2}).deep.eq({status: 429, body: 'Too many requests'});

        // go forward 1 minute
        tickingClock.tick(60)
        // let one event loop cycle tick through
        await new Promise(res => setTimeout(res, 1))

        const {status: status3, body: body3} = await ipThrottling.handle(req);
        expect({status: status3, body: body3}).deep.eq({status: 200, body: 'hello, world'});

        const {status: status4, body: body4} = await ipThrottling.handle(req);
        expect({status: status4, body: body4}).deep.eq({status: 429, body: 'Too many requests'});
    });
});