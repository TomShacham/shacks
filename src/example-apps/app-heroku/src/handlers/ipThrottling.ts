import {Clock} from "../time/clock";
import {HttpHandler, HttpRequest, Res} from "@shacks/h22p";
import {clearInterval} from "node:timers";

export class IPThrottling implements HttpHandler {
    /*
        provides some ip based throttling - obviously this is per app instance and reset on deployment
        but you could provide storage if you want it to be persistent
     */

    constructor(
        private delegate: HttpHandler,
        private clock: Clock,
        private reqPerMinute: number,
        private requests: { [ip: string]: number } = {},
        private checkInterval: number = 1000,
        private getIp: (...args: any[]) => string = (req: HttpRequest) => req.headers["X-IP"] as string
    ) {
        this.clear(checkInterval)
    }

    private SECONDS_60 = 60_000;
    private lastChecked = this.clock.now();
    private loop;


    async handle(req: HttpRequest) {
        if (this.overQuota(this.getIp(req))) {
            return Res.of({status: 429, body: 'Too many requests'})
        }
        return this.delegate.handle(req)
    }

    stop() {
        clearInterval(this.loop);
    }

    private overQuota(ip: string) {
        if (!ip) return true;
        const requests = this.requests[ip] ?? 0;
        if (requests >= this.reqPerMinute) {
            return true;
        }
        this.requests[ip] = requests + 1
        return false
    }

    private clear(checkInterval: number) {
        this.loop = setInterval(() => {
            if ((this.clock.now().getTime() - this.lastChecked.getTime()) >= this.SECONDS_60) {
                this.requests = {};
            }
        }, checkInterval)
        this.requests = {}
    }
}