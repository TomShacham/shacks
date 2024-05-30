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
            expect(Status.CONTINUE).eq(100);
            expect(Status.SWITCHING_PROTOCOLS).eq(101);
            expect(Status.PROCESSING).eq(102);
            expect(Status.EARLY_HINTS).eq(103);
            expect(Status.OK).eq(200);
            expect(Status.CREATED).eq(201);
            expect(Status.ACCEPTED).eq(202);
            expect(Status.NON_AUTHORITATIVE_INFORMATION).eq(203);
            expect(Status.NO_CONTENT).eq(204);
            expect(Status.RESET_CONTENT).eq(205);
            expect(Status.PARTIAL_CONTENT).eq(206);
            expect(Status.MULTI_STATUS).eq(207);
            expect(Status.ALREADY_REPORTED).eq(208);
            expect(Status.IM_USED).eq(226);
            expect(Status.MULTIPLE_CHOICES).eq(300);
            expect(Status.MOVED_PERMANENTLY).eq(301);
            expect(Status.FOUND).eq(302);
            expect(Status.SEE_OTHER).eq(303);
            expect(Status.NOT_MODIFIED).eq(304);
            expect(Status.USE_PROXY).eq(305);
            expect(Status.TEMPORARY_REDIRECT).eq(307);
            expect(Status.PERMANENT_REDIRECT).eq(308);
            expect(Status.BAD_REQUEST).eq(400);
            expect(Status.UNAUTHORIZED).eq(401);
            expect(Status.PAYMENT_REQUIRED).eq(402);
            expect(Status.FORBIDDEN).eq(403);
            expect(Status.NOT_FOUND).eq(404);
            expect(Status.METHOD_NOT_ALLOWED).eq(405);
            expect(Status.NOT_ACCEPTABLE).eq(406);
            expect(Status.PROXY_AUTHENTICATION_REQUIRED).eq(407);
            expect(Status.REQUEST_TIMEOUT).eq(408);
            expect(Status.CONFLICT).eq(409);
            expect(Status.GONE).eq(410);
            expect(Status.LENGTH_REQUIRED).eq(411);
            expect(Status.PRECONDITION_FAILED).eq(412);
            expect(Status.PAYLOAD_TOO_LARGE).eq(413);
            expect(Status.URI_TOO_LONG).eq(414);
            expect(Status.UNSUPPORTED_MEDIA_TYPE).eq(415);
            expect(Status.RANGE_NOT_SATISFIABLE).eq(416);
            expect(Status.EXPECTATION_FAILED).eq(417);
            expect(Status.IM_A_TEAPOT).eq(419);
            expect(Status.MISDIRECTED_REQUEST).eq(421);
            expect(Status.UNPROCESSABLE_ENTITY).eq(422);
            expect(Status.LOCKED).eq(423);
            expect(Status.FAILED_DEPENDENCY).eq(424);
            expect(Status.TOO_EARLY).eq(425);
            expect(Status.UPGRADE_REQUIRED).eq(426);
            expect(Status.PRECONDITION_REQUIRED).eq(428);
            expect(Status.TOO_MANY_REQUESTS).eq(429);
            expect(Status.REQUEST_HEADER_FIELDS_TOO_LARGE).eq(431);
            expect(Status.UNAVAILABLE_FOR_LEGAL_REASONS).eq(451);
            expect(Status.INTERNAL_SERVER_ERROR).eq(500);
            expect(Status.NOT_IMPLEMENTED).eq(501);
            expect(Status.BAD_GATEWAY).eq(502);
            expect(Status.SERVICE_UNAVAILABLE).eq(503);
            expect(Status.GATEWAY_TIMEOUT).eq(504);
            expect(Status.HTTP_VERSION_NOT_SUPPORTED).eq(505);
            expect(Status.VARIANT_ALSO_NEGOTIATES).eq(506);
            expect(Status.INSUFFICIENT_STORAGE).eq(507);
            expect(Status.LOOP_DETECTED).eq(508);
            expect(Status.NOT_EXTENDED).eq(510);
            expect(Status.NETWORK_AUTHENTICATION_REQUIRED).eq(511);
        })
    })

})