import {client} from "../src/client";
import {Req, res, Res} from "../src/interface";
import {httpServer} from "../src/server";
import {expect} from "chai";


describe('client / server', () => {
    it('send / receive request / response', async () => {
        const handler = {
            async handle(req: Req): Promise<Res> {
                return res({status: 201, headers: {foo: 'bar'}, body: JSON.stringify(req), trailers: {baz: 'quux'}})
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
            expect(response.headers.foo).to.eq('bar')
            expect(response.trailers!.baz).to.eq('quux')
            expect(response.body).to.eq(
                `{"method":"POST","path":"/","headers":{"host":"localhost:${port}","connection":"close","transfer-encoding":"chunked"}}`
            );
        } finally {
            await close()
        }
    })
})