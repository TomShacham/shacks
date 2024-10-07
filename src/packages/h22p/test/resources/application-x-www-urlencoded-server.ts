import {Body, HttpRequest, HttpResponse, Res} from "../../src";
import {httpServer} from "@shacks/h22p-node";

async function applicationXWwwUrlencodedServer() {
    const {server, close} = await httpServer({
        async handle(req: HttpRequest): Promise<HttpResponse> {
            if (req.method === 'POST') {
                const body = await Body.form(req.body);
                return Res.ok({body, headers: {"content-type": "text/html; charset=utf-8"}})
            }
            if (req.method === 'GET') {
                return Res.of({body: html(), status: 200, headers: {"content-type": "text/html; charset=utf-8"}})
            } else {
                return Res.of({body: '', status: 302, headers: {"Location": "/file"}})
            }
        }
    }, 3000, '127.0.0.1');
}

function html() {
    return `
<html>
    <p>combo of simple field and a file</p>
    <form enctype="application/x-www-form-urlencoded" action="/path" method="post">
        <input type="text" id="name" name="name" placeholder="name..." />
        <input type="text" id="pic" name="pic" />
        <input type="submit" value="submit" formaction="/path"/>    
    </form>
</html>
`;
}

applicationXWwwUrlencodedServer();
