import {httpServer} from "../src/server";
import {assert, expect} from "chai";
import * as fs from "fs";
import * as stream from "stream";
import * as zlib from "zlib";
import {Body, HttpRequest, HttpResponse, MultipartForm, Req, Res} from "@shacks/h22p";
import {nodeHttpClient} from "../src";

describe('client / server', function () {
    it('sends and receives http messages', async () => {
        const handler = {
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return Res.of({status: 201, headers: req.headers, body: await Body.text(req.body!)})
            }
        };
        const {port, close} = await httpServer(handler);

        try {
            const response = await nodeHttpClient({baseUrl: `http://localhost:${port}`}).handle({
                method: 'POST',
                uri: `/`,
                headers: {},
                body: 'blah'
            });
            expect(response.status).to.eq(201);
            expect(response.statusText).to.eq("Created");
            expect(response.headers["host"]).to.eq(`localhost:${port}`)
            let body = '';
            for await (const chunk of (response.body as stream.Readable)) {
                body += chunk
            }
            expect(body).to.eq(`blah`);
        } finally {
            await close()
        }
    })

    it('streaming one way', async () => {
        const handler = {
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return Res.of({
                    status: 201,
                    headers: {foo: 'bar'},
                    body: JSON.stringify({size: (await Body.text(req.body!)).length})
                })
            }
        };

        const {port, close} = await httpServer(handler);

        const fileName = 'data-streaming-one-way.txt';
        const filePath = `${__dirname}/resources/${fileName}`;

        try {
            const size = 10 * 1024 * 1024;
            fs.writeFileSync(filePath, data(size), {encoding: 'utf-8'});
            const fileStream = fs.createReadStream(filePath)
            const response = await nodeHttpClient({baseUrl: `http://localhost:${port}`}).handle({
                method: 'POST',
                uri: `/`,
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
            async handle(req: HttpRequest): Promise<HttpResponse> {
                const responseFromProxy = await nodeHttpClient({baseUrl: `http://localhost:${proxyPort}`}).handle({
                    method: "POST",
                    uri: `/`,
                    body: req.body, // file read stream
                    headers: {}
                })
                return Res.of({
                    status: 200,
                    body: responseFromProxy.body
                })
            }
        };

        const proxyHandler = {
            async handle(req: HttpRequest): Promise<HttpResponse> {
                const body = (req.body as stream.Readable).pipe(zlib.createGzip());
                return Res.of({
                    status: 201,
                    headers: {foo: 'bar'},
                    body: body,
                })
            }
        };

        const {port, close: closeServer} = await httpServer(handler);
        const {close: closeProxy} = await httpServer(proxyHandler, proxyPort, '127.0.0.1');

        const fileName = 'data-proxy.txt';
        const filePath = `${__dirname}/resources/${fileName}`;

        try {
            const size = 10 * 1024 * 1024;
            fs.writeFileSync(filePath, data(size), {encoding: 'utf-8'});
            const fileStream = fs.createReadStream(filePath)
            const response = await nodeHttpClient({baseUrl: `http://localhost:${port}`}).handle({
                method: 'POST',
                uri: `/`,
                headers: {},
                body: fileStream
            });
            expect(response.status).to.eq(200)
            let text = ''
            for await (const chunk of (response.body as stream.Readable) ?? []) {
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
            async handle(req: HttpRequest): Promise<HttpResponse> {
                const {headers: h1, body: b1} = await new MultipartForm().field(req);
                const {headers: h2, body: b2} = await new MultipartForm().field(req);
                const text1 = await Body.text(b1);
                const text2 = await Body.text(b2);

                return Res.of({status: 200, body: JSON.stringify({text: text1, file: text2})})
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
            const response = await nodeHttpClient({baseUrl: `http://localhost:${port}`}).handle({
                method: 'POST',
                uri: `/`,
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

    it('sends and receives headers (check case sensitivity and array preservation of values)', async () => {
        /*
            header names are down-cased but header values preserve their casing

            certain headers preserve array structure and others do not
            - set-cookie preserves array structure
            - cookie joins the string by a semicolon
            - all the others join with a comma
         */
        const handler = {
            async handle(req: HttpRequest): Promise<HttpResponse> {
                const headers = {
                    ...req.headers,
                    "location": "/path",
                    "FoO": "BaR",
                    accept: ["foo", "bar"],
                    "accept-charset": ["foo", "bar"],
                    "accept-encoding": ["foo", "bar"],
                    "accept-language": ["foo", "bar"],
                    connection: ["foo", "bar"],
                    cookie: ["foo", "bar"],
                    dav: ["foo", "bar"],
                    link: ["foo", "bar"],
                    prgama: ["foo", "bar"],
                    "proxy-authenticate": ["foo", "bar"],
                    "sec-websocket-extensions": ["foo", "bar"],
                    "sec-websocket-protocol": ["foo", "bar"],
                    "set-cookie": ["foo", "bar"],
                    via: ["foo", "bar"],
                    "www-authenticate": ["foo", "bar"],
                };
                return Res.seeOther({headers: headers, body: ''})
            }
        };
        const {port, close} = await httpServer(handler);

        try {
            const response = await nodeHttpClient({baseUrl: `http://localhost:${port}`}).handle(
                // @ts-ignore
                Req.get(`/`, {"ReQuEsT-HeAdEr": "r1", "array": ["1", "2", "3"]})
            );
            expect(response.status).to.eq(303);
            expect(response.statusText).to.eq("See Other");
            expect(response.headers["request-header"]).to.eq(`r1`)
            expect(response.headers["location"]).to.eq(`/path`)
            expect(response.headers["foo"]).to.eq(`BaR`)
            // gets concatenated together
            expect(response.headers["array"]).to.eq(`1, 2, 3`)

            expect(response.headers["accept"]).to.eq(['foo', 'bar'].join(', '))
            expect(response.headers["accept-charset"]).to.eq(['foo', 'bar'].join(', '))
            expect(response.headers["accept-encoding"]).to.eq(['foo', 'bar'].join(', '))
            expect(response.headers["accept-language"]).to.eq(['foo', 'bar'].join(', '))
            expect(response.headers["connection"]).to.eq(['foo', 'bar'].join(', '))
            expect(response.headers["cookie"]).to.eq(['foo', 'bar'].join('; '))
            expect(response.headers["dav"]).to.eq(['foo', 'bar'].join(', '))
            expect(response.headers["link"]).to.eq(['foo', 'bar'].join(', '))
            expect(response.headers["prgama"]).to.eq(['foo', 'bar'].join(', '))
            expect(response.headers["proxy-authenticate"]).to.eq(['foo', 'bar'].join(', '))
            expect(response.headers["sec-websocket-extensions"]).to.eq(['foo', 'bar'].join(', '))
            expect(response.headers["sec-websocket-protocol"]).to.eq(['foo', 'bar'].join(', '))
            expect(response.headers["set-cookie"]).to.deep.eq(['foo', 'bar'])
            expect(await Body.text(response.body)).to.eq(``);
        } finally {
            await close()
        }
    })

    it('handles an empty body', async () => {
        const handler = {
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return Res.ok({body: undefined})
            }
        };
        const {port, close} = await httpServer(handler);

        try {
            const response = await nodeHttpClient({baseUrl: `http://localhost:${port}`}).handle({
                method: 'POST',
                uri: `/`,
                headers: {},
                body: 'blah'
            });
            expect(response.status).to.eq(200);
            expect(response.statusText).to.eq("OK");
            let body = '';
            for await (const chunk of (response.body as stream.Readable)) {
                body += chunk
            }
            expect(body).to.eq(``);
        } finally {
            await close()
        }
    })
})

function data(bytes: number) {
    const chars = 'abcdefghijklmnopqrstuvwxyz1234567890'
    return Buffer.alloc(bytes, chars.repeat(bytes / 36))
}