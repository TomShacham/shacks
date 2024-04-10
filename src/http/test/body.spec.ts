import * as stream from "stream";
import {expect} from "chai";
import {Body} from "../src/body";

describe('body', () => {

    describe('multipart form', () => {
        /*
        *  the standard line end for headers and boundaries etc is CRLF (/r/n)
        *  but we provide a test handling just LF (\n) as well as some systems
        *  supposedly don't send the Carriage Return (\r) as well as the Line Feed (\n)
        * */

        it('a file by itself', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';

            let exampleMultipartFormData = `${boundary}\r
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
Test file contents\r
${boundary}--\r
`

            // random chunks so that we prove we can handle receiving the payload in arbitrary bits
            // (as it may come over the wire in bits and bobs)
            const randomChunks = inChunks(exampleMultipartFormData);
            const multipartFormBodyStream = stream.Readable.from(randomChunks)
            const fileParts = await Body.parseMultipartForm(multipartFormBodyStream, boundary);

            expect(fileParts).deep.eq([{
                "body": "Test file contents",
                "headers": [
                    {
                        "filename": "test.txt",
                        "fieldName": "file",
                        "headerName": "content-disposition"
                    },
                    {
                        "headerName": "content-type",
                        "value": "text/plain"
                    }
                ]
            }]);
        })

        it('a text input by itself', async () => {
            const boundary = '------WebKitFormBoundaryS7EqcIpCaxXELv6B';

            let exampleMultipartFormData = `${boundary}\r
Content-Disposition: form-data; name="name"\r
\r
tom\r
${boundary}--\r
`

            // random chunks so that we prove we can handle receiving the payload in arbitrary bits
            // (as it may come over the wire in bits and bobs)
            const randomChunks = inChunks(exampleMultipartFormData);
            const multipartFormBodyStream = stream.Readable.from(randomChunks)
            const fileParts = await Body.parseMultipartForm(multipartFormBodyStream, boundary);

            expect(fileParts).deep.eq([
                {
                    "body": "tom",
                    "headers": [
                        {
                            "headerName": "content-disposition",
                            "fieldName": "name"
                        }
                    ]
                }
            ]);
        })

        it('a text input and a file', async () => {
            const boundary = '----------------------WebKitFormBoundary3SDTCgyIZiMSWJG7';

            let exampleMultipartFormData = `${boundary}\r
Content-Disposition: form-data; name="name"\r
\r
tom\r
${boundary}\r
Content-Disposition: form-data; name="file"; filename="test.txt"\r
Content-Type: text/plain\r
\r
Test file contents\r
${boundary}--\r
`

            // random chunks so that we prove we can handle receiving the payload in arbitrary bits
            // (as it may come over the wire in bits and bobs)
            const randomChunks = inChunks(exampleMultipartFormData);
            const multipartFormBodyStream = stream.Readable.from(randomChunks)

            const fileParts = await Body.parseMultipartForm(multipartFormBodyStream, boundary);

            expect(fileParts).deep.eq([
                {
                    "body": "tom",
                    "headers": [
                        {
                            "fieldName": "name",
                            "headerName": "content-disposition"
                        }
                    ]
                },
                {
                    "body": "Test file contents",
                    "headers": [
                        {
                            "filename": "test.txt",
                            "fieldName": "file",
                            "headerName": "content-disposition"
                        },
                        {
                            "headerName": "content-type",
                            "value": "text/plain"
                        }
                    ]
                }
            ]);
        })

        it('a text input and multiple files', async () => {
            const boundary = '------WebKitFormBoundaryQmshvAjyLS077cbB';

            let exampleMultipartFormData = `${boundary}\r
Content-Disposition: form-data; name=\"name\"\r
\r
tom\r
${boundary}\r
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
Test file contents
\r
${boundary}\r
Content-Disposition: form-data; name=\"bio\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
Test file contents
\r
${boundary}--\r
`

            // random chunks so that we prove we can handle receiving the payload in arbitrary bits
            // (as it may come over the wire in bits and bobs)
            const randomChunks = inChunks(exampleMultipartFormData);
            const multipartFormBodyStream = stream.Readable.from(randomChunks)

            const fileParts = await Body.parseMultipartForm(multipartFormBodyStream, boundary);

            expect(fileParts).deep.eq([
                {
                    "body": "tom",
                    "headers": [
                        {
                            "fieldName": "name",
                            "headerName": "content-disposition"
                        }
                    ]
                },
                {
                    "body": "Test file contents\n",
                    "headers": [
                        {
                            "fieldName": "file",
                            "filename": "test.txt",
                            "headerName": "content-disposition"
                        },
                        {
                            "headerName": "content-type",
                            "value": "text/plain"
                        }
                    ]
                },
                {
                    "body": "Test file contents\n",
                    "headers": [
                        {
                            "fieldName": "bio",
                            "filename": "test.txt",
                            "headerName": "content-disposition"
                        },
                        {
                            "headerName": "content-type",
                            "value": "text/plain"
                        }
                    ]
                }
            ]);
        })

        it('multiple text inputs and multiple files', async () => {
            const boundary = '------WebKitFormBoundaryZnZz58ycjFeBNyad';

            let exampleMultipartFormData = `${boundary}\r
Content-Disposition: form-data; name=\"name\"\r
\r
tom\r
${boundary}\r
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
Test file contents
\r
${boundary}\r
Content-Disposition: form-data; name=\"title\"\r
\r
title\r
${boundary}\r
Content-Disposition: form-data; name=\"bio\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
Test file contents
\r
${boundary}--\r
`

            // random chunks so that we prove we can handle receiving the payload in arbitrary bits
            // (as it may come over the wire in bits and bobs)
            const randomChunks = inChunks(exampleMultipartFormData);
            const multipartFormBodyStream = stream.Readable.from(randomChunks)

            const fileParts = await Body.parseMultipartForm(multipartFormBodyStream, boundary);

            expect(fileParts).deep.eq([
                {
                    "body": "tom",
                    "headers": [
                        {
                            "fieldName": "name",
                            "headerName": "content-disposition"
                        }
                    ]
                },
                {
                    "body": "Test file contents\n",
                    "headers": [
                        {
                            "fieldName": "file",
                            "filename": "test.txt",
                            "headerName": "content-disposition"
                        },
                        {
                            "headerName": "content-type",
                            "value": "text/plain"
                        }
                    ]
                },
                {
                    "body": "title",
                    "headers": [
                        {
                            "fieldName": "title",
                            "headerName": "content-disposition"
                        }
                    ]
                },
                {
                    "body": "Test file contents\n",
                    "headers": [
                        {
                            "fieldName": "bio",
                            "filename": "test.txt",
                            "headerName": "content-disposition"
                        },
                        {
                            "headerName": "content-type",
                            "value": "text/plain"
                        }
                    ]
                }
            ]);
        })

        it('a text input and a file but with \\n only', async () => {
            const boundary = '------WebKitFormBoundary3SDTCgyIZiMSWJG7';

            let exampleMultipartFormData = `${boundary}
Content-Disposition: form-data; name="name"

tom
${boundary}
Content-Disposition: form-data; name="file"; filename="test.txt"
Content-Type: text/plain

Test file contents
${boundary}--
`

            // random chunks so that we prove we can handle receiving the payload in arbitrary bits
            // (as it may come over the wire in bits and bobs)
            const randomChunks = inChunks(exampleMultipartFormData);
            const multipartFormBodyStream = stream.Readable.from(randomChunks)

            const fileParts = await Body.parseMultipartForm(multipartFormBodyStream, boundary);

            expect(fileParts).deep.eq([
                {
                    "body": "tom",
                    "headers": [
                        {
                            "fieldName": "name",
                            "headerName": "content-disposition"
                        }
                    ]
                },
                {
                    "body": "Test file contents",
                    "headers": [
                        {
                            "filename": "test.txt",
                            "fieldName": "file",
                            "headerName": "content-disposition"
                        },
                        {
                            "headerName": "content-type",
                            "value": "text/plain"
                        }
                    ]
                }
            ]);

        })

        it('a file by itself but with dashes in it', async () => {
            const boundary = '------WebKitFormBoundaryiyDVEBDBpn3PxxQy';

            let exampleMultipartFormData = `${boundary}\r
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
Test-- file-- contents\r
${boundary}--\r
`

            // random chunks so that we prove we can handle receiving the payload in arbitrary bits
            // (as it may come over the wire in bits and bobs)
            const randomChunks = inChunks(exampleMultipartFormData);
            const multipartFormBodyStream = stream.Readable.from(randomChunks)
            const fileParts = await Body.parseMultipartForm(multipartFormBodyStream, boundary);

            expect(fileParts).deep.eq([{
                "body": "Test-- file-- contents",
                "headers": [
                    {
                        "filename": "test.txt",
                        "fieldName": "file",
                        "headerName": "content-disposition"
                    },
                    {
                        "headerName": "content-type",
                        "value": "text/plain"
                    }
                ]
            }]);
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
