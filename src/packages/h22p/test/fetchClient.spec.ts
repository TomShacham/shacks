import {testClientContract} from "../../test-shared/client.contract.spec";
import {Body, FetchClient, h22pServer, HttpRequest, HttpResponse, Req, URI} from "../src";
import {expect} from "chai";

describe('fetch client', () => {
    const handler = (baseUrl: string) => new FetchClient(baseUrl);

    describe('contract', () => {
        testClientContract(handler);
    })

    /*
        parts that differ between node and fetch client are tested below
     */

    it('GET with uri parts echoed back, except the fragment', async () => {
        const {port, close} = await h22pServer({
            async handle(req: HttpRequest): Promise<HttpResponse> {
                const uri = URI.parse(req.uri);
                return {status: 200, body: JSON.stringify(uri), headers: {}}
            }
        });
        const client = handler(`http://localhost:${port}`);
        const res = await client.handle(
            Req.get(`/path/name?query1=value1&query2=value2#fragment`)
        )
        expect(res.status).eq(200);
        expect(await Body.json(res.body!)).deep.eq({
            // no fragment here,
            path: "/path/name",
            query: "?query1=value1&query2=value2"
        });
        await close()
    })
})