import * as stream from "stream";
import {expect} from "chai";

describe('streams', () => {

    it('parsing boundary', async () => {
        const string = `boundary
header line1

body
boundary--`;

        const inn = stream.Readable.from(Buffer.from(string))

        const chunk = inn.read();
        const {remainder} = parseBoundary(chunk, 'boundary')
        expect(remainder.length).eq(string.length - 'boundary'.length - '\n'.length)
    });

    it('parsing headers', async () => {
        const string = `boundary
header line1

body
boundary--`;

        const inn = stream.Readable.from(Buffer.from(string))

        const chunk = inn.read();
        const {remainder: r1} = parseBoundary(chunk, 'boundary')
        const {headers, remainder: r2} = parseHeaders(r1)
        expect(headers).deep.eq(['header line1'])
        expect(r2.length).eq(string.length - 'boundary\n'.length - 'header line1\n\n'.length)
    });

    it('parsing body', async () => {
        const string = `boundary
header line1
header line2

body1
boundary`;

        const inn = stream.Readable.from(Buffer.from(string))
        const outputStream = new stream.Readable({
            read() {
            }
        })

        const chunk = inn.read();
        const {remainder: r1} = parseBoundary(chunk, 'boundary')
        const {headers, remainder: r2} = parseHeaders(r1)
        expect(headers).deep.eq(['header line1', 'header line2'])
        expect(r2.length).eq(string.length - 'boundary\n'.length - 'header line1\nheader line2\n\n'.length)
        const {remainder: r3} = parseBody(r2, 'boundary', outputStream)
        expect(new TextDecoder().decode(outputStream.read())).deep.eq('body1')
        expect(r3.length).eq(0)
    });

    xit('parsing multiple bodies', async () => {
        const string = `boundary
header line1

body1
boundary
header line2

body2
boundary--`;

        const inn = stream.Readable.from(Buffer.from(string))
        const outputStream = new stream.Readable({
            read() {
            }
        })


        const chunk = inn.read();
        const {headers, remainder: r1} = parseHeaders(chunk)
        expect(headers).deep.eq(['header line1'])
        expect(r1.length).eq(45)
        const {remainder: r2} = parseBody(r1, 'boundary', outputStream)
        expect(new TextDecoder().decode(outputStream.read())).deep.eq('body1')
        expect(r2.length).eq(45 - 'body1'.length - 'boundary'.length)
    });
})

function parseBody(chunk: Buffer, boundary: string, outputStream: stream.Readable) {
    let text = '';
    let lastNChars = new Array(boundary.length + 2).fill('x')

    for (let j = 0; j < chunk.length; j++) {
        const byte: string | number = chunk[j];
        const char = typeof byte === 'string' ? byte : String.fromCharCode(byte);
        lastNChars.shift();
        lastNChars.push(char);
        text += char;

        if (lastNChars.slice(2).join('') === boundary) {
            outputStream.push(text.slice(0, text.length - boundary.length - 1))
            return {remainder: chunk.subarray(j + 1)}
        }
    }
    return {remainder: chunk}
}

function parseBoundary(chunk: Buffer, boundary: string): { remainder: Buffer } {
    for (let j = 0; j < boundary.length; j++) {
        const char = typeof chunk[j] === 'string' ? chunk[j] : String.fromCharCode(chunk[j]);
        if (char !== boundary[j]) throw new Error('Uh oh');
    }
    return {remainder: chunk.subarray(boundary.length + 1)}
}

function parseHeaders(chunk: Buffer): { headers: string[], remainder: Buffer } {
    let headers: string[] = []
    let header = '';
    let lastTwo = ['x', 'x'];


    for (let j = 0; j < chunk.length; j++) {
        const byte: string | number = chunk[j];
        const char = typeof byte === 'string' ? byte : String.fromCharCode(byte);
        lastTwo.shift();
        lastTwo.push(char);

        if (lastTwo[0] === '\n' && lastTwo [1] === '\n') {
            headers.push(header.slice(0, -1))
            return {headers, remainder: chunk.subarray(j + 1)}
        }
        if (lastTwo[0] === '\n' && lastTwo [1] !== '\n') {
            headers.push(header.slice(0, -1))
            header = ''
        }
        header += char
    }
    return {headers, remainder: chunk}
}
