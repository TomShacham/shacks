import {HttpHandler, Method, req} from "./interface";
import * as http from "http";
import {AddressInfo} from "node:net";

export async function httpServer(handler: HttpHandler, port = 0) {
    const server = http.createServer()
    const listening = server.listen({port: port ?? 0, host: '127.0.0.1'})
    await new Promise(res => server.on('listening', (e: Event) => {
        port = (listening.address() as AddressInfo).port
        res(e)
    }))
    server.on('request', async (nodeReq: http.IncomingMessage, nodeResponse: http.ServerResponse) => {
        const {headers, method} = nodeReq;
        const res = await handler.handle(req({body: nodeReq, headers, method: method as Method}));
        nodeResponse.writeHead(res.status, res.headers)
        nodeResponse.end(res.body)
    })

    server.on('error', (err) => {
        console.log(err);
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