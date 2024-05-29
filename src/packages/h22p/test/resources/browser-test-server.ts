import {httpServer} from "../../src/server";
import * as fs from 'fs';
import {HttpRequest, HttpResponse, Res, URI} from "../../src";

async function browserTestServer() {
    const {server, close, port} = await httpServer({
        async handle(req: HttpRequest): Promise<HttpResponse> {
            const uri = URI.parse(req.uri);
            if (uri.path === '/src/packages/h22p/bun/browser-index.js') {
                const body = fs.readFileSync('./src/packages/h22p/bun/browser-index.js', 'utf-8');
                return Res.ok({
                    body: body,
                    headers: {'content-type': 'text/javascript'}
                })
            } else if (uri.path === '/data') {
                return Res.ok({body: {api: 'response'}})
            } else {
                return Res.ok({body: html()})
            }
        }
    }, 3000, '127.0.0.1');

    function html() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Test h22p in the browser</title>
    <script type="module" src="./src/packages/h22p/bun/browser-index.js">
        {
            "imports": {
                "h22p": "./index.js"
           }
        }
    </script>
</head>
<body>
</body>
</html>
`;
    }

}


browserTestServer();
