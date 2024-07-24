import {HttpRequest, HttpResponse, Res, URI} from "../../h22p";
import fs from "fs";
import {httpServer} from "../../h22p-node/src";

export async function browserTestServer(desiredPort: number) {
    const {server, close, port} = await httpServer({
        async handle(req: HttpRequest): Promise<HttpResponse> {
            const bunDir = './src/packages/test-shared/browser/bun';
            const uri = URI.parse(req.uri);
            if (uri.path === '/index.js') {
                const h22pBrowserModule = fs.readFileSync(`${bunDir}/index.js`, 'utf-8');
                return Res.ok({
                    body: h22pBrowserModule,
                    headers: {'content-type': 'text/javascript'}
                })
            } else if (uri.path === '/test-app.js') {
                const testAppModule = fs.readFileSync(`${bunDir}/test-app.js`, 'utf-8');
                return Res.ok({
                    body: testAppModule,
                    headers: {'content-type': 'text/javascript'}
                })
            } else if (uri.path === '/data') {
                return Res.ok({body: {some: "data"}})
            } else {
                return Res.ok({body: html()})
            }
        }
    }, desiredPort, '127.0.0.1');

    function html() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Test h22p in the browser</title>
    <script type="module" src="./index.js"> </script>
    <script type="module" src="./test-app.js"> </script>
</head>
<body>
</body>
</html>
`;
    }

    return {port, close}
}