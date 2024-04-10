import {client} from "../src/client";
import {Req, res, Res} from "../src/interface";
import {httpServer} from "../src/server";
import {assert, expect} from "chai";
import * as fs from "fs";
import {Body} from "../src/body";
import * as stream from "stream";
import * as zlib from "zlib";
import * as process from "process";

describe('client / server', function () {
    it('send / receive request / response', async () => {
        const handler = {
            async handle(req: Req): Promise<Res> {
                return res({status: 201, headers: req.headers, body: await Body.text(req)})
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
                    body: JSON.stringify({size: (await Body.text(req)).length})
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
            expect(await Body.text(response)).to.eq(JSON.stringify({size}));
        } finally {
            // delete file and close server
            fs.unlinkSync(filePath)
            await close()
        }
    })

    it('multipart form data', async () => {
        const handler = {
            async handle(req: Req): Promise<Res> {
                return res({status: 200, body: req.body})
            }
        };

        const {port, close: closeServer} = await httpServer(handler);

        const fileName = 'data-streaming-one-way.txt';

        try {
            const size = 10 * 1024 * 1024;
            // payload has two input fields, one is text field "name", one is file field
            const payload = `------WebKitFormBoundary5TIW9pTKMB25OROE
Content-Disposition: form-data; name="name"

Tommy
------WebKitFormBoundary5TIW9pTKMB25OROE
Content-Disposition: form-data; name="file"; filename="test.txt"
Content-Type: text/plain

Upload test file
------WebKitFormBoundary5TIW9pTKMB25OROE--

`
            const response = await client().handle({
                method: 'POST',
                path: `http://localhost:${port}/`,
                headers: {'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryF0Nj67HEBBHHIhcv'},
                body: payload
            });
            expect(response.status).to.eq(200);
            expect(response.statusText).to.eq("OK");
            expect(await Body.text(response)).to.eq('testing file uploads');
        } finally {
            await closeServer()
        }
    })

    it('proxies stream - can do on the fly compression', async function () {
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
                const body = (req.body as stream.Readable).pipe(zlib.createGzip());
                return res({
                    status: 201,
                    headers: {foo: 'bar'},
                    body: body,
                })
            }
        };

        const {port, close: closeServer} = await httpServer(handler);
        const {close: closeProxy} = await httpServer(proxyHandler, proxyPort);

        const fileName = 'data-proxy.txt';
        const filePath = './src/http/test/resources/' + fileName;

        try {
            const size = 10 * 1024 * 1024;
            setInterval(() => {
                console.log(Object.entries(process.memoryUsage()).map(p => [p[0], Number(p[1]) / (1024 * 1024)]));
            }, 1)
            fs.writeFileSync(filePath, data(size), {encoding: 'utf-8'});
            const fileStream = fs.createReadStream(filePath)
            const response = await client().handle({
                method: 'POST',
                path: `http://localhost:${port}/`,
                headers: {},
                body: fileStream
            });
            expect(response.status).to.eq(200)
            let text = ''
            for await (const chunk of response.body ?? []) {
                text += chunk.toString()
            }
            // compressed
            assert(text.length < size)
        } finally {
            // delete file and close server
            fs.unlinkSync(filePath)
            await closeServer()
            await closeProxy()
        }
    })
})

function data(bytes: number) {
    const chars = 'abcdefghijklmnopqrstuvwxyz1234567890'
    return Buffer.alloc(bytes, chars.repeat(bytes / 36))
}