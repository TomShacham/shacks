import {h22p} from "../src";
import {expect} from "chai";

describe('response', () => {

    describe('helper methods', () => {
        it('doesnt let you set the status, or statusText; redirects have to provide a location', () => {
            // cannot pass status or statusText in as a property
            expect(h22p.ok().status).eq(200);
            expect(h22p.ok().statusText).eq('OK');

            expect(h22p.created().status).eq(201);
            expect(h22p.created().statusText).eq('Created');

            expect(h22p.noContent().status).eq(204);
            expect(h22p.noContent().statusText).eq('No Content');

            expect(h22p.badRequest().status).eq(400);
            expect(h22p.badRequest().statusText).eq('Bad Request');

            expect(h22p.unauthorized().status).eq(401);
            expect(h22p.unauthorized().statusText).eq('Unauthorized');

            expect(h22p.forbidden().status).eq(403);
            expect(h22p.forbidden().statusText).eq('Forbidden');

            expect(h22p.notFound().status).eq(404);
            expect(h22p.notFound().statusText).eq('Not Found');

            expect(h22p.methodNotAllowed().status).eq(405);
            expect(h22p.methodNotAllowed().statusText).eq('Method Not Allowed');

            expect(h22p.internalServerError().status).eq(500);
            expect(h22p.internalServerError().statusText).eq('Internal Server Error');

            expect(h22p.badGateway().status).eq(502);
            expect(h22p.badGateway().statusText).eq('Bad Gateway');

            expect(h22p.serviceUnavailable().status).eq(503);
            expect(h22p.serviceUnavailable().statusText).eq('Service Unavailable');

            expect(h22p.gatewayTimeout().status).eq(504);
            expect(h22p.gatewayTimeout().statusText).eq('Gateway Timeout');

        })

        it('redirects have to provide a location', () => {
            const movedPermanently = h22p.movedPermanently({
                headers: {
                    "location": "must-provide",
                    "content-type": "text/plain"
                }
            });
            expect(movedPermanently.status).eq(301);
            expect(movedPermanently.statusText).eq('Moved Permanently');
            expect(movedPermanently.headers).deep.eq({
                "content-type": "text/plain",
                "location": "must-provide"
            })

            const found = h22p.found({headers: {"location": "must-provide", "content-type": "text/plain"}});
            expect(found.status).eq(302);
            expect(found.statusText).eq('Found');
            expect(found.headers).deep.eq({
                "content-type": "text/plain",
                "location": "must-provide"
            })

            const seeOther = h22p.seeOther({headers: {"location": "must-provide", "content-type": "text/plain"}});
            expect(seeOther.status).eq(303);
            expect(seeOther.statusText).eq('See Other');
            expect(seeOther.headers).deep.eq({
                "content-type": "text/plain",
                "location": "must-provide"
            });

            const temporaryRedirect = h22p.temporaryRedirect({
                headers: {
                    "location": "must-provide",
                    "content-type": "text/plain"
                }
            });
            expect(temporaryRedirect.status).eq(307);
            expect(temporaryRedirect.statusText).eq('Temporary Redirect');
            expect(temporaryRedirect.headers).deep.eq({
                "content-type": "text/plain",
                "location": "must-provide"
            });

            const permanentRedirect = h22p.permanentRedirect({
                headers: {
                    "location": "must-provide",
                    "content-type": "text/plain"
                }
            });
            expect(permanentRedirect.status).eq(308);
            expect(permanentRedirect.statusText).eq('Permanent Redirect');
            expect(permanentRedirect.headers).deep.eq({
                "content-type": "text/plain",
                "location": "must-provide"
            });
        })

        it('status enum', () => {
            expect(h22p.Status.continue).eq(100);
            expect(h22p.Status.switchingProtocols).eq(101);
            expect(h22p.Status.processing).eq(102);
            expect(h22p.Status.earlyHints).eq(103);
            expect(h22p.Status.ok).eq(200);
            expect(h22p.Status.created).eq(201);
            expect(h22p.Status.accepted).eq(202);
            expect(h22p.Status.nonAuthoritativeInformation).eq(203);
            expect(h22p.Status.noContent).eq(204);
            expect(h22p.Status.resetContent).eq(205);
            expect(h22p.Status.partialContent).eq(206);
            expect(h22p.Status.multiStatus).eq(207);
            expect(h22p.Status.alreadyReported).eq(208);
            expect(h22p.Status.imUsed).eq(226);
            expect(h22p.Status.multipleChoices).eq(300);
            expect(h22p.Status.movedPermanently).eq(301);
            expect(h22p.Status.found).eq(302);
            expect(h22p.Status.seeOther).eq(303);
            expect(h22p.Status.notModified).eq(304);
            expect(h22p.Status.useProxy).eq(305);
            expect(h22p.Status.temporaryRedirect).eq(307);
            expect(h22p.Status.permanentRedirect).eq(308);
            expect(h22p.Status.badRequest).eq(400);
            expect(h22p.Status.unauthorized).eq(401);
            expect(h22p.Status.paymentRequired).eq(402);
            expect(h22p.Status.forbidden).eq(403);
            expect(h22p.Status.notFound).eq(404);
            expect(h22p.Status.methodNotAllowed).eq(405);
            expect(h22p.Status.notAcceptable).eq(406);
            expect(h22p.Status.proxyAuthenticationRequired).eq(407);
            expect(h22p.Status.requestTimeout).eq(408);
            expect(h22p.Status.conflict).eq(409);
            expect(h22p.Status.gone).eq(410);
            expect(h22p.Status.lengthRequired).eq(411);
            expect(h22p.Status.preconditionFailed).eq(412);
            expect(h22p.Status.payloadTooLarge).eq(413);
            expect(h22p.Status.uriTooLong).eq(414);
            expect(h22p.Status.unsupportedMediaType).eq(415);
            expect(h22p.Status.rangeNotSatisfiable).eq(416);
            expect(h22p.Status.expectationFailed).eq(417);
            expect(h22p.Status.imATeapot).eq(419);
            expect(h22p.Status.misdirectedRequest).eq(421);
            expect(h22p.Status.unprocessableEntity).eq(422);
            expect(h22p.Status.locked).eq(423);
            expect(h22p.Status.failedDependency).eq(424);
            expect(h22p.Status.tooEarly).eq(425);
            expect(h22p.Status.upgradeRequired).eq(426);
            expect(h22p.Status.preconditionRequired).eq(428);
            expect(h22p.Status.tooManyRequests).eq(429);
            expect(h22p.Status.requestHeaderFieldsTooLarge).eq(431);
            expect(h22p.Status.unavailableForLegalReasons).eq(451);
            expect(h22p.Status.internalServerError).eq(500);
            expect(h22p.Status.notImplemented).eq(501);
            expect(h22p.Status.badGateway).eq(502);
            expect(h22p.Status.serviceUnavailable).eq(503);
            expect(h22p.Status.gatewayTimeout).eq(504);
            expect(h22p.Status.httpVersionNotSupported).eq(505);
            expect(h22p.Status.variantAlsoNegotiates).eq(506);
            expect(h22p.Status.insufficientStorage).eq(507);
            expect(h22p.Status.loopDetected).eq(508);
            expect(h22p.Status.notExtended).eq(510);
            expect(h22p.Status.networkAuthenticationRequired).eq(511);
        })
    })

})