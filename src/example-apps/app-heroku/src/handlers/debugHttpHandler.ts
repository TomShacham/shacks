import {HttpHandler, HttpRequest, HttpResponse} from "@shacks/h22p";
import {Logger} from "../logs/logger";

export class DebugHttpHandler implements HttpHandler {
    constructor(private handler: HttpHandler, private logger: Logger) {
    }

    async handle(req: HttpRequest): Promise<HttpResponse> {
        const start = performance.now();
        const response = await this.handler.handle(req);
        const end = performance.now();
        const timeTakenMs = (end - start).toFixed(2);
        this.logger.log(`${req.method} to ${req.uri} gave response ${response.status} ${response.statusText} in ${timeTakenMs} ms`)
        return response;
    }

}