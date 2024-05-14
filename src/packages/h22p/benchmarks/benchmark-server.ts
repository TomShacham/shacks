import {h22p, HttpRequest, HttpResponse} from "../src";

process.on('uncaughtException', (e) => {
    if ('code' in e && e.code === 'ECONNRESET') {
        console.log('Connection reset by client');
    }
})

async function server() {
    await h22p.server({
        async handle(req: HttpRequest): Promise<HttpResponse> {
            return h22p.ok({body: 'hello, world!'})
        }
    }, 3333, '127.0.0.1');
}

server()