import {expect} from "chai";
import {H22P, HttpRequest, HttpResponse, Payload} from "../src/interface";
import {URI} from "../src/uri";
import {Body} from "../src/body";
import * as stream from "stream";

describe('http client', function () {
    this.timeout(500);

    it('GET with uri parts echoed back', async () => {
        const client = H22P.client();
        const {port, close} = await H22P.server({
            async handle(req: HttpRequest): Promise<HttpResponse> {
                const uri = URI.of(req.path);
                return {status: 200, body: JSON.stringify(uri), headers: {}}
            }
        });

        const res = await client.handle(
            H22P.get(`http://localhost:${port}/path/name?query1=value1&query2=value2#fragment`)
        )
        expect(res.status).eq(200);
        expect(await Body.json(res.body!)).deep.eq({
            fragment: "#fragment",
            path: "/path/name",
            query: "?query1=value1&query2=value2"
        });
        await close()
    })

    it('OPTIONS request', async () => {
        const client = H22P.client();
        const {port, close} = await H22P.server({
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return {status: 200, body: 'OPTIONS', headers: {"allow": "GET"}}
            }
        });

        const res = await client.handle(
            H22P.options(`http://localhost:${port}/`)
        )
        expect(res.status).eq(200);
        expect(await Body.text(res.body!)).eq('OPTIONS');
        expect(res.headers?.allow).eq('GET');
        await close()
    })

    it('HEAD request doesnt send body in response and sets default headers if not set in handler', async () => {
        const client = H22P.client();
        const {port, close} = await H22P.server({
            async handle(req: HttpRequest): Promise<HttpResponse> {
                const query = URI.query(URI.of(req.path).query);
                if (query.hardCodeResponseHeaders)
                    return {
                        status: 200,
                        body: 'THIS DOESNT GET SENT',
                        headers: {"content-length": "999", "content-type": "text/foo"}
                    }

                return {status: 200, body: 'THIS DOESNT GET SENT', headers: {}}
            }
        });


        const repsonse = await client.handle(
            H22P.head(`http://localhost:${port}/`)
        )
        expect(repsonse.status).eq(200);
        expect(await Body.text(repsonse.body!)).not.eq('THIS DOESNT GET SENT');
        expect(await Body.text(repsonse.body!)).eq('');
        expect(repsonse.headers["content-type"]).eq('text/plain');
        expect(repsonse.headers?.["content-length"]).eq('20');


        /*
            doesn't override response headers if they are set in the handler
         */
        const repsonseHardCodedHeaders = await client.handle(
            H22P.head(`http://localhost:${port}/?hardCodeResponseHeaders=true`)
        )
        expect(repsonseHardCodedHeaders.status).eq(200);
        expect(await Body.text(repsonseHardCodedHeaders.body!)).not.eq('THIS DOESNT GET SENT');
        expect(await Body.text(repsonseHardCodedHeaders.body!)).eq('');
        expect(repsonseHardCodedHeaders.headers["content-type"]).eq('text/foo');
        expect(repsonseHardCodedHeaders.headers?.["content-length"]).eq('999');
        await close()
    })

    it('POST, PUT and PATCH, DELETE with body *string* echoed back', async () => {
        /*
            Interestingly, DELETE needs a content length header or to set transfer-encoding to chunked
                for node to be happy, even though POST, PUT and PATCH can figure themselves out...
         */

        const {port, close} = await H22P.server({
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return {status: 200, body: req.body, headers: {method: req.method}}
            }
        });


        const client = H22P.client();
        const bodyString = 'hello, world!';

        const postResponseString = await client.handle(H22P.post(`http://localhost:${port}/`, bodyString))
        const putResponseString = await client.handle(H22P.put(`http://localhost:${port}/`, bodyString))
        const patchResponseString = await client.handle(H22P.patch(`http://localhost:${port}/`, bodyString))
        const deleteResponseString = await client.handle(H22P.delete(`http://localhost:${port}/`, bodyString))

        await testMethod(postResponseString, 'POST', bodyString);
        await testMethod(putResponseString, 'PUT', bodyString);
        await testMethod(patchResponseString, 'PATCH', bodyString);
        await testMethod(deleteResponseString, 'DELETE', bodyString);

        const bodyBuffer = Buffer.from(bodyString);

        const postResponseBuffer = await client.handle(H22P.post(`http://localhost:${port}/`, bodyBuffer))
        const putResponseBuffer = await client.handle(H22P.put(`http://localhost:${port}/`, bodyBuffer))
        const patchResponseBuffer = await client.handle(H22P.patch(`http://localhost:${port}/`, bodyBuffer))
        const deleteResponseBuffer = await client.handle(H22P.delete(`http://localhost:${port}/`, bodyBuffer))

        await testMethod(postResponseBuffer, 'POST', bodyString);
        await testMethod(putResponseBuffer, 'PUT', bodyString);
        await testMethod(patchResponseBuffer, 'PATCH', bodyString);
        await testMethod(deleteResponseBuffer, 'DELETE', bodyString);

        const postResponseStream = await client.handle(H22P.post(`http://localhost:${port}/`, stream.Readable.from(bodyString)))
        const putResponseStream = await client.handle(H22P.put(`http://localhost:${port}/`, stream.Readable.from(bodyString)))
        const patchResponseStream = await client.handle(H22P.patch(`http://localhost:${port}/`, stream.Readable.from(bodyString)))
        const deleteResponseStream = await client.handle(H22P.delete(`http://localhost:${port}/`, stream.Readable.from(bodyString)))

        await testMethod(postResponseStream, 'POST', bodyString);
        await testMethod(putResponseStream, 'PUT', bodyString);
        await testMethod(patchResponseStream, 'PATCH', bodyString);
        await testMethod(deleteResponseStream, 'DELETE', bodyString);

        async function testMethod(res: HttpResponse, expectedHeader: string, expectedBody: Payload) {
            expect(res.status).eq(200);
            expect(res.headers?.method).eq(expectedHeader);
            expect(await Body.text(res.body!)).deep.eq(expectedBody);
            return res;
        }

        await close()
    })

    it('can send a multipart/form-data request with simple body', async () => {
        const client = H22P.client();
        const {port, close} = await H22P.server({
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return {status: 200, body: req.body, headers: {}}
            }
        });

        const request = H22P.post(`http://localhost:${port}/`, Body.asMultipartForm([{
            headers: [{
                name: 'content-type',
                value: 'text/plain'
            }, {
                name: 'content-disposition',
                fieldName: 'file',
            }],
            body: 'tom1'
        }], 'custom-boundary'));

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
        const client = H22P.client();
        const {port, close} = await H22P.server({
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return {status: 200, body: req.body, headers: {}}
            }
        });

        const request = H22P.post(`http://localhost:${port}/`, Body.asMultipartForm([{
            headers: [{
                name: 'content-type',
                value: 'text/plain'
            }, {
                name: 'content-disposition',
                fieldName: 'file',
            }],
            body: stream.Readable.from('tom1')
        }], 'custom-boundary'));

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
        const client = H22P.client();
        const {port, close} = await H22P.server({
            async handle(req: HttpRequest): Promise<HttpResponse> {
                return {status: 200, body: req.body, headers: {}}
            }
        });


        const request = H22P.post(`http://localhost:${port}/`, Body.asMultipartForm([
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

            }], 'custom-boundary'));

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

})