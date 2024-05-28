import {h22p, HttpHandler, HttpRequest, HttpResponse} from "./interface";
import {URI} from "./uri";
import {h22pStream} from "./body";
import stream from "stream";

export class FetchClient implements HttpHandler {
    constructor(public baseUrl: string = '') {
    }

    handle(req: HttpRequest): Promise<HttpResponse> {
        const parsedUri = URI.parse(this.baseUrl + req.uri)
        const body = req.body === undefined ? undefined
            : new ReadableStream({
                async start(controller) {
                    for await (const value of h22pStream.of(req.body)) {
                        controller.enqueue(value);
                    }
                    controller.close();
                }
            })

        /*
            Fetch does not like you setting "transfer-encoding: chunked" yourself, it blows up!
            https://github.com/vercel/next.js/issues/48214
         */

        if (req.headers['transfer-encoding'] === 'chunked') {
            delete req.headers['transfer-encoding']
        }

        return fetch(
            `${this.baseUrl}${req.uri}`,
            {
                headers: req.headers as Record<string, string>,
                body,
                method: req.method,
                redirect: "follow",
                // @ts-ignore
                duplex: "half"
            })
            .then(res => {
                const responseBody = this.convertBodyToNodeReadableStream(res);
                const resHeaders: { [key: string]: string } = {};
                for (const [name, value] of res.headers.entries()) {
                    resHeaders[name] = value;
                }
                return h22p.response({
                    body: responseBody,
                    headers: resHeaders,
                    status: res.status,
                    statusText: res.statusText
                })
            })
    }

    private convertBodyToNodeReadableStream(res: Response): stream.Readable {
        return res.body === null
            ? h22pStream.of(undefined) :
            stream.Readable.from(res.body as unknown as AsyncIterable<Uint8Array>)
    }
}

/*
    This here is a polyfill to enable the conversion of a fetch ReadableStream to a node Readable stream
    Not all browsers have implemented the response body as an AsyncIterator so here we are
    https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/65542#discussioncomment-6071004
 */
// @ts-ignore
ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader()
    try {
        while (true) {
            const {done, value} = await reader.read()
            if (done) return
            yield value
        }
    } finally {
        reader.releaseLock()
    }
}