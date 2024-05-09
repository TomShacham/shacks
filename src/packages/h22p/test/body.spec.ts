import * as stream from "stream";
import {expect} from "chai";
import {Body, MultipartForm} from "../src/body";
import * as fs from "fs";
import {h22p, Status} from "../src/interface";

describe('body', () => {

    describe('Body.json', () => {
        it('throws if json parsing fails', async () => {
            try {
                await Body.json('{malformed')
            } catch (e) {
                expect((e as Error).message).eq(`Expected property name or '}' in JSON at position 1`)
            }
        })
    })

    describe('response helpers', () => {
        it('doesnt let you set the status, or statusText; redirects have to provide a location', () => {
            // cannot pass status or statusText in as a property
            expect(h22p.ok().status).eq(200);
            expect(h22p.ok().statusText).eq('OK');

            expect(h22p.created().status).eq(201);
            expect(h22p.created().statusText).eq('Created');

            expect(h22p.noContent().status).eq(204);
            expect(h22p.noContent().statusText).eq('No Content');

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

    describe('multipart form', () => {
        /*
        *  the standard line end for headers and boundaries etc is CRLF (/r/n)
        *  but we provide a test handling just LF (\n) as well as some systems
        *  supposedly don't send the Carriage Return (\r) as well as the Line Feed (\n)
        * */

        it('a file by itself', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';
            const wireData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="file"; filename="test.txt"',
                'Content-Type: text/plain',
                '', // headers end
                'Test file contents',
                `--${boundary}--`,
                '' // body end
            ].join('\r\n')

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await MultipartForm.multipartFormField(req);

            expect(headers).deep.eq([
                    {
                        "filename": "test.txt",
                        "fieldName": "file",
                        "name": "content-disposition"
                    },
                    {
                        "name": "content-type",
                        "value": "text/plain"
                    }
                ]
            )

            const text = await Body.text(body);
            expect(text).deep.eq('Test file contents');
        })

        it('a text input by itself', async () => {
            const boundary = '------WebKitFormBoundaryS7EqcIpCaxXELv6B';
            const wireData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="name"',
                '', // headers end
                'Test file contents',
                `--${boundary}--`,
                '' // body end
            ].join('\r\n')

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await MultipartForm.multipartFormField(req);

            expect(headers).deep.eq([
                    {
                        "name": "content-disposition",
                        "fieldName": "name"
                    }
                ]
            );
            expect(await Body.text(body)).eq('Test file contents')
        })

        it('multiple text inputs and multiple files', async () => {
            const boundary = '------WebKitFormBoundaryZnZz58ycjFeBNyad';
            const wireData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="name"',
                '', // headers end
                'tom',
                `--${boundary}`,
                'Content-Disposition: form-data; name="file"; filename="test.txt"',
                'Content-Type: text/plain',
                '', // headers end
                'Test file contents\n',
                `--${boundary}`,
                'Content-Disposition: form-data; name="title"',
                '', // headers end
                'title',
                `--${boundary}`,
                'Content-Disposition: form-data; name="bio"; filename="test.txt"',
                'Content-Type: text/plain',
                '', // headers end
                'Test file contents\n',
                `--${boundary}--`,
                '' // body end
            ].join('\r\n')

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers: headers1, body: body1} = await MultipartForm.multipartFormField(req);

            expect(headers1).deep.eq([
                    {
                        "fieldName": "name",
                        "name": "content-disposition"
                    }
                ]
            )
            expect(await Body.text(body1)).eq('tom')

            const {headers: headers2, body: body2} = await MultipartForm.multipartFormField(req);
            expect(headers2).deep.eq([
                    {
                        "filename": "test.txt",
                        "fieldName": "file",
                        "name": "content-disposition"
                    },
                    {
                        "name": "content-type",
                        "value": "text/plain"
                    }
                ]
            )
            expect(await Body.text(body2)).eq('Test file contents\n')

            const {headers: headers3, body: body3} = await MultipartForm.multipartFormField(req)

            expect(headers3).deep.eq([
                    {
                        "fieldName": "title",
                        "name": "content-disposition"
                    }
                ]
            )
            expect(await Body.text(body3)).eq('title')

            const {headers: headers4, body: body4} = await MultipartForm.multipartFormField(req);
            expect(headers4).deep.eq([
                    {
                        "fieldName": "bio",
                        "filename": "test.txt",
                        "name": "content-disposition"
                    },
                    {
                        "name": "content-type",
                        "value": "text/plain"
                    }
                ]
            )
            expect(await Body.text(body4)).eq('Test file contents\n');
        })

        it('a text input and a file but with LF only (no CR)', async () => {
            const boundary = '------WebKitFormBoundary3SDTCgyIZiMSWJG7';
            const wireData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="name"',
                '', // headers end
                'tom',
                `--${boundary}`,
                'Content-Disposition: form-data; name="file"; filename="test.txt"',
                'Content-Type: text/plain',
                '', // headers end
                'Test file contents',
                `--${boundary}--`,
                '' // body end
            ].join('\n') // <---------- just using LF

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const formParts = await MultipartForm.multipartFormField(req);
            const {headers: headers1, body: body1} = formParts;

            expect(headers1).deep.eq([
                    {
                        "fieldName": "name",
                        "name": "content-disposition"
                    }
                ]
            )
            expect(await Body.text(body1)).eq('tom')

            const {headers: headers2, body: body2} = await MultipartForm.multipartFormField(req);
            expect(headers2).deep.eq([
                    {
                        "filename": "test.txt",
                        "fieldName": "file",
                        "name": "content-disposition"
                    },
                    {
                        "name": "content-type",
                        "value": "text/plain"
                    }
                ]
            )

            expect(await Body.text(body2)).eq('Test file contents')
        })

        it('a file by itself with dashes in it (we use dashes to determine boundary checking)', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';
            const wireData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="file"; filename="test.txt"',
                'Content-Type: text/plain',
                '', // headers end
                'Test-- file-- contents',
                `--${boundary}--`,
                '' // body end
            ].join('\r\n')

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await MultipartForm.multipartFormField(req);

            expect(headers).deep.eq([
                    {
                        "filename": "test.txt",
                        "fieldName": "file",
                        "name": "content-disposition"
                    },
                    {
                        "name": "content-type",
                        "value": "text/plain"
                    }
                ]
            )

            const text = await Body.text(body);
            expect(text).deep.eq('Test-- file-- contents');
        })

        it('destroy stream on error and body text doesnt explode', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';
            const wireData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="file"; filename="test.txt"',
                'Content-Type: text/plain',
                '', // headers end
                'Test file contents',
                `--${boundary}--`,
                '' // body end
            ].join('\r\n')

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await MultipartForm.multipartFormField(req);

            // stream isn't aborted at first
            expect(body.readableAborted).eq(false);
            // emit error so that stream aborts
            body.emit('error', new Error('test error'));
            // reading body shouldn't throw, just returns empty string
            const text = await Body.text(body);
            expect(body.readableAborted).eq(true);
            expect(text).eq('');
        })

        it('handles mixed mime types like text and a png', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';
            const preFile = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="name"',
                '', // headers end
                'tom',
                `--${boundary}`,
                'Content-Disposition: form-data; name="file"; filename="test.txt"',
                'Content-Type: image/png',
                '', // headers end
                '', // headers end
            ].join('\r\n')

            const postFile = `\r
--${boundary}--\r
`
            const inputStream = Buffer.concat([
                Buffer.from(preFile, 'binary'),
                fs.readFileSync(`${__dirname}/resources/hamburger.png`),
                Buffer.from(postFile, 'binary')])

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(inputStream),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await MultipartForm.multipartFormField(req);
            expect(headers).deep.eq([
                {
                    "fieldName": "name",
                    "name": "content-disposition"
                }
            ])
            expect(await Body.text(body)).deep.eq('tom')

            const {headers: headers1, body: body1} = await MultipartForm.multipartFormField(req);
            body1.pipe(fs.createWriteStream(`${__dirname}/resources/hamburger-out.png`));
        })

        it('parses content-transfer-encoding', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';
            const wireData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="file"; filename="test.txt"',
                'Content-Type: text/plain',
                'Content-Transfer-Encoding: base64',
                '', // headers end
                'Test file contents',
                `--${boundary}--`,
                '' // body end
            ].join('\r\n')

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await MultipartForm.multipartFormField(req);

            expect(headers).deep.eq([
                    {
                        "filename": "test.txt",
                        "fieldName": "file",
                        "name": "content-disposition"
                    },
                    {
                        "name": "content-type",
                        "value": "text/plain"
                    },
                    {
                        "name": "content-transfer-encoding",
                        "value": "base64"
                    }
                ]
            )
        })

        it('can provide a max headers to protect against DOS', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';
            const wireData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="file"; filename="test.txt"',
                'Content-Type: text/plain',
                'Content-Transfer-Encoding: base64',
                '', // headers end
                'Test file contents',
                `--${boundary}--`,
                '' // body end
            ].join('\r\n')

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })


            try {
                await MultipartForm.multipartFormField(req, {maxHeadersSizeBytes: 10});
            } catch (e) {
                expect((e as Error).message).eq('Max header size of 10 bytes exceeded')
            }
        })

        it('get interesting headers', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';
            const wireData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="file"; filename="test.txt"',
                'Content-Type: text/plain',
                'Content-Transfer-Encoding: base64',
                '', // headers end
                'Test file contents',
                `--${boundary}--`,
                '' // body end
            ].join('\r\n')

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })

            const {headers,} = await MultipartForm.multipartFormField(req);
            const contentEncoding = MultipartForm.contentEncoding(headers);
            const fieldName = MultipartForm.fieldName(headers);
            const fileName = MultipartForm.fileName(headers);

            expect(contentEncoding).eq('base64')
            expect(fieldName).eq('file')
            expect(fileName).eq('test.txt')
        });

        it('if headers does not end with \\r\\n\\r\\n then throw', async () => {
            const boundary = '------WebKitFormBoundaryS7EqcIpCaxXELv6B';
            const wireData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="name"',
                // no headers end
                'Test file contents',
                `--${boundary}--`,
                '' // body end
            ].join('\r\n')

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })

            try {
                const {headers, body} = await MultipartForm.multipartFormField(req);
            } catch (e) {
                expect((e as Error).message).eq('Malformed headers, did not parse an ending')
            }
        })
    })
})

