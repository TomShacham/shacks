import {HttpHandler, Method, request} from "./interface";
import * as http from "http";
import {AddressInfo} from "node:net";
import * as timers from "timers";
import * as stream from "stream";
import * as process from "process";

export async function httpServer(handler: HttpHandler, port = 0) {
    const server = http.createServer();
    process.on('uncaughtException', (e) => {
        if ('code' in e && e.code === 'ECONNRESET') {
            console.log('Connection reset by client');
        }
    })
    const listening = server.listen({port: port ?? 0, host: '127.0.0.1'})
    await new Promise(res => server.on('listening', (e: Event) => {
        port = (listening.address() as AddressInfo).port
        res(e)
    }))
    server.on('request', async (nodeReq: http.IncomingMessage, nodeResponse: http.ServerResponse) => {
        const {headers, method, url} = nodeReq;
        const res = await handler.handle(request({body: nodeReq, headers, method: method as Method, path: url}));
        nodeResponse.writeHead(res.status, res.headers)
        if (res.body instanceof stream.Readable) {
            res.body.on('end', () => nodeResponse.end())
            res.body.pipe(nodeResponse)
        } else {
            nodeResponse.write(res.body)
            nodeResponse.end()
        }
    })
    server.on('error', (err) => {
        console.log(err);
    })

    server.on('clientError', (err, socket) => {
        console.error('client error', err);
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

    function close(timeout = 100) {
        return Promise.race([
            new Promise(async res => {
                server.on('close', res);
                server.unref()
                server.close(() => {
                })
            }),
            new Promise(res => timers.setTimeout(() => res(null), timeout))
        ]);
    }

    return {server, port, close};
}