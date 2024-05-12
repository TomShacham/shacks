import * as stream from "stream";
import {expect} from "chai";
import {Body, MultipartForm} from "../src/body";
import * as fs from "fs";
import {h22p} from "../src/interface";

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

    describe('Body.form', () => {
        it('throws if header is not present', async () => {
            try {
                const form = await Body.form(h22p.post('/', {}, 'name=tom&pic=plom'))
            } catch (e) {
                expect((e as Error).message).eq('Content type is not application/x-www-form-urlencoded so bailing on parsing form')
            }
        });

        it('parses application/x-www-form-urlencoded', async () => {
            const form = await Body.form(
                h22p.post('/', {"content-type": "application/x-www-form-urlencoded"}, 'name=tom&pic=plom')
            )
            expect(form).deep.eq({"name": "tom", "pic": "plom"})
        });

        it('handles special characters', async () => {
            const bastardString = 'foo!@£$%^&*()-=_+{}|":?><,.~`#€';

            const encoded = encode(bastardString);
            console.log(encoded);
            console.log(decode(encoded));

            const form = await Body.form(
                h22p.post('/',
                    {"content-type": "application/x-www-form-urlencoded"},
                    `name=tom&pic=${encoded}`)
            )

            //TODO test all utf-8 chars and decide what to do about non-utf8 chars like "€"
            expect(form).deep.eq({
                "name": "tom",
                "pic": "foo!@£$%^&*()-=_+{}|\":?><,.~`#"
            })
        });

        function decode(str: string) {
            var strWithoutPlus = str.replace(/\+/g, ' ');
            // utf-8
            try {
                return decodeURIComponent(strWithoutPlus);
            } catch (e) {
                return strWithoutPlus;
            }
        };

        function encode(str: string) {
            const hexTable = (function () {
                var array = [];
                for (var i = 0; i < 256; ++i) {
                    array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
                }

                return array;
            }());

            // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
            // It has been adapted here for stricter adherence to RFC 3986
            if (str.length === 0) {
                return str;
            }

            var out = '';
            var arr = [];
            for (var i = 0; i < str.length; i++) {

                var c = str.charCodeAt(i);
                if (
                    c === 0x2D // -
                    || c === 0x2E // .
                    || c === 0x5F // _
                    || c === 0x7E // ~
                    || c >= 0x30 && c <= 0x39 // 0-9
                    || c >= 0x41 && c <= 0x5A // a-z
                    || c >= 0x61 && c <= 0x7A // A-Z
                    || c === 0x28 || c === 0x29 // ( )
                ) {
                    arr[arr.length] = str.charAt(i);
                    continue;
                }

                if (c < 0x80) {
                    arr[arr.length] = hexTable[c];
                    continue;
                }

                if (c < 0x800) {
                    arr[arr.length] = hexTable[0xC0 | (c >> 6)]
                        + hexTable[0x80 | (c & 0x3F)];
                    continue;
                }

                if (c < 0xD800 || c >= 0xE000) {
                    arr[arr.length] = hexTable[0xE0 | (c >> 12)]
                        + hexTable[0x80 | ((c >> 6) & 0x3F)]
                        + hexTable[0x80 | (c & 0x3F)];
                    continue;
                }

                i += 1;
                c = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));

                arr[arr.length] = hexTable[0xF0 | (c >> 18)]
                    + hexTable[0x80 | ((c >> 12) & 0x3F)]
                    + hexTable[0x80 | ((c >> 6) & 0x3F)]
                    + hexTable[0x80 | (c & 0x3F)];

            }
            out += arr.join('');
            return out;
        }

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

            const req = h22p.request({
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

            const req = h22p.request({
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

            const req = h22p.request({
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

            console.log('reading 2');
            const {headers: headers2, body: body2} = await new MultipartForm().field(req);
            console.log('read 2');
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

            const req = h22p.request({
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

            const req = h22p.request({
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

            const req = h22p.request({
                method: 'POST',
                body: stream.Readable.from(wireData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await new MultipartForm().field(req);

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

            const req = h22p.request({
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

            const req = h22p.request({
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

            const req = h22p.request({
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

            const req = h22p.request({
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

            const req = h22p.request({
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

            const req = h22p.request({
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

            const req = h22p.request({
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

