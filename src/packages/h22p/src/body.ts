import {BodyType, DictString, HttpMessageBody, isBuffer, isSimpleBody, isStream, MessageBody} from "./interface";
import * as stream from "node:stream";
import {UrlEncodedMessage} from "./urlEncodedMessage";
import {MultipartFormPart} from "./multipartForm";

export class Body {
    static async bytes<B extends HttpMessageBody>(body: MessageBody<B>): Promise<Buffer> {
        if (!body) return Buffer.from([]);
        const isStreamDestroyed = isStream(body) && 'destroyed' in body && body.destroyed;
        if (isStreamDestroyed) {
            console.warn('Stream destroyed so not trying to read body');
            return Buffer.from([]);
        }
        if (isStream(body)) {
            return Buffer.from(await Body.text(body));
        }
        if (isBuffer(body)) {
            return body
        }
        if (typeof body === 'object') return Buffer.from(JSON.stringify(body));
        return Buffer.from(body); // string
    }

    static async text<B extends HttpMessageBody>(body: MessageBody<B>): Promise<string> {
        let text = '';
        if (!body) return text;
        const isStreamDestroyed = isStream(body) && 'destroyed' in body && body.destroyed;
        if (isStreamDestroyed) {
            console.warn('Stream destroyed so not trying to read body');
            return text;
        }
        const textDecoder = new TextDecoder();
        if (isStream(body)) {
            for await (const chunk of body) {
                text += typeof chunk === 'string' ? chunk : textDecoder.decode(chunk);
            }
            return text;
        }
        if (isBuffer(body)) {
            return textDecoder.decode(body as Buffer)
        }
        if (typeof body === 'object') return JSON.stringify(body);
        return body; // string
    }

    static async json<B extends HttpMessageBody>(body: MessageBody<B>): Promise<BodyType<B>> {
        // async-await syntax does not reject with an error if JSON.parse fails, so using explicit Promise syntax
        return new Promise((res, rej) => {
            this.text(body).then(t => {
                res(JSON.parse(t))
            }).catch(e => {
                rej(e);
            });
        })
    }

    static async form(body: MessageBody): Promise<DictString> {
        if (isStream(body)) await new Promise((resolve) => {
            (body! as stream.Readable).once('readable', () => resolve(null));
        })
        const str = await Body.text(body);
        return UrlEncodedMessage.parse(str)
    }

    static async sse<B extends stream.Readable>(body: MessageBody<B>): Promise<AsyncGenerator<ServerSentEvent>> {
        return sseIterator(body);
    }

    static asMultipartForm(
        parts: MultipartFormPart<HttpMessageBody>[],
        boundary: string = '------' + 'MultipartFormBoundary' + this.randomString(10)
    ): HttpMessageBody {
        const outputStream = h22pStream.new();

        processPart(0)

        function processPart(i: number) {
            const part = parts[i];
            const morePartsToProcess = i < (parts.length - 1);
            const isFinalPart = i === parts.length - 1;

            processHeaders();
            processBody();

            function processHeaders() {
                const boundaryAndHeaders = [
                    `--${boundary}`,
                    part.headers.map(h => [
                        h.name === 'content-disposition' ? `${h.name}: form-data;` : `${h.name}:`,
                        'value' in h
                            ? h.value
                            : `${h.filename ? [`name="${h.fieldName}"; filename="${h.filename}"`].join(' ') : `name="${h.fieldName}"`}`
                    ].join(' ')).join('\r\n'),
                    '',
                    ''
                ].join('\r\n');
                outputStream.push(boundaryAndHeaders);
            }

            function processBody() {
                if (isSimpleBody(part.body)) {
                    outputStream.push(part.body);
                    writeEndOrCRLF(isFinalPart);
                    if (morePartsToProcess) processPart(i + 1)
                } else {
                    const readable = part.body! as stream.Readable;
                    readable.on('readable', () => {
                        let chunk;
                        while (null !== (chunk = readable.read())) {
                            outputStream.push(chunk);
                        }
                    });
                    readable.on('end', () => {
                        writeEndOrCRLF(isFinalPart);
                        if (!morePartsToProcess) {
                            return;
                        }
                        processPart(i + 1)
                    })
                }
            }


        }

        function writeEndOrCRLF(isFinalPart: boolean) {
            if (isFinalPart) {
                outputStream.push(`\r\n--${boundary}--`);
                outputStream.push(null);
            } else {
                outputStream.push('\r\n');
            }
        }

        return outputStream
    }

    private static randomString(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let randomString = '';

        for (let i = 0; i < length; i++) {
            randomString += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return randomString;
    }
}

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

export class h22pStream<B extends HttpMessageBody> extends stream.Readable {
    static of<B extends HttpMessageBody>(arg: B): h22pStream<B> {
        const inBrowser = typeof global.window !== 'undefined';

        if (inBrowser) {
            // @ts-ignore
            return createReadableStream(arg)
        } else if (arg instanceof h22pStream) {
            return arg
        } else if (isSimpleBody(arg)) {
            return stream.Readable.from(arg)
        } else if (isStream(arg)) {
            return arg
        } else if (typeof arg === 'object') {
            return stream.Readable.from(JSON.stringify(arg))
        } else {
            return stream.Readable.from([])
        }
    }

    static new() {
        return h22pStream.of(new stream.Readable({
            read() {
            }
        }))
    }
}

export function createReadableStream(arg: HttpMessageBody): ReadableStream<any> {
    return new ReadableStream({
        async start(controller) {
            for await (const value of h22pStream.of(arg)) {
                controller.enqueue(value);
            }
            controller.close();
        }
    });
}

type ServerSentEvent = {
    data: string,
    event?: string, // name of the event
    id?: string, // id of the event
    retry?: number, // retry after time
}

async function* sseIterator(body: stream.Readable): AsyncGenerator<ServerSentEvent> {
    const decoder = new TextDecoder();
    let buffer: string = '';

    for await (const chunk of body) {
        const chunkString = typeof chunk === 'string' ? chunk : decoder.decode(chunk);
        buffer += chunkString;

        const hasOneOrMoreEvent = /\r?\n\r?\n/.exec(buffer) !== null;
        if (hasOneOrMoreEvent) {
            const events: string[] = buffer.split(/\r?\n\r?\n/);
            buffer = events[events.length - 1]
            for (const eventText of events.slice(0, events.length - 1)) {
                const lines = eventText.split(/\r?\n/) ?? [];
                let serverSentEvent: ServerSentEvent = {data: ''};
                let data = [];
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        data.push(line.slice(6));
                    } else if (line.startsWith('event: ')) {
                        serverSentEvent.event = line.slice(7);
                    } else if (line.startsWith('id: ')) {
                        serverSentEvent.id = line.slice(4);
                    } else if (line.startsWith('retry: ')) {
                        serverSentEvent.retry = Number(line.slice(7));
                    }
                }
                serverSentEvent.data = data.join('\n');
                yield serverSentEvent;
            }
        }
    }
}