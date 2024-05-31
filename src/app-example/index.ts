import {HttpHandler, HttpRequest, HttpResponse, httpServer, Res, Route, Router, URI} from "../packages/h22p/src";

function isProductionEnv(env: string = process.env.NODE_ENV ?? 'local') {
    return env === 'production';
}

async function main() {
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const isProd = isProductionEnv();
    const host = isProd ? '0.0.0.0' : '127.0.0.1';

    console.log('app starting on', {port, host});

    const routingHandler = Router.of({
        getResource: Route.get('/path/{id}', async (req) => {
            req.vars!.path;
                return Res.ok({body: `hello, ${req.vars?.path.id}`})
            }
        ),
        getRoot: Route.get('/', async (req) => {
                return Res.ok({body: 'hello, world!'})
            }
        ),
    });
    const decorated = new RedirectToHttps(routingHandler);
    const {server, close} = await httpServer(decorated, port, host);
}

class RedirectToHttps implements HttpHandler {
    constructor(private delegate: HttpHandler) {
    }

    async handle(req: HttpRequest): Promise<HttpResponse> {
        const protocol = req.headers['x-forwarded-proto'];
        if (isProductionEnv() && protocol !== 'https') {
            const url = URI.parse(req.uri);
            const location = `https://${req.headers.host}${url.path}`;
            console.log(`redirecting from http to https for ${url.path}`);
            return Res.movedPermanently({headers: {"location": location}, body: "Moved permanently"})
        } else {
            return this.delegate.handle(req);
        }
    }
}

main()