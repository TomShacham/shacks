import {HttpMessageBody, Req} from "./interface";
import * as stream from "stream";

type MultipartFormPart = {
    headers: MultipartFormHeader[],
    body: stream.Readable
};

export class Body {
    static async text(body: HttpMessageBody) {
        let text = '';
        if (!body) return text;
        if (body instanceof stream.Readable && body.destroyed) {
            console.warn('Stream destroyed so not trying to read body');
            return text;
        }
        const textDecoder = new TextDecoder();
        for await (const chunk of body) {
            text += textDecoder.decode(chunk);
        }
        return text;
    }

    static async json(body: HttpMessageBody) {
        return JSON.parse(await this.text(body));
    }
}

export class MultipartForm {
    static async multipartFormField(
        msg: Req,
        options: MultipartOptions = {maxHeadersSizeBytes: 2048}
    ): Promise<MultipartFormPart> {
        const contentType = msg.headers?.["content-type"];
        if (contentType?.includes('multipart/form-data')) {
            await new Promise((resolve) => {
                (msg.body! as stream.Readable).once('readable', () => resolve(null));
            })
            const {headers, body} = await MultipartForm.parsePart(msg, options.maxHeadersSizeBytes)
            return {headers, body: body}
        } else {
            return {headers: [], body: stream.Readable.from('')}
        }
    }

    static fieldName(headers: MultipartFormHeader[]): string | undefined {
        return (headers.find(h => h.name === 'content-disposition') as ContentDispositionHeader)?.fieldName;
    }

    static fileName(headers: MultipartFormHeader[]): string | undefined {
        return (headers.find(h => h.name === 'content-disposition') as ContentDispositionHeader)?.filename;
    }

    static contentType(headers: MultipartFormHeader[]): string | undefined {
        return (headers.find(h => h.name === 'content-type') as ContentTypeHeader)?.value;
    }

    static contentEncoding(headers: MultipartFormHeader[]): string | undefined {
        return (headers.find(h => h.name === 'content-transfer-encoding') as ContentTransferEncodingHeader)?.value;
    }

    private static async parsePart(msg: Req, maxHeadersSizeBytes: number): Promise<MultipartFormPart> {
        /**
         * Multipart form parsing
         *
         *     Returns headers immediately; and an outputStream that you can "for await"
         *       we don't await parseBody otherwise we'd block until the inputStream is fully read
         *
         *     - each parse function returns the remainder of the Buffer that wasn't needed to be read
         *       - the boundary parser just throws if the boundary doesn't match
         *       - the header parser turns the headers into JSON;
         *         - content-type, content-disposition and content-transfer-encoding
         *       - the body parser just writes chunks to the outputStream until it sees a boundary
         *         - if it sees the final boundary (two extra dashes at the end) then it pushes null to end the stream
         */
        const contentType = msg.headers?.["content-type"];
        const boundary = /boundary=(?<boundary>(.+))/.exec(contentType!)?.groups?.boundary
        const withHyphens = '--' + boundary;
        const inputStream = msg.body! as stream.Readable;
        const outputStream = createReadable();
        outputStream.once('error', (e) => {
            console.error(e);
            outputStream.destroy();
        });
        const chunk = inputStream.read();
        const {remainder: r1, usingCRLF} = MultipartForm.parseBoundary(chunk, withHyphens)
        const {
            headers,
            remainder: r2
        } = MultipartForm.parseHeaders(r1, maxHeadersSizeBytes)
        inputStream.unshift(r2) // add remainder back to the front of the inputStream
        // don't await or else we cannot stream the output on the consumer side
        MultipartForm.parseBody(inputStream, outputStream, withHyphens, usingCRLF);
        return {headers, body: outputStream}
    }

    private static async parseBody(
        inputStream: stream.Readable,
        outputStream: stream.Readable,
        boundary: string,
        usingCRLF: boolean): Promise<null> {
        let text: string = '';
        //  used to check we have just seen a boundary
        let lastNChars = new Array(boundary.length + 2).fill('x')
        // typically we see CRLF as per the standard
        let delimiter = usingCRLF ? '\r\n' : '\n';

        for await (const chunk of inputStream.iterator({destroyOnReturn: false})) {
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

                        // return remainder including boundary we've just seen so that we can rinse and repeat
                        const remainder = typeof chunk === 'string'
                            ? chunk.slice(j - boundary.length - 1)
                            : chunk.subarray(bufferPointer - boundary.length - 2);

                        if (!isFinalBoundary) {
                            inputStream.unshift(remainder)
                        }

                        return null;
                    }
                }

                const endOfChunk = j === chunk.length - 1;
                if (endOfChunk) {
                    if (typeof byte === 'string') {
                        outputStream.push(text)
                        outputStream.emit('data', text);
                    } else {
                        buf = buf.subarray(0, bufferPointer)
                        outputStream.push(buf)
                        outputStream.emit('data', buf);
                    }
                }
            }
        }
        // finally push null as there is nothing more to read from input
        outputStream.push(null)
        return null;
    }

    private static parseBoundary(chunk: Chunk, boundary: string): { remainder: Chunk, usingCRLF: boolean } {
        for (let j = 0; j < boundary.length; j++) {
            const char = typeof chunk[j] === 'string' ? chunk[j] : String.fromCharCode(chunk[j] as number);
            if (char !== boundary[j])
                throw new Error('Boundary has not matched expected boundary given in content type header');
        }
        const usingCRLF = chunk[boundary.length] === 13 || chunk[boundary.length] === '\r';
        const skip = usingCRLF ? 2 : 1;
        const remainder = typeof chunk === 'string'
            ? chunk.slice(boundary.length + skip)
            : chunk.subarray(boundary.length + skip);
        return {remainder, usingCRLF}
    }

    private static parseHeaders(chunk: Chunk, maxHeadersSizeBytes: number): {
        headers: MultipartFormHeader[];
        remainder: Chunk
    } {
        let headers: MultipartFormHeader[] = []
        let header = '';
        let lastFour = ['x', 'x', 'x', 'x'];


        for (let j = 0; j < chunk.length; j++) {
            if (j > maxHeadersSizeBytes) throw new Error(`Max header size of ${maxHeadersSizeBytes} bytes exceeded`)
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
}

type MultipartOptions = {
    maxHeadersSizeBytes: number;
};

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
    | 'application/zip'
    | 'application/pdf'
    | 'application/json'
    | 'application/xml'
    | 'application/javascript'
    | 'application/ms-word'
    | 'application/vns.ms-excel'
    | 'application/octet-stream'
    | 'multipart/mixed'
    | 'multipart/related'
    | 'multipart/alternative'
    | string;


type Chunk = Buffer | string;

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
        return {name: "content-type", value: trim}
    }
    if (headerName.toLowerCase() === 'content-transfer-encoding') {
        return {name: "content-transfer-encoding", value: value.trim() === 'base64' ? 'base64' : 'binary'};
    }
}

export function fieldName(headers: MultipartFormHeader[]): string | undefined {
    return (headers.find(h => h.name === 'content-disposition') as ContentDispositionHeader)?.fieldName;
}

export function fileName(headers: MultipartFormHeader[]): string | undefined {
    return (headers.find(h => h.name === 'content-disposition') as ContentDispositionHeader)?.filename;
}

export function contentType(headers: MultipartFormHeader[]): string | undefined {
    return (headers.find(h => h.name === 'content-type') as ContentTypeHeader)?.value;
}