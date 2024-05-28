import {testClientContract} from "./client.contract.spec";
import {Body, h22p, HttpRequest, HttpResponse, URI} from "../src";
import {expect} from "chai";

describe('h22p node client', () => {
    const handler = h22p.client;

    describe('contract', () => {
        testClientContract(handler);
    })

    /*
        parts that differ between node and fetch client are tested below
     */

    it('GET with uri parts echoed back', async () => {
        const {port, close} = await h22p.server({
            async handle(req: HttpRequest): Promise<HttpResponse> {
                const uri = URI.parse(req.uri);
                return {status: 200, body: JSON.stringify(uri), headers: {}}
            }
        });
        const client = handler(`http://localhost:${port}`);
        const res = await client.handle(
            h22p.get(`/path/name?query1=value1&query2=value2#fragment`)
        )
        expect(res.status).eq(200);
        expect(await Body.json(res.body!)).deep.eq({
            fragment: "#fragment",
            path: "/path/name",
            query: "?query1=value1&query2=value2"
        });
        await close()
    })
})