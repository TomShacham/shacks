import {h22p, route, router} from '@shacks/h22p'

async function main() {
    const {server, port, close} = await h22p.server(router([
        route('GET', '/{id}', async (req) => {
            return h22p.response({body: req.vars.path.id})
        })
    ]), 3000);
    console.log(`Running on port ${port}`);
}

main()