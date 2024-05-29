import {httpServer} from "../../src/server";
import {h22p, HttpRequest, HttpResponse, URI} from "../../src";
import * as fs from 'fs';

async function browserTestServer() {
    const {server, close, port} = await httpServer({
        async handle(req: HttpRequest): Promise<HttpResponse> {
            const uri = URI.parse(req.uri);
            if (uri.path === '/src/packages/h22p/bun/index.js') {
                const body = fs.readFileSync('./src/packages/h22p/bun/index.js', 'utf-8');
                return h22p.ok({
                    body: body,
                    headers: {'content-type': 'text/javascript'}
                })
            } else if (uri.path === '/data') {
                return h22p.ok({body: {api: 'response'}})
            } else {
                return h22p.ok({body: html()})
            }
        }
    }, 3000, '127.0.0.1');

    function html() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Test h22p in the browser</title>
    <script type="module" src="./src/packages/h22p/bun/index.js">
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
