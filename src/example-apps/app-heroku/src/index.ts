import {RedirectToHttps} from "./handlers/redirectToHttps";
import {Env} from "./env/environment";
import {Body, Req, Res} from "@shacks/h22p";
import {Route, Router} from "@shacks/h22p-router";
import {httpServer, nodeHttpClient} from "@shacks/h22p-node";

async function main() {
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const env = new Env(process.env);
    const host = env.isProduction() ? '0.0.0.0' : '127.0.0.1';

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

    const decorated = new RedirectToHttps(routingHandler, env.isProduction);
    const {server, close} = await httpServer(decorated, port, host);
}


main()