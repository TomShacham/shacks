import * as stream from "stream";
import {expect} from "chai";
import {ContentTypes, MultipartFormHeader} from "../src/body";

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
})

function parseBody(inputStream: stream.Readable, outputStream: stream.Readable, boundary: string, usingCRLF: boolean) {
    let text: string = '';
    //  used to check we have just seen a boundary
    let lastNChars = new Array(boundary.length + 2).fill('x')
    // typically we see CRLF as per the standard
    let delimiter = usingCRLF ? '\r\n' : '\n';

    let chunk;
    while ((chunk = inputStream.read()) != null) {
        let buf = Buffer.alloc(chunk.length)
        let bufferPointer = 0;

        for (let j = 0; j < chunk.length; j++) {
            const byte = chunk[j];
            const byteOrChar = typeof byte === 'string' ? byte : String.fromCharCode(byte);
            lastNChars.shift()
            lastNChars.push(byteOrChar)

            if (typeof byte === 'string') {
                text += byteOrChar
            } else {
                buf[bufferPointer] = byte as number;
                bufferPointer++
            }

            // if we've seen two hyphens then start countdown to checking the boundary soon
            const shouldCheckBoundary = lastNChars.some((value, index) => {
                return (lastNChars[index] + lastNChars[index + 1]) === '--'
            })

            if (shouldCheckBoundary) {
                // chop off the extra 2 bytes in our history buffer (that's how many bytes we had to see to decide to come here)
                const seenBoundary = boundary.split('').every((c, index) => c === lastNChars[index]);
                // if it is the boundary then make the file part
                if (seenBoundary) {
                    // if we see only a \n at the end of the boundary, then we are using LF only; not CRLF;
                    const isFinalBoundary = lastNChars.slice(-2, lastNChars.length).every(c => c === '-')
                    if (lastNChars[lastNChars.length - 2] === '\n') {
                        delimiter = '\n';
                    }
                    const extraToChopOff = delimiter.length
                    if (typeof byte === 'string') {
                        text = text.slice(0, text.length - lastNChars.length - extraToChopOff)
                        outputStream.push(text)
                    } else {
                        outputStream.push(buf.subarray(0, bufferPointer - lastNChars.length - extraToChopOff))
                    }
                    // we're done with this body
                    outputStream.push(null);
                    // return what's left unread
                    return chunk.subarray(bufferPointer - lastNChars.length - extraToChopOff)
                }
            }

            const endOfChunk = j === chunk.length - 1;
            if (endOfChunk) {
                if (typeof byte === 'string') {
                    outputStream.push(text)
                } else {
                    buf = buf.subarray(0, bufferPointer)
                    outputStream.push(buf)
                }
            }
        }
    }
    // finally push null as there is nothing more to read from input
    outputStream.push(null)
}

type Chunk = Buffer | string;

function parseBoundary(chunk: Chunk, boundary: string): { remainder: Chunk, usingCRLF: boolean } {
    for (let j = 0; j < boundary.length; j++) {
        const char = typeof chunk[j] === 'string' ? chunk[j] : String.fromCharCode(chunk[j] as number);
        if (char !== boundary[j]) throw new Error('Uh oh');
    }
    const usingCRLF = chunk[boundary.length] === 13 || chunk[boundary.length] === '\r';
    const skip = usingCRLF ? 2 : 1;
    const remainder = typeof chunk === 'string'
        ? chunk.slice(boundary.length + skip)
        : chunk.subarray(boundary.length + skip);
    return {remainder, usingCRLF}
}

function parseHeaders(chunk: Chunk): { headers: MultipartFormHeader[], remainder: Chunk } {
    let headers: MultipartFormHeader[] = []
    let header = '';
    let lastFour = ['x', 'x', 'x', 'x'];


    for (let j = 0; j < chunk.length; j++) {
        const byte: string | number = chunk[j];
        const char = typeof byte === 'string' ? byte : String.fromCharCode(byte);
        lastFour.shift();
        lastFour.push(char);

        if (char !== '\n') {
            header += char
        } else {
            if (header !== '') {
                const parsed = parseHeader(header)
                if (parsed) headers.push(parsed)
            }
            header = '';
        }
        if (
            lastFour[0] === '\r' && lastFour [1] === '\n' && lastFour[2] === '\r' && lastFour[3] === '\n'
            || lastFour[2] === '\n' && lastFour[3] === '\n'
        ) {
            const remainder = typeof chunk === 'string'
                ? chunk.slice(j + 1)
                : chunk.subarray(j + 1)
            return {headers, remainder}
        }
    }
    return {headers, remainder: chunk}
}

function createReadable() {
    return new stream.Readable({
        read() {
        }
    });
}

function parseHeader(str: string): MultipartFormHeader | undefined {
    const [headerName, value] = str.split(':');
    if (headerName.toLowerCase() === 'content-disposition') {
        // regex is a bit slow but means the header value can be a bit more flexible with its syntax
        const nameRegex = /name="(?<name>([^"]+))/.exec(value);
        const filenameRegex = /filename="(?<filename>([^"]+))/.exec(value);
        // blow up if there's no name
        const name = nameRegex!.groups!.name
        const filename = filenameRegex?.groups?.filename
        return {name: 'content-disposition', fieldName: name, ...(filename ? {filename} : {})};
    }
    if (headerName.toLowerCase() === 'content-type') {
        const trim = value.trim();
        const contentType = contentTypeFromText(trim);
        return {name: "content-type", value: contentType ?? 'text/plain'}
    }
    if (headerName.toLowerCase() === 'content-transfer-encoding') {
        return {name: "content-transfer-encoding", value: value.trim() === 'base64' ? 'base64' : 'binary'};
    }
}

function contentTypeFromText(trim: string | undefined): ContentTypes {
    if (!trim) return 'text/plain'
    if (trim.toLowerCase() === 'text/plain') return 'text/plain'
    if (trim.toLowerCase() === 'text/html') return 'text/html'
    if (trim.toLowerCase() === 'text/css') return 'text/css'
    if (trim.toLowerCase() === 'text/xml') return 'text/xml'
    if (trim.toLowerCase() === 'text/csv') return 'text/csv'
    if (trim.toLowerCase() === 'image/png') return 'image/png'
    if (trim.toLowerCase() === 'image/jpg') return 'image/jpg'
    if (trim.toLowerCase() === 'image/jpeg') return 'image/jpeg'
    if (trim.toLowerCase() === 'image/gif') return 'image/gif'
    if (trim.toLowerCase() === 'image/svg') return 'image/svg'
    if (trim.toLowerCase() === 'audio/mp4') return 'audio/mp4'
    if (trim.toLowerCase() === 'audio/mpeg') return 'audio/mpeg'
    if (trim.toLowerCase() === 'video/mp4') return 'video/mp4'
    if (trim.toLowerCase() === 'video/mpeg') return 'video/mpeg'
    if (trim.toLowerCase() === 'video/quicktime') return 'video/quicktime'
    if (trim.toLowerCase() === 'application/pdf') return 'application/pdf'
    if (trim.toLowerCase() === 'application/json') return 'application/json'
    if (trim.toLowerCase() === 'application/xml') return 'application/xml'
    if (trim.toLowerCase() === 'application/javascript') return 'application/javascript'
    if (trim.toLowerCase() === 'application/ms-word') return 'application/ms-word'
    if (trim.toLowerCase() === 'application/vns.ms-excel') return 'application/vns.ms-excel'
    if (trim.toLowerCase() === 'application/octet-stream') return 'application/octet-stream'
    if (trim.toLowerCase() === 'multipart/mixed') return 'multipart/mixed'
    if (trim.toLowerCase() === 'multipart/related') return 'multipart/related'
    if (trim.toLowerCase() === 'multipart/alternative') return 'multipart/alternative'
    return 'text/plain'
}
