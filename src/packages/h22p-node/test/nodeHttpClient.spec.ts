import {testClientContract} from "../../test-shared/client.contract.spec";
import {Body, HttpRequest, HttpResponse, Req, URI} from "@shacks/h22p";
import {expect} from "chai";
import {h22pServer, nodeHttpClient} from "../src";

describe('h22p node client', () => {
    const handler = nodeHttpClient;

    describe('contract', () => {
        testClientContract(handler);
    })

    /*
        parts that differ between node and fetch client are tested below
     */

    it('GET with uri parts echoed back', async () => {
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
            fragment: "#fragment",
            path: "/path/name",
            query: "?query1=value1&query2=value2"
        });
        await close()
    })

    it('what do headers look like when multiple of the same name', async () => {
        /*
            the strange thing is nodejs treats certain headers differently (:
             - so set-cookie keeps its array structure somewhat
             - but something arbitrary is turned into a joined string
         */
        const {port, close} = await h22pServer({
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return {status: 200, body: JSON.stringify(req.headers), headers: {}}
            }
        });
        const client = handler(`http://localhost:${port}`);
        const res = await client.handle(
            Req.get(`/`, {
                    // @ts-ignore
                    "foo": ["bar, baz, quux"],
                    "set-cookie": ["bar, baz, quux"],
                }
            )
        )
        expect(res.status).eq(200);
        const reqHeadersEchoed = await Body.json(res.body!) as any;
        expect(reqHeadersEchoed["foo"]).deep.eq("bar, baz, quux");
        expect(reqHeadersEchoed["set-cookie"]).deep.eq(["bar, baz, quux"]);
        await close()
    });
})
