import {Route, Router} from "../../src";

/*
    This is our test app that will be loaded into the browser
    so that we can make http requests in-memory in the browser!
 */

// @ts-ignore
global.app = Router.of({
    getResource: Route.get('/resource', {
        handle: async (req) => {
            return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
        }
    }, {"content-type": "text/csv"} as const)
})