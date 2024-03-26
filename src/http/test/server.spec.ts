import {client} from "../src/client";
import {Req, res, Res} from "../src/interface";
import {httpServer} from "../src/server";
import {expect} from "chai";
import * as fs from "fs";
import {Wire} from "../src/wire";

describe('client / server', function () {
    it('send / receive request / response', async () => {
        const handler = {
            async handle(req: Req): Promise<Res> {
                return res({status: 201, headers: req.headers, body: await Wire.text(req)})
            }
        };
        const {port, close} = await httpServer(handler);

        try {
            const response = await client().handle({
                method: 'POST',
                path: `http://localhost:${port}/`,
                headers: {},
                body: 'blah'
            });
            expect(response.status).to.eq(201);
            expect(response.statusText).to.eq("Created");
            expect(response.headers["host"]).to.eq(`localhost:${port}`)
            let body = '';
            for await (const chunk of response.body ?? ['foooooock']) {
                body += chunk
            }
            expect(body).to.eq(`blah`);
        } finally {
            await close()
        }
    })

    it('streaming one way', async () => {
        const handler = {
            async handle(req: Req): Promise<Res> {
                return res({
                    status: 201,
                    headers: {foo: 'bar'},
                    body: JSON.stringify({size: (await Wire.text(req)).length})
                })
            }
        };

        const {port, close} = await httpServer(handler);

        const fileName = 'data-streaming-one-way.txt';
        const filePath = './src/http/test/resources/' + fileName;

        try {
            const size = 10 * 1024 * 1024;
            fs.writeFileSync(filePath, data(size), {encoding: 'utf-8'});
            const fileStream = fs.createReadStream(filePath)
            const response = await client().handle({
                method: 'POST',
                path: `http://localhost:${port}/`,
                headers: {},
                body: fileStream
            });
            expect(response.status).to.eq(201);
            expect(response.statusText).to.eq("Created");
            expect(response.headers.foo).to.eq('bar')
            expect(await Wire.text(response)).to.eq(JSON.stringify({size}));
        } finally {
            // delete file and close server
            fs.unlinkSync(filePath)
            await close()
        }
    })

    it('proxies stream', async function () {
        const proxyPort = 1234;

        const handler = {
            async handle(req: Req): Promise<Res> {
                const responseFromProxy = await client().handle({
                    method: "POST",
                    path: `http://localhost:${proxyPort}`,
                    body: req.body, // file read stream
                    headers: {}
                })
                return res({
                    status: 200,
                    body: responseFromProxy.body
                })
            }
        };

        const proxyHandler = {
            async handle(req: Req): Promise<Res> {
                console.log('proxy handling request');
                return res({
                    status: 201,
                    headers: {foo: 'bar'},
                    body: req.body,
                })
            }
        };

        const {port, close: closeServer} = await httpServer(handler);
        const {close: closeProxy} = await httpServer(proxyHandler, proxyPort);

        const fileName = 'data-proxy.txt';
        const filePath = './src/http/test/resources/' + fileName;

        try {
            const size = 10 * 1024 * 1024;
            fs.writeFileSync(filePath, data(size), {encoding: 'utf-8'});
            const fileStream = fs.createReadStream(filePath)
            const response = await client().handle({
                method: 'POST',
                path: `http://localhost:${port}/`,
                headers: {},
                body: fileStream
            });
            expect(response.status).to.eq(200)

        } finally {
            // delete file and close server
            // fs.unlinkSync(filePath)
            await closeServer()
            await closeProxy()
        }
    })
})

function data(bytes: number) {
    const chars = 'abcdefghijklmnopqrstuvwxyz1234567890'
    return Buffer.alloc(bytes, chars.repeat(bytes / 36))
}