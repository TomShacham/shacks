import {RedirectToHttps} from "./handlers/redirectToHttps";
import {isProductionEnv} from "./env/isProductionEnv";
import {httpServer, Res, Route, Router} from "@shacks/h22p";

async function main() {
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const isProd = isProductionEnv();
    const host = isProd ? '0.0.0.0' : '127.0.0.1';

    console.log('app starting on', {port, host});

    const routingHandler = Router.of({
        getResource: Route.get('/path/{id}', async (req) => {
            return Res.ok({body: `hello, ${req.vars.path.id}`})
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


main()