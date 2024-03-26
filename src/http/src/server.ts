import {HttpHandler, Method, req} from "./interface";
import * as http from "http";
import {AddressInfo} from "node:net";

export async function httpServer(handler: HttpHandler, port = 0) {
    const server = http.createServer()
    const listening = server.listen({port: port ?? 0, host: '127.0.0.1'})
    await new Promise(res => server.on('listening', e => {
        console.log(`listening on ${JSON.stringify(listening.address())}`);
        port = (listening.address() as AddressInfo).port
        res(e)
    }))
    server.on('request', async (nodeReq: http.IncomingMessage, nodeRes: http.ServerResponse) => {
        const {headers, method} = nodeReq;
        let body;
        nodeReq.on('data', chunk => {
            body += chunk.toString('utf-8');
        })
        const res = await handler.handle(req({body, headers, method: method as Method}));
        nodeRes.writeHead(res.status, res.headers)
        nodeRes.end(res.body);
    })

    server.on('clientError', (err, socket) => {
        console.error('client error', err);
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

    function close() {
        return new Promise(async res => {
            server.on('close', res);
            server.close()
        });
    }

    return {server, port, close};
}