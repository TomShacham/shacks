import {testClientContract} from "../../test-shared/client.contract.spec";
import {Body, HttpRequest, HttpResponse, Req, URI} from "@shacks/h22p";
import {expect} from "chai";
import {FetchClient} from "../src";
import {h22pServer} from "../../h22p-node/src";
import {HttpClientOptions} from "../src/fetchClient";

describe('fetch client', () => {
    const handler = (options: HttpClientOptions) => new FetchClient(options);

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
        const client = handler({baseUrl: `http://localhost:${port}`});
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