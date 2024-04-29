import {h22p, HttpHandler, HttpRequest, HttpResponse, route, router, URI} from '@shacks/h22p'

function isProductionEnv(env: string = process.env.NODE_ENV ?? 'local') {
    return env === 'production';
}

async function main() {
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const isProd = isProductionEnv();
    const host = isProd ? '0.0.0.0' : '127.0.0.1';

    console.log('app starting on', {port, host});

    const routingHandler = router([
        route('GET', '/path/{id}', async (req) => {
            return h22p.response({body: `hello, ${req.vars.path.id}`})
        }),
        route('GET', '/', async (req) => {
            return h22p.response({body: 'hello, world!'})
        }),

    ]);
    const decorated = new RedirectToHttps(routingHandler);
    const {server, close} = await h22p.server(decorated, port, host);
}

class RedirectToHttps implements HttpHandler {
    constructor(private delegate: HttpHandler) {
    }

    async handle(req: HttpRequest): Promise<HttpResponse> {
        const protocol = req.headers['x-forwarded-proto'];
        if (isProductionEnv() && protocol !== 'https') {
            const url = URI.of(req.path);
            const location = `https://${req.headers.host}${url.path}`;
            console.log(`redirecting from http to https for ${url.path}`);
            return h22p.response({status: 301, headers: {"location": location}, body: "Moved permanently"})
        } else {
            return this.delegate.handle(req);
        }
    }
}

main()