import {Status} from "../src";
import {expect} from "chai";
import {Res} from "../src/response";

describe('response', () => {

    describe('helper methods', () => {
        it('doesnt let you set the status, or statusText; redirects have to provide a location', () => {
            // cannot pass status or statusText in as a property
            expect(Res.ok().status).eq(200);
            expect(Res.ok().statusText).eq('OK');

            expect(Res.created().status).eq(201);
            expect(Res.created().statusText).eq('Created');

            expect(Res.noContent().status).eq(204);
            expect(Res.noContent().statusText).eq('No Content');

            expect(Res.badRequest().status).eq(400);
            expect(Res.badRequest().statusText).eq('Bad Request');

            expect(Res.unauthorized().status).eq(401);
            expect(Res.unauthorized().statusText).eq('Unauthorized');

            expect(Res.forbidden().status).eq(403);
            expect(Res.forbidden().statusText).eq('Forbidden');

            expect(Res.notFound().status).eq(404);
            expect(Res.notFound().statusText).eq('Not Found');

            expect(Res.methodNotAllowed().status).eq(405);
            expect(Res.methodNotAllowed().statusText).eq('Method Not Allowed');

            expect(Res.internalServerError().status).eq(500);
            expect(Res.internalServerError().statusText).eq('Internal Server Error');

            expect(Res.badGateway().status).eq(502);
            expect(Res.badGateway().statusText).eq('Bad Gateway');

            expect(Res.serviceUnavailable().status).eq(503);
            expect(Res.serviceUnavailable().statusText).eq('Service Unavailable');

            expect(Res.gatewayTimeout().status).eq(504);
            expect(Res.gatewayTimeout().statusText).eq('Gateway Timeout');

        })

        it('redirects have to provide a location', () => {
            const movedPermanently = Res.movedPermanently({
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

            const found = Res.found({headers: {"location": "must-provide", "content-type": "text/plain"}});
            expect(found.status).eq(302);
            expect(found.statusText).eq('Found');
            expect(found.headers).deep.eq({
                "content-type": "text/plain",
                "location": "must-provide"
            })

            const seeOther = Res.seeOther({headers: {"location": "must-provide", "content-type": "text/plain"}});
            expect(seeOther.status).eq(303);
            expect(seeOther.statusText).eq('See Other');
            expect(seeOther.headers).deep.eq({
                "content-type": "text/plain",
                "location": "must-provide"
            });

            const temporaryRedirect = Res.temporaryRedirect({
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

            const permanentRedirect = Res.permanentRedirect({
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
            expect(Status.continue).eq(100);
            expect(Status.switchingProtocols).eq(101);
            expect(Status.processing).eq(102);
            expect(Status.earlyHints).eq(103);
            expect(Status.ok).eq(200);
            expect(Status.created).eq(201);
            expect(Status.accepted).eq(202);
            expect(Status.nonAuthoritativeInformation).eq(203);
            expect(Status.noContent).eq(204);
            expect(Status.resetContent).eq(205);
            expect(Status.partialContent).eq(206);
            expect(Status.multiStatus).eq(207);
            expect(Status.alreadyReported).eq(208);
            expect(Status.imUsed).eq(226);
            expect(Status.multipleChoices).eq(300);
            expect(Status.movedPermanently).eq(301);
            expect(Status.found).eq(302);
            expect(Status.seeOther).eq(303);
            expect(Status.notModified).eq(304);
            expect(Status.useProxy).eq(305);
            expect(Status.temporaryRedirect).eq(307);
            expect(Status.permanentRedirect).eq(308);
            expect(Status.badRequest).eq(400);
            expect(Status.unauthorized).eq(401);
            expect(Status.paymentRequired).eq(402);
            expect(Status.forbidden).eq(403);
            expect(Status.notFound).eq(404);
            expect(Status.methodNotAllowed).eq(405);
            expect(Status.notAcceptable).eq(406);
            expect(Status.proxyAuthenticationRequired).eq(407);
            expect(Status.requestTimeout).eq(408);
            expect(Status.conflict).eq(409);
            expect(Status.gone).eq(410);
            expect(Status.lengthRequired).eq(411);
            expect(Status.preconditionFailed).eq(412);
            expect(Status.payloadTooLarge).eq(413);
            expect(Status.uriTooLong).eq(414);
            expect(Status.unsupportedMediaType).eq(415);
            expect(Status.rangeNotSatisfiable).eq(416);
            expect(Status.expectationFailed).eq(417);
            expect(Status.imATeapot).eq(419);
            expect(Status.misdirectedRequest).eq(421);
            expect(Status.unprocessableEntity).eq(422);
            expect(Status.locked).eq(423);
            expect(Status.failedDependency).eq(424);
            expect(Status.tooEarly).eq(425);
            expect(Status.upgradeRequired).eq(426);
            expect(Status.preconditionRequired).eq(428);
            expect(Status.tooManyRequests).eq(429);
            expect(Status.requestHeaderFieldsTooLarge).eq(431);
            expect(Status.unavailableForLegalReasons).eq(451);
            expect(Status.internalServerError).eq(500);
            expect(Status.notImplemented).eq(501);
            expect(Status.badGateway).eq(502);
            expect(Status.serviceUnavailable).eq(503);
            expect(Status.gatewayTimeout).eq(504);
            expect(Status.httpVersionNotSupported).eq(505);
            expect(Status.variantAlsoNegotiates).eq(506);
            expect(Status.insufficientStorage).eq(507);
            expect(Status.loopDetected).eq(508);
            expect(Status.notExtended).eq(510);
            expect(Status.networkAuthenticationRequired).eq(511);
        })
    })

})