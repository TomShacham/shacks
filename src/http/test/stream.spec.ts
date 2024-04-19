import * as stream from "stream";
import {expect} from "chai";

describe('streams', () => {

    it('parsing boundary', async () => {
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
header line1\r
\r
body\r
${boundary}--`;

        const inn = stream.Readable.from(Buffer.from(string))
        const chunk = inn.read();
        const {remainder: r1} = parseBoundary(chunk, boundary)
        const {headers, remainder: r2} = parseHeaders(r1)
        expect(headers).deep.eq(['header line1'])
        expect(r2.length).eq(string.length - `${boundary}\r\n`.length - 'header line1\r\n\r\n'.length)
    });

    it('parsing body', async () => {
        const boundary = `--boundary`;
        const string = `${boundary}\r
header line1\r
header line2\r
\r
body1\r
${boundary}--`;

        const inn = stream.Readable.from(Buffer.from(string))
        const outputStream = createReadable();

        const chunk = inn.read();
        const {remainder: r1} = parseBoundary(chunk, boundary)
        const {headers, remainder: r2} = parseHeaders(r1)
        expect(headers).deep.eq(['header line1', 'header line2'])
        expect(r2.length).eq(string.length - `${boundary}\r\n`.length - 'header line1\r\nheader line2\r\n\r\n'.length)
        parseBody(stream.Readable.from(r2), boundary, outputStream)

        // can use "for await" syntax hooray!
        for await (const chunk of outputStream) {
            expect(new TextDecoder().decode(chunk)).deep.eq('body1')
        }
    });
})

function parseBody(inputStream: stream.Readable, boundary: string, outputStream: stream.Readable) {
    let text: string = '';
    //  used to check we have just seen a boundary
    let lastCharsOfSameLengthAsBoundary = new Array(boundary.length + 2).fill('x')
    // typically we see CRLF as per the standard
    let delimiter = '\r\n';

    let chunk;
    while ((chunk = inputStream.read()) != null) {
        let buf = Buffer.alloc(chunk.length)
        let bufferPointer = 0;

        for (let j = 0; j < chunk.length; j++) {
            const byte = chunk[j];
            const byteOrChar = typeof byte === 'string' ? byte : String.fromCharCode(byte);
            lastCharsOfSameLengthAsBoundary.shift()
            lastCharsOfSameLengthAsBoundary.push(byteOrChar)

            if (typeof byte === 'string') {
                text += byteOrChar
            } else {
                buf[bufferPointer] = byte as number;
                bufferPointer++
            }

            // if we've seen two hyphens then start countdown to checking the boundary soon
            const shouldCheckBoundary = lastCharsOfSameLengthAsBoundary.some((value, index) => {
                return (lastCharsOfSameLengthAsBoundary[index] + lastCharsOfSameLengthAsBoundary[index + 1]) === '--'
            })

            if (shouldCheckBoundary) {
                // chop off the extra 2 bytes in our history buffer (that's how many bytes we had to see to decide to come here)
                const seenBoundary = boundary.split('').every((c, index) => c === lastCharsOfSameLengthAsBoundary[index]);
                // if it is the boundary then make the file part
                if (seenBoundary) {
                    // if we see only a \n at the end of the boundary, then we are using LF only; not CRLF;
                    if (lastCharsOfSameLengthAsBoundary[lastCharsOfSameLengthAsBoundary.length - 2] === '\n') {
                        delimiter = '\n';
                    }
                    const extraToChopOff = delimiter.length
                    if (typeof byte === 'string') {
                        text = text.slice(0, text.length - lastCharsOfSameLengthAsBoundary.length - extraToChopOff)
                        outputStream.push(text)
                    } else {
                        outputStream.push(buf.subarray(0, bufferPointer - lastCharsOfSameLengthAsBoundary.length - extraToChopOff))
                    }
                    // we're done with this body
                    outputStream.push(null);
                    // return what's left unread
                    return chunk.subarray(bufferPointer - lastCharsOfSameLengthAsBoundary.length - extraToChopOff)
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

function parseBoundary(chunk: Chunk, boundary: string): { remainder: Chunk } {
    for (let j = 0; j < boundary.length; j++) {
        const char = typeof chunk[j] === 'string' ? chunk[j] : String.fromCharCode(chunk[j] as number);
        if (char !== boundary[j]) throw new Error('Uh oh');
    }
    console.log(chunk[boundary.length] === 10 || chunk[boundary.length] === '\r')
    const remainder = typeof chunk === 'string'
        ? chunk.slice(boundary.length + 2)
        : chunk.subarray(boundary.length + 2);
    return {remainder}
}

function parseHeaders(chunk: Chunk): { headers: string[], remainder: Chunk } {
    let headers: string[] = []
    let header = '';
    let lastFour = ['x', 'x', 'x', 'x'];


    for (let j = 0; j < chunk.length; j++) {
        const byte: string | number = chunk[j];
        const char = typeof byte === 'string' ? byte : String.fromCharCode(byte);
        lastFour.shift();
        lastFour.push(char);

        if (lastFour[0] === '\r' && lastFour [1] === '\n' && lastFour[2] === '\r' && lastFour[3] === '\n') {
            headers.push(header.slice(0, -3))
            const remainder = typeof chunk === 'string'
                ? chunk.slice(j + 1)
                : chunk.subarray(j + 1);
            return {headers, remainder}
        }
        if (lastFour[0] === '\r' && lastFour[1] === '\n') {
            headers.push(header.slice(0, -3))
            header = lastFour[2]
        }
        header += char
    }
    return {headers, remainder: chunk}
}

function createReadable() {
    return new stream.Readable({
        read() {
        }
    });
}
