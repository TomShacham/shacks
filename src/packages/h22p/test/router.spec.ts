import {router} from "../src";

describe('router', () => {



    //
    // it('wildcard with path params and query params', async () => {
    //     const router = new Router([
    //         read()('GET', "*/resource/{id}/sub/{subId}/*?q1&q2", async (req) => {
    //             const pathParams = req.vars.path;
    //             const queryParams = req.vars.query;
    //             const wilcards = req.vars.wildcards.join(' ');
    //             return h22p.response({
    //                 status: 200,
    //                 body: `Hello ${wilcards} ${pathParams.id} ${pathParams.subId} ${queryParams.q1} ${queryParams.q2}`
    //             })
    //         })
    //     ]);
    //     const res = await router.handle(h22p.get('bingo/bongo/resource/123/sub/456/hanky/panky?q1=v1&q2=v2'))
    //     expect(res.status).eq(200);
    //     expect(await Body.text(res.body)).eq('Hello bingo/bongo hanky/panky 123 456 v1 v2');
    // })
    //
    // it('matches if a fragment is expected but not provided', async () => {
    //     const router = new Router([
    //         read()('GET', "*/resource/{id}/sub/{subId}/*?q1&q2#fragment", async (req) => {
    //             const pathParams = req.vars.path;
    //             const queryParams = req.vars.query;
    //             const wildcards = req.vars.wildcards.join(' ');
    //             const fragment = req.vars.fragment
    //             return h22p.response({
    //                 status: 200,
    //                 body: `Hello ${wildcards} ${pathParams.id} ${pathParams.subId} ${queryParams.q1} ${queryParams.q2}`
    //             })
    //         })
    //     ]);
    //     const res = await router.handle(h22p.get('bingo/bongo/resource/123/sub/456/hanky/panky?q1=v1&q2=v2'))
    //     expect(res.status).eq(200);
    //     expect(await Body.text(res.body)).eq('Hello bingo/bongo hanky/panky 123 456 v1 v2');
    // })
    //
    // it('wildcard with path params and query params and fragment', async () => {
    //     const router = new Router([
    //         read()('GET', "*/resource/{id}/sub/{subId}/*?q1&q2", async (req) => {
    //             const pathParams = req.vars.path;
    //             const queryParams = req.vars.query;
    //             const wildcards = req.vars.wildcards.join(' ');
    //             const fragment = req.vars.fragment
    //             return h22p.response({
    //                 status: 200,
    //                 body: `Hello ${wildcards} ${pathParams.id} ${pathParams.subId} ${queryParams.q1} ${queryParams.q2} ${fragment}`
    //             })
    //         })
    //     ]);
    //     const res = await router.handle(h22p.get('bingo/bongo/resource/123/sub/456/hanky/panky?q1=v1&q2=v2#frag'))
    //     expect(res.status).eq(200);
    //     expect(await Body.text(res.body)).eq('Hello bingo/bongo hanky/panky 123 456 v1 v2 frag');
    // })
    //
    // it('query params dont have to be there for the route to match', async () => {
    //     const router = new Router([
    //         read()('GET', "*/resource/{id}/sub/{subId}/*?q1&q2", async (req) => {
    //             const pathParams = req.vars.path;
    //             const queryParams = req.vars.query;
    //             const wilcards = req.vars.wildcards.join(' ');
    //             return h22p.response({
    //                 status: 200,
    //                 body: `Hello ${wilcards} ${pathParams.id} ${pathParams.subId} ${queryParams.q1} ${queryParams.q2}`
    //             })
    //         })
    //     ]);
    //     const res = await router.handle(h22p.get('bingo/bongo/resource/123/sub/456/hanky/panky?q1=v1'))
    //     expect(res.status).eq(200);
    //     expect(await Body.text(res.body)).eq('Hello bingo/bongo hanky/panky 123 456 v1 undefined');
    // })
    //
    // it('trailing slash in route path is ignored', async () => {
    //     const router = new Router([
    //         read()('GET', "/resource/{id}/", async (req) => {
    //             const params = req.vars.path;
    //             return h22p.response({status: 200, body: `Hello ${params.id}`})
    //         })
    //     ]);
    //     const res = await router.handle(h22p.get('/resource/123'))
    //     expect(res.status).eq(200);
    //     expect(await Body.text(res.body)).eq('Hello 123');
    // })
    //
    // it('trailing slash in req path is ignored', async () => {
    //     const router = new Router([
    //         read()('GET', "/resource/{id}", async (req) => {
    //             const params = req.vars.path;
    //             return h22p.response({status: 200, body: `Hello ${params.id}`})
    //         })
    //     ]);
    //     const res = await router.handle(h22p.get('/resource/123/'))
    //     expect(res.status).eq(200);
    //     expect(await Body.text(res.body)).eq('Hello 123');
    // })
    //
    // it('routing precedence - matches first route that matches', async () => {
    //     // Object.values does not guarantee ordering, but generally it is ordered (by implementations)
    //     const routes = router({
    //         foo:
    //             read()('GET', "/resource/{id}", async (req) => {
    //                 const params = req.vars.path;
    //                 return h22p.response({status: 200, body: `Hello ${params.id}`})
    //             }),
    //         bar: read()('GET', "/resource/{id}", async (req) => {
    //             const params = req.vars.path;
    //             return h22p.response({status: 200, body: `Hello 456`})
    //         })
    //     });
    //     const res = await routes.handle(h22p.get('/resource/123/'))
    //     expect(res.status).eq(200);
    //     // we do not get Hello 456
    //     expect(await Body.text(res.body)).eq('Hello 123');
    // })
    //
    // it('combining routes - precedence is in the order you pass them in', async () => {
    //     // Object.values does not guarantee ordering, but generally it is ordered (by implementations)
    //     const barRoute = {
    //         bar: read()('GET', "/resource/{id}", async (req) => {
    //             const params = req.vars.path;
    //             return h22p.response({status: 200, body: `Hello 456`})
    //         })
    //     };
    //     const fooRoute = {
    //         foo:
    //             read()('GET', "/resource/{id}", async (req) => {
    //                 const params = req.vars.path;
    //                 return h22p.response({status: 200, body: `Hello ${params.id}`})
    //             }),
    //     };
    //     const routes = router({...barRoute, ...fooRoute});
    //     const res = await routes.handle(h22p.get('/resource/123/'))
    //     expect(res.status).eq(200);
    //     expect(await Body.text(res.body)).eq('Hello 456');
    // })
})
