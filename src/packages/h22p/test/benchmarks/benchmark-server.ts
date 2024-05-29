import {h22pServer, HttpRequest, HttpResponse, Res} from "../../src";

process.on('uncaughtException', (e) => {
    if ('code' in e && e.code === 'ECONNRESET') {
        console.log('Connection reset by client');
    }
})

async function server() {
    await h22pServer({
        async handle(req: HttpRequest): Promise<HttpResponse> {
            return Res.ok({body: 'hello, world!'})
        }
    }, 3333, '127.0.0.1');
}

server()