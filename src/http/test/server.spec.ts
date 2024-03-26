import {client} from "../src/client";
import {Req, res, Res} from "../src/interface";
import {httpServer} from "../src/server";
import {expect} from "chai";


describe('client / server', () => {
    it('send / receive request / response', async () => {
        const handler = {
            async handle(req: Req): Promise<Res> {
                return res({body: JSON.stringify(req)})
            }
        };
        const {port, close} = await httpServer(handler);
        const response = await client().handle({
            method: 'POST',
            path: `http://localhost:${port}/`,
            headers: {},
            body: 'blah'
        });
        expect(response).to.deep.eq({
                status: 200,
                statusText: 'OK',
                body: `{"method":"POST","path":"/","headers":{"host":"localhost:${port}","connection":"close","transfer-encoding":"chunked"},"trailers":{}}`,
                headers: {
                    date: 'Tue, 26 Mar 2024 10:27:59 GMT',
                    connection: 'close',
                    'transfer-encoding': 'chunked'
                },
                trailers: {}
            }
        )
        await close()
    });
})