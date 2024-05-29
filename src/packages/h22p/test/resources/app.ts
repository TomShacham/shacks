import {Route, Router} from "../../src";


// @ts-ignore
global.app = Router.of({
    getResource: Route.get('/resource', {
        handle: async (req) => {
            return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
        }
    }, {"content-type": "text/csv"} as const)
})