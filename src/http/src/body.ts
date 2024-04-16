import {HttpMessage, HttpMessageBody, Req} from "./interface";
import * as stream from "stream";

export class Body {
    static async text(msg: HttpMessage) {
        let text = '';
        if (!msg.body) return text;
        const textDecoder = new TextDecoder();
        for await (const chunk of msg.body) {
            text += textDecoder.decode(chunk);
        }
        return text;
    }

    static async multipartForm(msg: Req): Promise<MultipartFormPart[]> {
        const contentType = msg.headers?.["content-type"];
        if (contentType?.includes('multipart/form-data')) {
            const boundary = /boundary=(?<boundary>(.+))/.exec(contentType)?.groups?.boundary
            const doubleHyphenPlusBoundary = '--' + boundary!;
            return Body.parseMultipartForm(msg.body!, doubleHyphenPlusBoundary)
        } else {
            return []
        }
    }

    static async parseMultipartForm(bodyStream: HttpMessageBody, boundary: string): Promise<MultipartFormPart[]> {
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
        if (!boundary.startsWith('--')) throw new Error('Boundary must start with --');
        const fileParts: FilePart[] = []
        let i = 0;
        let headers: MultipartFormHeader[] = [];
        let header: string = '';
        let text: string = '';
        let contentType: ContentTypes = 'text/plain'
        // the last 4 bytes are used to see if it is the end of the headers
        let lastFourChars: string[] = ['x', 'x', 'x', 'x'] // start with some dummy chars
        // start by parsing the boundary at the beginning
        let parsingState: 'boundary' | 'headers' | 'body' = 'boundary'
        // lastCharsOfSameLengthAsBoundary is used to check we have just seen a boundary
        //   - it needs to be a bit longer because we understand what's happening after we've seen bytes
        //   ie the last two bytes inform what to do so we need two extra bytes to see back far enough
        let lastCharsOfSameLengthAsBoundary = new Array(boundary.length + 2).fill('x')
        // typically we see CRLF as per the standard
        let delimiter = '\r\n';
        let outputStream = new stream.Duplex()

        for await (const chunk of bodyStream) {
            let mode: 'buffer' | 'string' = 'buffer';
            if (typeof chunk === "string") {
                mode = 'string'
            }
            let buf = Buffer.alloc(chunk.length)
            let bufferPointer = 0;

            for (let j = 0; j < chunk.length; j++) {
                const byte = chunk[j];
                const byteOrChar = mode === 'string' ? byte : String.fromCharCode(byte);
                lastFourChars.shift();
                lastFourChars.push(byteOrChar);
                lastCharsOfSameLengthAsBoundary.shift()
                lastCharsOfSameLengthAsBoundary.push(byteOrChar)

                // when parsing body we don't do anything except add the chars to our body state
                if (parsingState === 'body') {
                    if (isTextContent(contentType)) {
                        text += byteOrChar
                    } else {
                        buf[bufferPointer] = byte;
                        bufferPointer++
                    }
                }
                // if at the end of the boundary then switch to parsing headers
                if (parsingState === 'boundary' && i === boundary.length) {
                    parsingState = 'headers'
                }

                // parse initial boundary
                if (parsingState === 'boundary') {
                    if (!(byteOrChar === boundary[i])) {
                        throw new Error(`Expected boundary to match boundary value in content disposition header`)
                    }
                }

                // if at end of headers then switch to parsing body
                const endOfHeaders = (parsingState === 'headers' && lastFourChars[2] === '\n' && lastFourChars[3] === '\n')
                    || (parsingState === 'headers' && lastFourChars[0] === '\r' && lastFourChars[1] === '\n' && lastFourChars[2] === '\r' && lastFourChars[3] === '\n');
                if (endOfHeaders) {
                    const contentTypeHeader = getHeader(headers, 'content-type') as ContentTypeHeader | undefined;
                    contentType = contentTypeFromText(contentTypeHeader?.value);
                    parsingState = 'body'
                }
                // if we've seen two hyphens then start countdown to checking the boundary soon
                const shouldCheckBoundary = lastCharsOfSameLengthAsBoundary.some((value, index) => {
                    return (lastCharsOfSameLengthAsBoundary[index] + lastCharsOfSameLengthAsBoundary[index + 1]) === '--'
                })
                if (parsingState === 'body' && shouldCheckBoundary) {
                    // chop off the extra 2 bytes in our history buffer (that's how many bytes we had to see to decide to come here)
                    const seenBoundary = boundary.split('').every((c, index) => c === lastCharsOfSameLengthAsBoundary[index]);
                    // if it is the boundary then make the file part
                    if (seenBoundary) {
                        // if we see only a \n at the end of the boundary, then we are using LF only; not CRLF;
                        if (lastCharsOfSameLengthAsBoundary[lastCharsOfSameLengthAsBoundary.length - 2] === '\n') {
                            delimiter = '\n';
                        }
                        const extraToChopOff = delimiter.length
                        if (isTextContent(contentType)) {
                            text = text.slice(0, text.length - lastCharsOfSameLengthAsBoundary.length - extraToChopOff)
                            fileParts.push({headers, body: text})
                        } else {
                            buf = buf.subarray(0, bufferPointer - lastCharsOfSameLengthAsBoundary.length - extraToChopOff)
                            fileParts.push({headers, body: buf})
                        }
                        headers = [];
                        text = '';
                        buf = Buffer.alloc(chunk.length);
                        bufferPointer = 0;
                        parsingState = 'headers'
                    }
                }

                if (parsingState === 'headers') {
                    if (byteOrChar !== '\n') {
                        header += byteOrChar;
                    } else {
                        if (header !== '') {
                            const parsed = parseHeader(header)
                            if (parsed) headers.push(parsed)
                        }
                        header = '';
                    }
                }
                i++
            }
        }

        return fileParts;
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

function getHeader(headers: MultipartFormHeader[], headerName: MultipartFormHeaderName): MultipartFormHeader | undefined {
    return headers.find(h => h.name === headerName);
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

function isTextContent(contentType: ContentTypes): boolean {
    return contentType.startsWith('text/')
        || contentType === 'application/json'
        || contentType === 'application/javascript';
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
