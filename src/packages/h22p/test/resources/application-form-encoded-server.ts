import {httpServer} from "../../src/server";
import {Body, h22p, HttpRequest, HttpResponse} from "../../src";

async function applicationFormEncodedServer() {
    const {server, close} = await httpServer({
        async handle(req: HttpRequest): Promise<HttpResponse> {
            if (req.method === 'POST') {
                const body = await Body.form(req);
                return h22p.ok({body})
            }
            if (req.method === 'GET') {
                return h22p.response({body: html(), status: 200})
            } else {
                return h22p.response({body: '', status: 302, headers: {"Location": "/file"}})
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

applicationFormEncodedServer();
