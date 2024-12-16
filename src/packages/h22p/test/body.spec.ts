import * as stream from "stream";
import {expect} from "chai";
import {Body, h22pStream, MultipartForm, Req} from "../src";
import * as fs from "fs";

describe('body', () => {

    describe('Body.bytes', () => {
        it('handles empty body', async () => {
            const bytes = await Body.bytes(undefined);
            expect(bytes.toString('utf-8')).deep.eq('');
        })

        it('handles empty stream', async () => {
            const bytes = await Body.bytes(h22pStream.of(undefined));
            expect(bytes.toString('utf-8')).deep.eq('');
        })

        it('handles stream', async () => {
            const body = h22pStream.of('🤠');
            body.push('abc')
            body.push('def')
            body.push('ghi')
            const bytes = await Body.bytes(body);
            expect(bytes.toString()).deep.eq('abcdefghi🤠');
        })

        it('handles buffer', async () => {
            const bytes = await Body.bytes(Buffer.from('123'));
            expect(bytes.toString('utf-8')).deep.eq('123');
        })

        it('handles buffer in stream', async () => {
            const bytes = await Body.bytes(h22pStream.of(Buffer.from('123')));
            expect(bytes.toString('utf-8')).deep.eq('123');
        })
    })

    describe('Body.json', () => {
        it('throws if json parsing fails', async () => {
            try {
                await Body.json('{malformed')
            } catch (e) {
                expect((e as Error).message.includes("Expected property name or '}' in JSON at position 1")).eq(true)
            }
        })
    })

    describe('Body.form', () => {
        it('handles special characters', async () => {
            const specialChars = '%21%40%C2%A3%24%25%5E*%E2%82%AC%7D%7B%5B%5D%22%3A%3C%3E%7E%60%2B';

            const form = await Body.form(`name=tom&pic=${specialChars}`)

            expect(form).deep.eq({
                "name": "tom",
                "pic": "!@£$%^*€}{[]\":<>~`+"
            })
        });

        it('handles plus - turns into a space', async () => {
            const form = await Body.form(`name=t+o%2Bm`)

            expect(form).deep.eq({
                "name": "t o+m",
            })
        });

        it('handles unicode characters', async () => {
            const stringWithUnicodeChar = 'field=%E2%82%AC'; // € sign encoded in utf-8
            // note chrome only sends this if either a) you specify accept-charset on your form
            //   or b) you send a response header of content-type "text/html; charset=utf-8"

            const form = await Body.form(stringWithUnicodeChar)

            expect(form).deep.eq({
                "field": "€",
            })
        });
    })

    describe('MultipartForm', () => {
        /*
        *  the standard line end for headers and boundaries etc is CRLF (/r/n)
        *  but we provide a test handling just LF (\n) as well because some systems
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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await new MultipartForm().field(req);

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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await new MultipartForm().field(req);

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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers: headers1, body: body1} = await new MultipartForm().field(req);

            expect(headers1).deep.eq([
                    {
                        "fieldName": "name",
                        "name": "content-disposition"
                    }
                ]
            )
            expect(await Body.text(body1)).eq('tom')

            const {headers: headers2, body: body2} = await new MultipartForm().field(req);
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

            const {headers: headers3, body: body3} = await new MultipartForm().field(req)

            expect(headers3).deep.eq([
                    {
                        "fieldName": "title",
                        "name": "content-disposition"
                    }
                ]
            )
            expect(await Body.text(body3)).eq('title')

            const {headers: headers4, body: body4} = await new MultipartForm().field(req);
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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const formParts = await new MultipartForm().field(req);
            const {headers: headers1, body: body1} = formParts;

            expect(headers1).deep.eq([
                    {
                        "fieldName": "name",
                        "name": "content-disposition"
                    }
                ]
            )
            expect(await Body.text(body1)).eq('tom')

            const {headers: headers2, body: body2} = await new MultipartForm().field(req);
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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await new MultipartForm().field(req);

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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await new MultipartForm().field(req);

            // stream isn't aborted at first
            expect(body.readableAborted).eq(false);
            // emit error so that stream aborts
            body.emit('error', new Error('intentional test error here is expected'));
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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(inputStream),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await new MultipartForm().field(req);
            expect(headers).deep.eq([
                {
                    "fieldName": "name",
                    "name": "content-disposition"
                }
            ])
            expect(await Body.text(body)).deep.eq('tom')

            const {headers: headers1, body: body1} = await new MultipartForm().field(req);
            body1.pipe(fs.createWriteStream(`${__dirname}/resources/hamburger-out.png`));
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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })


            try {
                await new MultipartForm().field(req, {maxHeadersSizeBytes: 10});
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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })

            const {headers,} = await new MultipartForm().field(req);
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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })

            try {
                const {headers, body} = await new MultipartForm().field(req);
            } catch (e) {
                expect((e as Error).message).eq('Malformed headers, did not parse an ending')
            }
        })

        it('if only sent a termination boundary (e.g. input has no name) then we blow up instead of hanging', async () => {
            const boundary = '------WebKitFormBoundaryByKYauLmhh2M99wi';
            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(`--${boundary}--`),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })

            try {
                const {headers, body} = await new MultipartForm().field(req);
            } catch (e) {
                expect((e as Error).message).to.eq('Malformed headers, did not parse an ending')
            }
        })

        it(`if attempting to read another field that isn't there then we return empty`, async () => {
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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const multipartForm = new MultipartForm();
            const {headers, body} = await multipartForm.field(req);
            const {headers: noHeaders, body: noBody} = await multipartForm.field(req);

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

            expect(noHeaders).deep.eq([])
            const noText = await Body.text(noBody);
            expect(noText).deep.eq('');
        })

        it('api for reading `all` parts', async () => {
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

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const parts = await new MultipartForm().all(req);
            const expectedHeaders = [
                [
                    {
                        "fieldName": "name",
                        "name": "content-disposition"
                    }
                ],
                [
                    {
                        name: 'content-disposition',
                        fieldName: 'file',
                        filename: 'test.txt'
                    },
                    {name: 'content-type', value: 'text/plain'}
                ],
                [{name: 'content-disposition', fieldName: 'title'}],
                [
                    {
                        name: 'content-disposition',
                        fieldName: 'bio',
                        filename: 'test.txt'
                    },
                    {name: 'content-type', value: 'text/plain'}
                ]
            ]
            const expectedBodies = [
                'tom',
                'Test file contents\n',
                'title',
                'Test file contents\n',
            ];

            for (let i = 0; i < 4; i++) {
                const part = await parts[Symbol.asyncIterator]().next()
                const text = await Body.text(part.value.body);
                expect(part.value.headers).deep.eq(expectedHeaders[i])
                expect(text).deep.eq(expectedBodies[i])
            }
        })

        it('`field` does not stream the next part until it is asked for', async () => {
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

            const readStream = fs.createReadStream('/dev/urandom', {end: 1_000_000});
            readStream.unshift(Buffer.from(preFile, 'binary'))

            const req = Req.of({
                method: 'POST',
                body: readStream,
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const multipartForm = new MultipartForm();
            const {headers, body} = await multipartForm.field(req);
            expect(headers).deep.eq([
                {
                    "fieldName": "name",
                    "name": "content-disposition"
                }
            ])
            expect(await Body.text(body)).deep.eq('tom')
            const {headers: h2, body: b2} = await multipartForm.field(req);
            // Important: this next line (await Body.text(b2)) makes the test time out while it waits to stream
            // 1MB from /dev/urandom (increase it 100 MB if you want, I decreased it because it slows down all tests!)
            // but this test doesn't time out because we don't wait for it to finish
            // -- thus proving we don't read the next part until we ask for it!!


            // await Body.text(b2)
        })

        it('an empty field is fine - just gives you an empty body', async () => {
            const boundary = '------WebKitFormBoundaryByKYauLmhh2M99wi';
            const wireData = [
                `--${boundary}`,
                `Content-Disposition: form-data; name="name"`,
                '',
                '',
                `--${boundary}--`,
            ].join('\r\n')

            const req = Req.of({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await new MultipartForm().field(req);

            expect(headers).deep.eq([
                    {
                        "fieldName": "name",
                        "name": "content-disposition"
                    }
                ]
            )
            const text = await Body.text(body);
            expect(text).deep.eq('');
        })

    })
})

