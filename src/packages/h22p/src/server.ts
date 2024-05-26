import {h22p, HttpHandler, HttpResponse, Method} from "./interface";
import * as http from "http";
import {AddressInfo, Server} from "node:net";
import * as timers from "timers";
import * as stream from "stream";
import process from 'node:process';

export type HttpServer = {
    server: Server;
    port: number;
    close: (timeout?: number) => Promise<Awaited<unknown>>
};

export async function httpServer(handler: HttpHandler, port = 0, host: string = '127.0.0.1'): Promise<HttpServer> {
    const server = http.createServer();
    process.once('uncaughtException', (e) => {
        if ('code' in e && e.code === 'ECONNRESET') {
            console.log('Connection reset by client');
        }
    })
    const listening = server.listen({port: port ?? 0, host: host})
    await new Promise(res => server.on('listening', (e: Event) => {
        port = (listening.address() as AddressInfo).port
        res(e)
    }))

    server.on('request', async (nodeReq: http.IncomingMessage, nodeResponse: http.ServerResponse) => {
        const {headers, method, url} = nodeReq;
        const res = await handler.handle(h22p.request({
            body: nodeReq,
            headers,
            method: method as Method,
            uri: url
        }));
        if (method?.toLowerCase() === 'head') setDefaultContentLengthAndType(res);
        nodeResponse.writeHead(res.status, res.headers)
        if (res.body instanceof stream.Readable) {
            res.body.on('end', () => nodeResponse.end())
            res.body.pipe(nodeResponse)
        } else if (typeof res.body === 'object') {
            nodeResponse.write(JSON.stringify(res.body));
            nodeResponse.end();
        } else {
            nodeResponse.write(res.body);
            nodeResponse.end();
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

    function setDefaultContentLengthAndType(res: HttpResponse) {
        if (res.headers["content-length"] === undefined && (typeof res.body === 'string' || res.body instanceof Buffer)) {
            res.headers["content-length"] = res.body.length.toString()
        }
        if (res.headers["content-type"] === undefined && (typeof res.body === 'string')) {
            res.headers["content-type"] = 'text/plain'
        }
    }

    return {server, port, close};
}