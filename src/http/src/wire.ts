import {HttpMessage, HttpMessageBody, Req} from "./interface";

export class Wire {
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
            return Wire.parseMultipartForm(msg.body!, doubleHyphenPlusBoundary)
        }
    }

    static async parseMultipartForm(bodyStream: HttpMessageBody, boundary: string): Promise<MultipartFormPart[]> {
        const fileParts: { headers: MultipartFormHeader[]; body: string }[] = []
        let i = 0;
        let headers: MultipartFormHeader[] = [];
        let header: string = '';
        let body: string = '';

        // needed to check whether to switch into parsing body
        let lastFourChars: string[] = ['x', 'x', 'x', 'x'] // start with some dummy chars
        let parsingState: 'boundary' | 'headers' | 'body' = 'boundary'

        // needs to be a bit longer because we understand what's happening after we've seen bytes
        // ie the last two bytes inform what to do so we need two extra bytes to see back far enough
        let lastCharsOfSameLengthAsBoundary = new Array(boundary.length + 2).fill('x')
        // as we read the body char by char, we need to check at some point if we've read the next boundary
        // as opposed to just some bytes that look like the boundary. but instead of doing this check all the time
        // we just do it if we've seen some hyphens (all boundaries start with --)
        let countdownToCheckBoundary = -1;

        function parseHeader(str: string): MultipartFormHeader | undefined {
            const [headerName, value] = str.split(':');
            if (headerName.toLowerCase() === 'content-disposition') {
                // regex is a bit slow but means the header value can be a bit more flexible with its syntax
                const nameRegex = /name="(?<name>([^"]+))/.exec(value);
                const filenameRegex = /filename="(?<filename>([^"]+))/.exec(value);
                // blow up if there's no name
                const name = nameRegex!.groups!.name
                const filename = filenameRegex?.groups?.filename
                return {type: 'content-disposition', name, ...(filename ? {filename} : {})};
            }
            if (headerName.toLowerCase() === 'content-type') {
                return {type: "content-type", value: value.trim()}
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
                // if at end of headers then switch to parsing body
                const endOfHeaders = (parsingState === 'headers' && lastFourChars[2] === '\n' && lastFourChars[3] === '\n')
                    || (parsingState === 'headers' && lastFourChars[0] === '\r' && lastFourChars[1] === '\n' && lastFourChars[2] === '\r' && lastFourChars[3] === '\n');
                if (endOfHeaders) {
                    parsingState = 'body'
                }
                // if we've seen two hyphens then start countdown to checking the boundary soon
                const possibleBoundaryComingIn = parsingState === 'body' && lastFourChars[2] === '-' && lastFourChars[3] === '-';
                if (possibleBoundaryComingIn) {
                    countdownToCheckBoundary = boundary.length - 4
                }
                const shouldCheckBoundary = countdownToCheckBoundary === 0;
                if (shouldCheckBoundary) {
                    // chop off the extra 2 bytes in our history buffer (that's how many bytes we had to see to decide to come here)
                    const relevantPast = lastCharsOfSameLengthAsBoundary.slice(0, lastCharsOfSameLengthAsBoundary.length - 2);
                    const seenBoundary = relevantPast.every((c, index) => c === boundary[index]);
                    // if it is the boundary then make the file part
                    if (seenBoundary) {
                        // chop off the boundary that we've added to the body and reset our state
                        // plus the newline at the end of the body (plus \r maybe)
                        const extraToChopOff = lastCharsOfSameLengthAsBoundary[lastCharsOfSameLengthAsBoundary.length - 2] === '\r' ? -2 : -1
                        body = body.slice(0, body.length - lastCharsOfSameLengthAsBoundary.length + extraToChopOff)
                        fileParts.push({headers, body})
                        headers = [];
                        body = '';
                        parsingState = 'headers'
                    }
                }

                // parse initial boundary
                if (parsingState === 'boundary') {
                    if (!(char === boundary[i])) {
                        throw new Error(`Expected boundary at the start of body to match boundary value in content disposition header`)
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
        // chop off the final boundary
        // (the final boundary has two extra dashes and two newlines)
        const extraToChopOff = lastCharsOfSameLengthAsBoundary[lastCharsOfSameLengthAsBoundary.length - 2] === '\r' ? -1 : 0
        body = body.slice(0, body.length - boundary.length - 5 + extraToChopOff)
        fileParts.push({headers, body});
        return fileParts;
    }
}

export type MultipartFormHeader =
    | { type: 'content-disposition'; name: string; filename?: string; }
    | { type: 'content-type', value: 'text/plain' | string }
export type MultipartFormPart = | { headers: MultipartFormHeader[]; body: string; }
