import {Route, Router} from "../../h22p-router"
import * as h22p from "../../h22p"
import {FetchClient} from "../../h22p-fetch";
/*
    This is our test app that will be loaded into the browser
    so that we can make http requests in-memory in the browser!
 */

// global.h22p or .app is not a thing so ts whines
// @ts-ignore
global.h22p = h22p;
// @ts-ignore
global.h22p.FetchClient = FetchClient
// @ts-ignore
global.app = Router.of({
    getResource: Route.get('/resource', async (req) => {
        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
    }, {"content-type": "text/csv"} as const)
})