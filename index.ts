import {h22p, route, router} from '@shacks/h22p'

async function main() {
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

    console.log({port, host});

    const {server, close} = await h22p.server(router([
        route('GET', '/{id}', async (req) => {
            return h22p.response({body: req.vars.path.id})
        })
    ]), port, host);
    console.log(`Running on port ${port}`);
}

main()