import {RedirectToHttps} from "../../src/handlers/redirectToHttps";
import {Req, Res} from "@shacks/h22p";
import {expect} from "chai";
import {describe, it} from "mocha"
import {Route, Router} from "@shacks/h22p-router";

describe('redirect to https', () => {
    it('redirects http traffic to https', async () => {
        const router = Router.of({
            getRoot: Route.get('/', async () => Res.ok({body: 'hello, world'}))
        });
        const redirectToHttpsHandler = new RedirectToHttps(router, () => true);
        const response = await redirectToHttpsHandler.handle(
            Req.get('http://localhost/', {host: "localhost"})
        );
        // note https not http
        const expectedLocation = "https://localhost/";
        expect(response).deep.eq(
            Res.movedPermanently({headers: {location: expectedLocation}, body: expectedLocation})
        )
    })
})