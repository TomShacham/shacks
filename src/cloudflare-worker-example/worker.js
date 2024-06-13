import {Req} from '../packages/h22p/src/index'

export default {
    // The fetch handler is invoked when this worker receives a HTTP(S) request
    // and should return a Response (optionally wrapped in a Promise)
    async fetch(request, env, ctx) {
        // You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
        const url = new URL(request.url);
        const body = request.body;
        const headers = request.headers;
        const method = request.method;
        let hds = {}
        for (const key of headers.keys()) {
            hds[key] = headers.get(key);
        }
        const req = Req.of({method, uri: url, body, headers: hds})
        console.log(req);

        return new Response('hi');
    }
}