import {client} from "../src/client";
import {Req, Res, response} from "../src/interface";
import {httpServer} from "../src/server";
import {assert, expect} from "chai";
import * as fs from "fs";
import {Body, MultipartForm} from "../src/body";
import * as stream from "stream";
import * as zlib from "zlib";

describe('client / server', function () {
    it('sends and receives http messages', async () => {
        const handler = {
            async handle(req: Req): Promise<Res> {
                return response({status: 201, headers: req.headers, body: await Body.text(req.body!)})
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
                return response({
                    status: 201,
                    headers: {foo: 'bar'},
                    body: JSON.stringify({size: (await Body.text(req.body!)).length})
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
            expect(await Body.text(response.body!)).to.eq(JSON.stringify({size}));
        } finally {
            // delete file and close server
            fs.unlinkSync(filePath)
            await close()
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
                return response({
                    status: 200,
                    body: responseFromProxy.body
                })
            }
        };

        const proxyHandler = {
            async handle(req: Req): Promise<Res> {
                const body = (req.body as stream.Readable).pipe(zlib.createGzip());
                return response({
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

    it('multipart form data', async () => {
        const handler = {
            async handle(req: Req): Promise<Res> {
                const {headers: h1, body: b1} = await MultipartForm.multipartFormField(req);
                const {headers: h2, body: b2} = await MultipartForm.multipartFormField(req);
                const text1 = await Body.text(b1);
                const text2 = await Body.text(b2);

                return response({status: 200, body: JSON.stringify({text: text1, file: text2})})
            }
        };

        const {port, close: closeServer} = await httpServer(handler);

        try {
            const boundary = `----WebKitFormBoundary5TIW9pTKMB25OROE`;
            const payload = `--${boundary}
Content-Disposition: form-data; name="name"

Tommy
--${boundary}
Content-Disposition: form-data; name="file"; filename="test.txt"
Content-Type: text/plain

Upload test file
--${boundary}--

`
            const response = await client().handle({
                method: 'POST',
                path: `http://localhost:${port}/`,
                headers: {'content-type': `multipart/form-data; boundary=${boundary}`},
                body: payload
            });
            expect(response.status).to.eq(200);
            expect(response.statusText).to.eq("OK");
            expect(await Body.text(response.body!)).to.eq('{"text":"Tommy","file":"Upload test file"}');
        } finally {
            await closeServer()
        }
    })
})

function data(bytes: number) {
    const chars = 'abcdefghijklmnopqrstuvwxyz1234567890'
    return Buffer.alloc(bytes, chars.repeat(bytes / 36))
}