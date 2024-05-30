import puppeteer from 'puppeteer';
import {HttpRequest, HttpResponse, httpServer, Res, URI} from "../../src";
import fs from "fs";
import {expect} from "chai";

describe('test app in-browser', function () {
    this.timeout(2_000);

    /*
        This test relies on having run pnpm build to produce the compiled h22p module for the browser;
        which is output to a /bun directory in the h22p package
     */

    it('test some api call in-memory', async function () {
        const {port, close} = await browserTestServer();

        const browser = await puppeteer.launch({headless: true, timeout: 2_000});
        const page = await browser.newPage();

        await page.goto(`http://localhost:${port}/index.html`);
        const out = await page.evaluate(`
            app.handle(
                h22p.Req.get("/resource")
            )
            .then(r => h22p.Body.json(r.body))
            .then(j => j)
        `);

        expect(out).deep.eq({"bar": "json"});

        await close();
        await browser.close();
    })
})

async function browserTestServer() {
    const {server, close, port} = await httpServer({
        async handle(req: HttpRequest): Promise<HttpResponse> {
            const bunDir = './src/packages/h22p/bun';
            const uri = URI.parse(req.uri);
            if (uri.path === '/browser-index.js') {
                const h22pBrowserModule = fs.readFileSync(`${bunDir}/src/browser-index.js`, 'utf-8');
                return Res.ok({
                    body: h22pBrowserModule,
                    headers: {'content-type': 'text/javascript'}
                })
            } else if (uri.path === '/app.js') {
                const testAppModule = fs.readFileSync(`${bunDir}/test/browser/test-app.js`, 'utf-8');
                return Res.ok({
                    body: testAppModule,
                    headers: {'content-type': 'text/javascript'}
                })
            } else {
                return Res.ok({body: html()})
            }
        }
    }, 0, '127.0.0.1');

    function html() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Test h22p in the browser</title>
    <script type="module" src="./browser-index.js"> </script>
    <script type="module" src="./app.js"> </script>
</head>
<body>
</body>
</html>
`;
    }

    return {port, close}
}
