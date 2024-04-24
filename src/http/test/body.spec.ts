import * as stream from "stream";
import {expect} from "chai";
import {Body, MultipartForm} from "../src/body";
import * as fs from "fs";
import {HTTP} from "../src/interface";

describe('body', () => {

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

            const req = HTTP.request({
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

            const req = HTTP.request({
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

            const req = HTTP.request({
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

            const req = HTTP.request({
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

            const req = HTTP.request({
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

            const req = HTTP.request({
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
            ].join('\r\n')

            const postFile = `\r
--${boundary}--\r
`
            const inputStream = Buffer.concat([
                Buffer.from(preFile, 'binary'),
                fs.readFileSync('./src/http/test/resources/hamburger.png'),
                Buffer.from(postFile, 'binary')])

            const req = HTTP.request({
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
            body1.pipe(fs.createWriteStream('./src/http/test/resources/hamburger-out.png'));
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

            const req = HTTP.request({
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

            const req = HTTP.request({
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
    })
})
