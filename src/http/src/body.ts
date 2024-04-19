import {HttpMessageBody, Req} from "./interface";
import * as stream from "stream";

export class Body {
    static async text(body: HttpMessageBody) {
        let text = '';
        if (!body) return text;
        const textDecoder = new TextDecoder();
        for await (const chunk of body) {
            text += textDecoder.decode(chunk);
        }
        return text;
    }

    static multipartForm(msg: Req): {
        headers: MultipartFormHeader[],
        body: stream.Readable
    } {
        const contentType = msg.headers?.["content-type"];
        if (contentType?.includes('multipart/form-data')) {
            const boundary = /boundary=(?<boundary>(.+))/.exec(contentType)?.groups?.boundary
            const {headers, outputStream} = Body.parseMultipartForm(msg.body! as stream.Readable, '--' + boundary!)
            return {headers, body: outputStream}
        } else {
            return {headers: [], body: stream.Readable.from('')}
        }
    }

    static parseMultipartForm(inputStream: stream.Readable, boundary: string): {
        headers: MultipartFormHeader[],
        outputStream: stream.Readable
    } {
        /**
         * Multipart form parsing
         *   - this is a streaming parser i.e. it can handle receiving the input stream in arbitrarily sized chunks;
         *   the tests around it chop the request payload up into random chunks to ensure this
         *   - there are 3 states: parsing a boundary, a header or the body
         *     - body parsing is just accumulating bytes until we've seen the boundary
         *     - boundary parsing is just checking the first N bytes are that of the boundary supplied in the
         *     Content-Disposition header, where N is the boundary length; we are only in this state at the beginning,
         *     all other boundary parsing is done by checking the last N bytes of the body; ie all boundary parsing
         *     after the first one is done in retrospect rather than presently
         *     - header parsing is CRLF delimited lines that we turn into Content-Disposition or Content-Type
         *     or Content-Transfer-Encoding headers
         *   - boundaries:
         *     - multipart form boundaries start with at least two dashes (--) chrome adds about ten or more
         *     - we have to check if we're at a boundary; there isn't an indication of where they are
         *     because we're streaming potentially large data in multiple parts (that's the whole point!)
         *     although sometimes there is a content-length header, we don't use it
         *     - we keep track of the last N bytes where N is the boundary length (so that we can check if we have
         *     seen the boundary) but for performance instead of checking this every time we see a new byte, instead
         *     we do it whenever we see two dashes (--)
         *   - bodies:
         *     - all we do is add bytes to the body but if we have just seen a boundary then we need to lop off
         *     the last N bytes we just added to the body, because they are the boundary not the body!
         *   - we return "file parts" that represent the headers and body of each part sent in the request
         *     as an intermediate representation, Forms has static methods to make file parts more user friendly≠
         */

        const outputStream = createReadable();
        const chunk = inputStream.read();
        const {remainder: r1, usingCRLF} = parseBoundary(chunk, boundary)
        const {headers, remainder: r2} = parseHeaders(r1)
        // add remainder back to the front of the inputStream
        inputStream.unshift(r2)
        parseBody(inputStream, outputStream, boundary, usingCRLF)
        return {headers, outputStream}
    }

}

export type ContentTypeHeader = {
    name: 'content-type',
    value: ContentTypes
};

export type ContentTransferEncodingHeader = {
    name: 'content-transfer-encoding',
    value: 'base64' | 'binary'
};
export type ContentDispositionHeader = { name: 'content-disposition'; fieldName: string; filename?: string; };
export type MultipartFormHeader = | ContentDispositionHeader | ContentTypeHeader | ContentTransferEncodingHeader
export type MultipartFormPart = | { headers: MultipartFormHeader[]; body: BodyPart; }
export type BodyPart = string | Buffer;
export type FilePart = { headers: MultipartFormHeader[]; body: BodyPart };
export type ContentTypes = | 'text/plain'
    | 'text/html'
    | 'text/css'
    | 'text/xml'
    | 'text/csv'
    | 'image/png'
    | 'image/jpg'
    | 'image/jpeg'
    | 'image/gif'
    | 'image/svg'
    | 'audio/mp4'
    | 'audio/mpeg'
    | 'video/mp4'
    | 'video/mpeg'
    | 'video/quicktime'
    | 'application/pdf'
    | 'application/json'
    | 'application/xml'
    | 'application/javascript'
    | 'application/ms-word'
    | 'application/vns.ms-excel'
    | 'application/octet-stream'
    | 'multipart/mixed'
    | 'multipart/related'
    | 'multipart/alternative';

export class Forms {
    static aFileNamed(fileparts: MultipartFormPart[], fileName: string): MultipartFormPart | undefined {
        return fileparts.find(part => part.headers.some(h => 'filename' in h && 'fieldName' in h && h['fieldName'] === fileName));
    }

    static aFieldNamed(fileparts: MultipartFormPart[], fieldName: string): MultipartFormPart | undefined {
        return fileparts.find(part => part.headers.some(h => 'fieldName' in h && h['fieldName'] === fieldName));
    }

    static partHeader(
        part: MultipartFormPart,
        headerName: 'content-type' | 'content-disposition' | 'content-transfer-encoding'
    ): MultipartFormHeader | undefined {
        if (headerName === 'content-type') {
            return part.headers.find(h => h['name'] === headerName) as ContentTypeHeader | undefined;
        }
        if (headerName === 'content-disposition') {
            return part.headers.find(h => h['name'] === headerName) as ContentDispositionHeader | undefined;
        }
        if (headerName === 'content-transfer-encoding') {
            return part.headers.find(h => h['name'] === headerName) as ContentTransferEncodingHeader | undefined;
        }
    }
}


type MultipartFormHeaderName = 'content-type' | 'content-disposition' | 'content-transfer-encoding';

export function parseBody(inputStream: stream.Readable, outputStream: stream.Readable, boundary: string, usingCRLF: boolean) {
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

                    // return remainder
                    return typeof chunk === 'string'
                        ? chunk.slice(boundary.length)
                        : chunk.subarray(bufferPointer - lastNChars.length - extraToChopOff);
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

export function parseBoundary(chunk: Chunk, boundary: string): { remainder: Chunk, usingCRLF: boolean } {
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

export function parseHeaders(chunk: Chunk): { headers: MultipartFormHeader[], remainder: Chunk } {
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

export function createReadable() {
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