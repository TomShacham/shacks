import * as stream from "stream";
import {expect} from "chai";
import {Body} from "../src/body";
import * as fs from "fs";
import {request} from "../src/interface";

describe('body', () => {

    describe('multipart form', () => {
        /*
        *  the standard line end for headers and boundaries etc is CRLF (/r/n)
        *  but we provide a test handling just LF (\n) as well as some systems
        *  supposedly don't send the Carriage Return (\r) as well as the Line Feed (\n)
        * */

        it('a file by itself', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';

            let exampleMultipartFormData = `--${boundary}\r
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
Test file contents\r
--${boundary}--\r
`

            const req = request({
                method: 'POST',
                body: stream.Readable.from(exampleMultipartFormData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await Body.multipartFormField(req);

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

            let exampleMultipartFormData = `--${boundary}\r
Content-Disposition: form-data; name="name"\r
\r
tom\r
--${boundary}--\r
`

            const req = request({
                method: 'POST',
                body: stream.Readable.from(exampleMultipartFormData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await Body.multipartFormField(req);

            expect(headers).deep.eq([
                    {
                        "name": "content-disposition",
                        "fieldName": "name"
                    }
                ]
            );
            expect(await Body.text(body)).eq('tom')
        })

        it('multiple text inputs and multiple files', async () => {
            const boundary = '------WebKitFormBoundaryZnZz58ycjFeBNyad';

            let exampleMultipartFormData = `--${boundary}\r
Content-Disposition: form-data; name=\"name\"\r
\r
tom\r
--${boundary}\r
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
Test file contents
\r
--${boundary}\r
Content-Disposition: form-data; name=\"title\"\r
\r
title\r
--${boundary}\r
Content-Disposition: form-data; name=\"bio\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
Test file contents
\r
--${boundary}--\r
`
            const req = request({
                method: 'POST',
                body: stream.Readable.from(exampleMultipartFormData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers: headers1, body: body1} = await Body.multipartFormField(req);

            expect(headers1).deep.eq([
                    {
                        "fieldName": "name",
                        "name": "content-disposition"
                    }
                ]
            )
            expect(await Body.text(body1)).eq('tom')

            const {headers: headers2, body: body2} = await Body.parsePart(req);
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

            const {headers: headers3, body: body3} = await Body.parsePart(req)

            expect(headers3).deep.eq([
                    {
                        "fieldName": "title",
                        "name": "content-disposition"
                    }
                ]
            )
            expect(await Body.text(body3)).eq('title')

            const {headers: headers4, body: body4} = await Body.parsePart(req);
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

        it('a text input and a file but with \\n only', async () => {
            const boundary = '------WebKitFormBoundary3SDTCgyIZiMSWJG7';

            let exampleMultipartFormData = `--${boundary}
Content-Disposition: form-data; name="name"

tom
--${boundary}
Content-Disposition: form-data; name="file"; filename="test.txt"
Content-Type: text/plain

Test file contents
--${boundary}--
`
            const req = request({
                method: 'POST',
                body: stream.Readable.from(exampleMultipartFormData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const formParts = await Body.multipartFormField(req);
            const {headers: headers1, body: body1} = formParts;

            expect(headers1).deep.eq([
                    {
                        "fieldName": "name",
                        "name": "content-disposition"
                    }
                ]
            )
            expect(await Body.text(body1)).eq('tom')

            const {headers: headers2, body: body2} = await Body.parsePart(req);
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

        it('a file by itself but with dashes in it', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';

            let exampleMultipartFormData = `--${boundary}\r
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
Test-- file-- contents\r
--${boundary}--\r
`

            const req = request({
                method: 'POST',
                body: stream.Readable.from(exampleMultipartFormData),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await Body.multipartFormField(req);

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

        it('handles png', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';

            const preFile = `--${boundary}\r
Content-Disposition: form-data; name=\"name\"\r
\r
tom\r
--${boundary}\r
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r
Content-Type: image/png\r
\r
`
            const postFile = `\r
--${boundary}--\r
`
            const inputStream = Buffer.concat([
                Buffer.from(preFile, 'binary'),
                fs.readFileSync('./src/http/test/resources/hamburger.png'),
                Buffer.from(postFile, 'binary')])

            const req = request({
                method: 'POST',
                body: stream.Readable.from(inputStream),
                headers: {"content-type": `multipart/form-data; boundary=${boundary}`}
            })
            const {headers, body} = await Body.multipartFormField(req);
            expect(headers).deep.eq([
                {
                    "fieldName": "name",
                    "name": "content-disposition"
                }
            ])
            expect(await Body.text(body)).deep.eq('tom')

            const {headers: headers1, body: body1} = await Body.parsePart(req);
            body1.pipe(fs.createWriteStream('./src/http/test/resources/hamburger-out.png'));
        })

    })


})


function inChunks(exampleMPFormData: string, noOfChunks: number = 5 + Math.floor(Math.random() * 10)) {
    let randomChunks: string[] = []
    const chunkSize = exampleMPFormData.length / noOfChunks
    for (let i = 0; i < noOfChunks; i++) {
        randomChunks.push(exampleMPFormData.slice(i * chunkSize, (i + 1) * chunkSize))
    }
    return randomChunks;
}
