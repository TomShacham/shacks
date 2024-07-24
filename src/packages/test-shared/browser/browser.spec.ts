import puppeteer from 'puppeteer';
import {expect} from "chai";
import {browserTestServer} from "./browserTestServer";
import util from "node:util";
import {exec} from "node:child_process";

const execP = util.promisify(exec);

describe('test app in-browser', function () {
    this.timeout(5_000);

    /*
        This test relies on having run pnpm build to produce the compiled h22p module for the browser;
        which is output to a /bun directory in the h22p package
     */

    it('api call in-memory', async function () {
        const compile = await execP(`bun run ${__dirname}/build.ts`);
        const {port, close} = await browserTestServer(0);

        const browser = await puppeteer.launch({headless: true, timeout: 5_000});
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

    it('api call using fetch', async function () {
        const compile = await execP(`bun run ${__dirname}/build.ts`);
        const {port, close} = await browserTestServer(0);

        const browser = await puppeteer.launch({headless: true, timeout: 5_000});
        const page = await browser.newPage();

        await page.goto(`http://localhost:${port}/index.html`);
        const out = await page.evaluate(`
            new h22p.FetchClient('http://localhost:${port}').handle(
                h22p.Req.get("/data")
            )
            .then(r => h22p.Body.json(r.body))
            .then(j => j)
        `);

        expect(out).deep.eq({some: "data"});

        await close();
        await browser.close();
    })
})

