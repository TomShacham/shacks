import {h22p, route, router} from '@shacks/h22p'

async function main() {
    console.log(process.env.PORT);
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const {server, close} = await h22p.server(router([
        route('GET', '/{id}', async (req) => {
            return h22p.response({body: req.vars.path.id})
        })
    ]), port);
    console.log(`Running on port ${port}`);
}

main()