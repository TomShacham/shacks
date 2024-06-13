import {expect} from "chai";
import {Body, h22pServer, HttpHandler, HttpMessageBody, HttpRequest, HttpResponse, Req, URI} from "../h22p";
import * as stream from "stream";
import {it} from "mocha";

export function testClientContract(handler: (baseUrl: string) => HttpHandler) {
    describe('http contract', function () {
        this.timeout(500);

        it('OPTIONS request', async () => {
            const {port, close} = await h22pServer({
                async handle(req: HttpRequest): Promise<HttpResponse> {
                    return {status: 200, body: 'OPTIONS', headers: {"allow": "GET"}}
                }
            });
            const client = handler(`http://localhost:${port}`);
            const res = await client.handle(Req.options(`/`));

            expect(res.status).eq(200);
            expect(await Body.text(res.body!)).eq('OPTIONS');
            expect(res.headers?.allow).eq('GET');
            await close()
        })

        it('HEAD request doesnt send body in response and sets default headers if not set in handler', async () => {
            const {port, close} = await h22pServer({
                async handle(req: HttpRequest): Promise<HttpResponse> {
                    const queryString = URI.parse(req.uri).query ?? '';
                    if (queryString.indexOf('hardCodeResponseHeaders') > -1)
                        return {
                            status: 200,
                            body: 'THIS DOESNT GET SENT',
                            headers: {"content-length": "999", "content-type": "text/foo"}
                        }

                    return {status: 200, body: 'THIS DOES GET SENT', headers: {}}
                }
            });

            const client = handler(``);
            const repsonse = await client.handle(
                Req.head(`http://localhost:${port}/`)
            )
            expect(repsonse.status).eq(200);
            expect(await Body.text(repsonse.body!)).not.eq('THIS DOES GET SENT');
            expect(await Body.text(repsonse.body!)).eq('');
            expect(repsonse.headers["content-type"]).eq('text/plain');
            expect(repsonse.headers?.["content-length"]).eq('18');


            /*
                doesn't override response headers if they are set in the handler
             */
            const repsonseHardCodedHeaders = await client.handle(
                Req.head(`http://localhost:${port}/?hardCodeResponseHeaders=true`)
            )
            expect(repsonseHardCodedHeaders.status).eq(200);
            expect(await Body.text(repsonseHardCodedHeaders.body!)).not.eq('THIS DOESNT GET SENT');
            expect(await Body.text(repsonseHardCodedHeaders.body!)).eq('');
            expect(repsonseHardCodedHeaders.headers["content-type"]).eq('text/foo');
            expect(repsonseHardCodedHeaders.headers?.["content-length"]).eq('999');
            await close()
        })

        it('POST, PUT and PATCH, DELETE with body echoed back', async () => {
            /*
                Interestingly, DELETE needs a content length header or to set transfer-encoding to chunked
                    for node to be happy, even though POST, PUT and PATCH can figure themselves out...
             */

            const {port, close} = await h22pServer({
                async handle(req: HttpRequest): Promise<HttpResponse> {
                    return {status: 200, body: req.body, headers: {method: req.method}}
                }
            });


            const client = handler(`http://localhost:${port}`);
            const bodyString = 'hello, world!';
            const bodyJson = {"hello": "world"};
            const bodyBuffer = Buffer.from(bodyString);

            const postResponseString = await client.handle(Req.post(`/`, bodyString, {}))
            const putResponseString = await client.handle(Req.put(`/`, bodyString, {}))
            const patchResponseString = await client.handle(Req.patch(`/`, bodyString, {}))
            const deleteResponseString = await client.handle(Req.delete(`/`, bodyString, {}))

            await testMethod(postResponseString, 'POST', bodyString);
            await testMethod(putResponseString, 'PUT', bodyString);
            await testMethod(patchResponseString, 'PATCH', bodyString);
            await testMethod(deleteResponseString, 'DELETE', bodyString);

            const postResponseJson = await client.handle(Req.post(`/`, bodyJson, {}))
            const putResponseJson = await client.handle(Req.put(`/`, bodyJson, {}))
            const patchResponseJson = await client.handle(Req.patch(`/`, bodyJson, {}))
            const deleteResponseJson = await client.handle(Req.delete(`/`, bodyJson, {}))

            await testMethod(postResponseJson, 'POST', JSON.stringify(bodyJson));
            await testMethod(putResponseJson, 'PUT', JSON.stringify(bodyJson));
            await testMethod(patchResponseJson, 'PATCH', JSON.stringify(bodyJson));
            await testMethod(deleteResponseJson, 'DELETE', JSON.stringify(bodyJson));


            const postResponseBuffer = await client.handle(Req.post(`/`, bodyBuffer, {}))
            const putResponseBuffer = await client.handle(Req.put(`/`, bodyBuffer, {}))
            const patchResponseBuffer = await client.handle(Req.patch(`/`, bodyBuffer, {}))
            const deleteResponseBuffer = await client.handle(Req.delete(`/`, bodyBuffer, {}))

            await testMethod(postResponseBuffer, 'POST', bodyString);
            await testMethod(putResponseBuffer, 'PUT', bodyString);
            await testMethod(patchResponseBuffer, 'PATCH', bodyString);
            await testMethod(deleteResponseBuffer, 'DELETE', bodyString);

            const postResponseStream = await client.handle(Req.post(`/`, stream.Readable.from(bodyString), {}))
            const putResponseStream = await client.handle(Req.put(`/`, stream.Readable.from(bodyString), {}))
            const patchResponseStream = await client.handle(Req.patch(`/`, stream.Readable.from(bodyString), {}))
            const deleteResponseStream = await client.handle(Req.delete(`/`, stream.Readable.from(bodyString), {}))

            await testMethod(postResponseStream, 'POST', bodyString);
            await testMethod(putResponseStream, 'PUT', bodyString);
            await testMethod(patchResponseStream, 'PATCH', bodyString);
            await testMethod(deleteResponseStream, 'DELETE', bodyString);

            async function testMethod(res: HttpResponse, expectedHeader: string, expectedBody: HttpMessageBody) {
                expect(res.status).eq(200);
                expect(res.headers?.method).eq(expectedHeader);
                expect(await Body.text(res.body!)).deep.eq(expectedBody);
                return res;
            }

            await close()
        })

        it('can send a multipart/form-data request with simple body', async () => {
            const {port, close} = await h22pServer({
                async handle(req: HttpRequest): Promise<HttpResponse> {
                    return {status: 200, body: req.body, headers: {}}
                }
            });

            const client = handler(`http://localhost:${port}`);
            const request = Req.post(`/`, Body.asMultipartForm([{
                headers: [{
                    name: 'content-type',
                    value: 'text/plain'
                }, {
                    name: 'content-disposition',
                    fieldName: 'file',
                }],
                body: 'tom1'
            }], 'custom-boundary'), {});

            const response = await client.handle(request)
            expect(await Body.text(response.body!)).eq(
                ['--custom-boundary',
                    'content-type: text/plain',
                    'content-disposition: form-data; name="file"',
                    '',
                    'tom1',
                    '--custom-boundary--'].join('\r\n'));
            await close()
        })

        it('can send a multipart/form-data request with stream body', async () => {
            const {port, close} = await h22pServer({
                async handle(req: HttpRequest): Promise<HttpResponse> {
                    return {status: 200, body: req.body, headers: {}}
                }
            });

            const client = handler(`http://localhost:${port}`);
            const request = Req.post(`/`, Body.asMultipartForm([{
                headers: [{
                    name: 'content-type',
                    value: 'text/plain'
                }, {
                    name: 'content-disposition',
                    fieldName: 'file',
                }],
                body: stream.Readable.from('tom1')
            }], 'custom-boundary'), {});

            const response = await client.handle(request)
            expect(await Body.text(response.body!)).eq(
                ['--custom-boundary',
                    'content-type: text/plain',
                    'content-disposition: form-data; name="file"',
                    '',
                    'tom1',
                    '--custom-boundary--'].join('\r\n'));
            await close()
        })

        it('can send multiple parts in multipart/form-data request', async () => {
            const {port, close} = await h22pServer({
                async handle(req: HttpRequest): Promise<HttpResponse> {
                    return {status: 200, body: req.body, headers: {}}
                }
            });

            const client = handler(`http://localhost:${port}`);
            const request = Req.post(`/`, Body.asMultipartForm([
                {
                    headers: [{
                        name: 'content-type',
                        value: 'text/plain'
                    }, {
                        name: 'content-disposition',
                        fieldName: 'file',
                    }],
                    body: 'tom1'
                },
                {
                    headers: [{
                        name: 'content-type',
                        value: 'text/plain'
                    }, {
                        name: 'content-disposition',
                        fieldName: 'file',
                        filename: 'foo.png',
                    }],
                    body: stream.Readable.from('tom2'),
                },
                {
                    headers: [{
                        name: 'content-type',
                        value: 'text/plain'
                    }, {
                        name: 'content-transfer-encoding',
                        value: 'base64'
                    }],
                    body: stream.Readable.from(btoa('tom3'),),

                }], 'custom-boundary'), {});

            const response = await client.handle(request)
            expect(await Body.text(response.body!)).eq(
                ['--custom-boundary',
                    'content-type: text/plain',
                    'content-disposition: form-data; name="file"',
                    '',
                    'tom1',
                    '--custom-boundary',
                    'content-type: text/plain',
                    'content-disposition: form-data; name="file"; filename="foo.png"',
                    '',
                    'tom2',
                    '--custom-boundary',
                    'content-type: text/plain',
                    'content-transfer-encoding: base64',
                    '',
                    btoa('tom3'),
                    '--custom-boundary--'].join('\r\n'));
            await close()
        })

        it('gets rid of undefined headers because node http client blows up otherwise', async () => {
            const {port, close} = await h22pServer({
                async handle(req: HttpRequest): Promise<HttpResponse> {
                    return {status: 200, body: 'OPTIONS', headers: {"allow": "GET"}}
                }
            });
            const client = handler(`http://localhost:${port}`);
            // header of foo: undefined
            const res = await client.handle(Req.options(`/`, {foo: undefined}));

            // this will hang if we don't remove the foo: undefined header in node http client
            expect(res.status).eq(200);
            expect(await Body.text(res.body!)).eq('OPTIONS');
            expect(res.headers?.allow).eq('GET');
            await close()
        })
    })
}

