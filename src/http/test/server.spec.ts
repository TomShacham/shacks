import {client} from "../src/client";
import {Req, res, Res} from "../src/interface";
import {httpServer} from "../src/server";
import {expect} from "chai";
import * as fs from "fs";
import {Bodies} from "../src/bodies";

describe('client / server', function () {
    it('send / receive request / response', async () => {
        const handler = {
            async handle(req: Req): Promise<Res> {
                return res({status: 201, headers: req.headers, body: await Bodies.text(req)})
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
            expect(response.headers["content-length"]).to.eq('4')
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
                    body: JSON.stringify({size: (await Bodies.text(req)).length})
                })
            }
        };

        const {port, close} = await httpServer(handler);
        const filePath = './src/http/test/resources/data.txt';

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
            expect(await Bodies.text(response)).to.eq(JSON.stringify({size}));
        } finally {
            // delete file and close server
            fs.unlinkSync(filePath)
            await close()
        }
    })
})

function data(bytes: number) {
    const chars = 'abcdefghijklmnopqrstuvwxyz1234567890'
    return Buffer.alloc(bytes, chars.repeat(bytes / 36))
}