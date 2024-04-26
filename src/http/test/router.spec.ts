import {expect} from "chai";
import {H22P} from "../src/interface";
import {route, Router} from "../src/router";

describe('router', () => {
    it('not found default', async () => {
        const router = new Router([
            route("GET", "/", async (req) => {
                return H22P.response({status: 200, body: `Hello`})
            })]);
        const res = await router.handle(H22P.request({method: 'GET', path: '/not/found'}))
        expect(res.status).eq(404);
        expect(res.body).eq('Not found');
    })

    it('simple route', async () => {
        const router = new Router([
            route("GET", "/", async (req) => {
                return H22P.response({status: 200, body: `Hello`})
            })]);
        const res = await router.handle(H22P.request({method: 'GET', path: '/'}))
        expect(res.status).eq(200);
        expect(res.body).eq('Hello');
    })

    it('path param', async () => {
        const router = new Router([
            route('GET', "/resource/{id}/sub/{foo}", async (req) => {
                const params = req.vars.path;
                return H22P.response({status: 200, body: `Hello ${params.id}`})
            })
        ]);
        const res = await router.handle(H22P.get('/resource/123/sub/456'))
        expect(res.status).eq(200);
        expect(res.body).eq('Hello 123');
    })
})