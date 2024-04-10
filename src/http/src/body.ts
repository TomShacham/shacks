import {HttpMessage, HttpMessageBody, Req} from "./interface";

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

    static async multipartForm(msg: Req) {
        const contentType = msg.headers?.["content-type"];
        if (contentType?.includes('multipart/form-data')) {
            const boundary = /boundary=(?<boundary>(.+))/.exec(contentType)?.groups?.boundary
            const doubleHyphenPlusBoundary = '--' + boundary!;
            return Body.parseMultipartForm(msg.body!, doubleHyphenPlusBoundary)
        } else {
            return Body.text(msg)
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
         *     after the first one is done in retrospect rather than explicitly
         *     - header parsing is CRLF delimited lines that we turn into Content-Disposition or Content-Type headers
         *   - boundaries:
         *     - multipart form boundaries start with two dashes (--)
         *     - we have to check if we're at a boundary; there isn't an indication of where they are
         *     because we're streaming potentially large data in multiple parts (that's the whole point!)
         *     - we keep track of the last N bytes where N is the boundary length (so that we can check if we have
         *     seen the boundary) but for performance instead of checking this every time we see a new byte, instead
         *     we set a countdown to do the check in N-2 bytes time, whenever we see two dashes (--)
         *   - bodies:
         *     - all we do is add bytes to the body but if we have just seen a boundary then we need to lop off
         *     the N bytes we just added to the body, because they are the boundary not the body!
         *   - we return "file parts" that represent the headers and body of each part sent in the request
         */
        if (!boundary.startsWith('--')) throw new Error('Boundary must start with --');

        const fileParts: { headers: MultipartFormHeader[]; body: string }[] = []
        let i = 0;
        let headers: MultipartFormHeader[] = [];
        let header: string = '';
        let body: string = '';
        let bodyEnd = boundary + '\r\n';

        // the last 4 bytes are used to see if it is the end of the headers
        let lastFourChars: string[] = ['x', 'x', 'x', 'x'] // start with some dummy chars
        // start by parsing the boundary at the beginning
        let parsingState: 'boundary' | 'headers' | 'body' = 'boundary'

        // lastCharsOfSameLengthAsBoundary is used to check we have just seen a boundary
        //   - it needs to be a bit longer because we understand what's happening after we've seen bytes
        //   ie the last two bytes inform what to do so we need two extra bytes to see back far enough
        let lastCharsOfSameLengthAsBoundary = new Array(boundary.length + 2).fill('x')
        // countdownToCheckBoundary is used to check the boundary whenever we see 2 dashes (--)
        //   - as we read the body byte by byte, we need to check at some point if we've already read a boundary
        //   (as opposed to just some bytes that look like the boundary) but instead of doing this check every time we
        //   see a new byte, we just do it if we've seen two hyphens (all boundaries start with --)
        let countdownToCheckBoundary = -1;
        // typically we see CRLF as per the standard
        let delimiter = '\r\n';

        function parseHeader(str: string): MultipartFormHeader | undefined {
            const [headerName, value] = str.split(':');
            if (headerName.toLowerCase() === 'content-disposition') {
                // regex is a bit slow but means the header value can be a bit more flexible with its syntax
                const nameRegex = /name="(?<name>([^"]+))/.exec(value);
                const filenameRegex = /filename="(?<filename>([^"]+))/.exec(value);
                // blow up if there's no name
                const name = nameRegex!.groups!.name
                const filename = filenameRegex?.groups?.filename
                return {headerName: 'content-disposition', fieldName: name, ...(filename ? {filename} : {})};
            }
            if (headerName.toLowerCase() === 'content-type') {
                return {headerName: "content-type", value: value.trim()}
            }
        }

        for await (const chunk of bodyStream) {
            const string = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);

            for (let j = 0; j < string.length; j++) {
                const char = string[j];
                lastFourChars.shift();
                lastFourChars.push(char);
                lastCharsOfSameLengthAsBoundary.shift()
                lastCharsOfSameLengthAsBoundary.push(char)
                countdownToCheckBoundary--;

                // when parsing body we don't do anything except add the chars to our body state
                if (parsingState === 'body') {
                    body += char
                }
                // if at the end of the boundary then switch to parsing headers
                if (parsingState === 'boundary' && i === boundary.length) {
                    parsingState = 'headers'
                }

                // parse initial boundary
                if (parsingState === 'boundary') {
                    if (!(char === boundary[i])) {
                        throw new Error(`Expected boundary to match boundary value in content disposition header`)
                    }
                }

                // if at end of headers then switch to parsing body
                const endOfHeaders = (parsingState === 'headers' && lastFourChars[2] === '\n' && lastFourChars[3] === '\n')
                    || (parsingState === 'headers' && lastFourChars[0] === '\r' && lastFourChars[1] === '\n' && lastFourChars[2] === '\r' && lastFourChars[3] === '\n');
                if (endOfHeaders) {
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
                        body = body.slice(0, body.length - lastCharsOfSameLengthAsBoundary.length - extraToChopOff)
                        fileParts.push({headers, body})
                        headers = [];
                        body = '';
                        parsingState = 'headers'
                    }
                }

                if (parsingState === 'headers') {
                    if (char !== '\n') {
                        header += char;
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

export type MultipartFormHeader =
    | { headerName: 'content-disposition'; fieldName: string; filename?: string; }
    | { headerName: 'content-type', value: 'text/plain' | string }
export type MultipartFormPart = | { headers: MultipartFormHeader[]; body: string; }
