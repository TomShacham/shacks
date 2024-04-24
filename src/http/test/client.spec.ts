import {client, get} from "../src/client";
import {expect} from "chai";
import {httpServer} from "../src/server";
import {Req, Res} from "../src/interface";
import {uri} from "../src/uri";
import {Body} from "../src/body";

describe('http client', () => {

    it('GET with uri parts echoed back', async () => {
        const {port, close} = await httpServer({
            async handle(req: Req): Promise<Res> {
                const URI = uri(req.path);
                return {status: 200, body: JSON.stringify(URI), headers: {}}
            }
        });

        try {
            const res = await client().handle(get(`http://localhost:${port}/path/name?query1=value1&query2=value2#fragment`))
            expect(res.status).eq(200);
            expect(await Body.json(res.body!)).deep.eq({
                fragment: "#fragment",
                path: "/path/name",
                query: "?query1=value1&query2=value2"
            });
        } finally {
            await close();
        }
    })
})