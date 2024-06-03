import {HttpHandler, HttpRequest, HttpResponse, Res, URI} from "@shacks/h22p";
import {isProductionEnv} from "../env/isProductionEnv";

export class RedirectToHttps implements HttpHandler {
    constructor(
        private delegate: HttpHandler,
        private redirectPredicate: () => boolean = isProductionEnv) {
    }

    async handle(req: HttpRequest): Promise<HttpResponse> {
        const protocol = req.headers['x-forwarded-proto'];
        if (this.redirectPredicate() && protocol !== 'https') {
            const url = URI.parse(req.uri);
            const host = req.headers.host;
            const location = host ? `https://${host}${url.path}` : url.path!;
            console.log(`redirecting from http to https for ${url.path}`);
            return Res.movedPermanently({headers: {"location": location}, body: location})
        } else {
            return this.delegate.handle(req);
        }
    }
}