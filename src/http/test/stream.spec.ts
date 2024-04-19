import * as stream from "stream";
import {expect} from "chai";
import {createReadable, parseBody, parseBoundary, parseHeaders} from "../src/body";

describe('streams', () => {

    it('parsing boundary buffer', async () => {
        const boundary = `--boundary`;
        const string = `${boundary}\r
header line1\r
\r
body\r
${boundary}--`;

        const inn = stream.Readable.from(Buffer.from(string))
        const chunk = inn.read();
        const {remainder} = parseBoundary(chunk, boundary)
        expect(remainder.length).eq(string.length - `${boundary}\r\n`.length)
    });

    it('parsing headers', async () => {
        const boundary = `--boundary`;
        const string = `${boundary}\r
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r

\r
body\r
${boundary}--`;

        const inn = stream.Readable.from(Buffer.from(string))
        const chunk = inn.read();
        const {remainder: r1} = parseBoundary(chunk, boundary)
        const {headers} = parseHeaders(r1)
        expect(headers).deep.eq([{
            "fieldName": "file",
            "filename": "test.txt",
            "name": "content-disposition"
        }])
    });

    it('parsing body buffer', async () => {
        const boundary = `--boundary`;
        const string = `${boundary}\r
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
body1\r
${boundary}--`;

        const inn = stream.Readable.from(Buffer.from(string))
        const outputStream = createReadable();

        const chunk = inn.read();
        const {remainder: r1, usingCRLF} = parseBoundary(chunk, boundary)
        const {headers, remainder: r2} = parseHeaders(r1)
        expect(headers).deep.eq([
            {
                "fieldName": "file",
                "filename": "test.txt",
                "name": "content-disposition"
            },
            {
                "name": "content-type",
                "value": "text/plain"
            }])
        parseBody(stream.Readable.from(r2), outputStream, boundary, usingCRLF)

        // can use "for await" syntax hooray!
        for await (const chunk of outputStream) {
            expect(new TextDecoder().decode(chunk)).deep.eq('body1')
        }
    })

    it('parsing body string', async () => {
        const boundary = `--boundary`;
        const string = `${boundary}\r
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r
Content-Type: text/plain\r
\r
body1\r
${boundary}--`;

        const inn = stream.Readable.from(Buffer.from(string))
        const outputStream = createReadable();

        const chunk = inn.read();
        const {remainder: r1, usingCRLF} = parseBoundary(chunk, boundary)
        const {headers, remainder: r2} = parseHeaders(r1)
        expect(headers).deep.eq([
            {
                "fieldName": "file",
                "filename": "test.txt",
                "name": "content-disposition"
            },
            {
                "name": "content-type",
                "value": "text/plain"
            }])
        parseBody(stream.Readable.from(r2), outputStream, boundary, usingCRLF)

        // can use "for await" syntax hooray!
        for await (const chunk of outputStream) {
            expect(new TextDecoder().decode(chunk)).deep.eq('body1')
        }
    });

    it('parsing with just \\n', async () => {
        const boundary = `--boundary`;
        const string = `${boundary}
Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"
Content-Type: text/plain

body1
${boundary}--`;

        const inn = stream.Readable.from(Buffer.from(string))
        const outputStream = createReadable();

        const chunk = inn.read();
        const {remainder: r1, usingCRLF} = parseBoundary(chunk, boundary)
        const {headers, remainder: r2} = parseHeaders(r1)
        expect(headers).deep.eq([
            {
                "fieldName": "file",
                "filename": "test.txt",
                "name": "content-disposition"
            },
            {
                "name": "content-type",
                "value": "text/plain"
            }
        ])
        parseBody(stream.Readable.from(r2), outputStream, boundary, usingCRLF)

        // can use "for await" syntax hooray!
        for await (const chunk of outputStream) {
            expect(new TextDecoder().decode(chunk)).deep.eq('body1')
        }
    });

    it('unshift a stream', async () => {
        const readable = createReadable();
        readable.push('bar')
        readable.unshift('foo')
        readable.push(null)
        const d = new TextDecoder()
        for await (const chunk of readable) {
            expect(d.decode(chunk)).eq('foobar')
        }
    })
})

