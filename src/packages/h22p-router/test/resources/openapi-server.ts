import {HttpRequest, HttpResponse, Res, URI} from "@shacks/h22p";
import {httpServer} from "../../../h22p-node/src";
import {OpenApi, Route} from "../../src";


async function openApiSwaggerServer() {
    const {server, close, port} = await httpServer({
        async handle(req: HttpRequest): Promise<HttpResponse> {
            const uri = URI.parse(req.uri);
            if (uri.path === '/api/v3/openapi.json') {
                const spec = OpenApi.specFrom(routes() as any, {
                    server: {description: 'some description', url: 'http://localhost:3000'},
                    apiVersion: '0.0.0',
                    description: 'my test openapi server',
                    title: 'h22p Openapi Spec'
                });
                return Res.of({body: spec, status: 200})
            } else {
                return Res.of({body: html(), status: 200})
            }
        }
    }, 3000, '127.0.0.1');

    function html() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="SwaggerUI" />
  <title>SwaggerUI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
<script>
  window.onload = () => {
    window.ui = SwaggerUIBundle({
      url: 'http://localhost:${port}/api/v3/openapi.json',
      dom_id: '#swagger-ui',
    });
  };
</script>
</body>
</html>
`;
    }

}


openApiSwaggerServer();

function routes() {
    return {
        getUser: Route.get('/users/{userId}?name', async (req) => {
                if (Math.random() > 0.5) {
                    return Res.ok({body: 'hello, world'})
                } else {
                    return Res.notFound();
                }
            }, {"content-type": "text/plain"} as const,
            [
                Res.ok({body: 'hello, world', headers: {"content-type": "text/plain"}}),
                Res.notFound({headers: {"content-type": "text/plain"}}),
            ]),
        postUser: Route.post('/users/{userId}/*', {
                foo: 'bar',
                gov: {st: "downing", info: {occupied: true, no: 10, who: 'dishy'}}
            }, async (req) => {
                if (Math.random() > 0.5) {
                    return Res.created({body: {user: {name: 'tom', worksAt: 'Evil Corp'}}})
                } else {
                    return Res.notFound();
                }
            }, {"content-type": "application/json"} as const,
            [
                Res.created({
                    body: {user: {name: 'tom', worksAt: 'Evil Corp'}},
                    headers: {"content-type": "application/json"},
                }),
                Res.notFound({headers: {"content-type": "text/plain"}}),
            ]),
        getUserAccount: Route.get('/users/{userId}/account/{accountId}?name&accountType', async (req) => {
                if (Math.random() > 0.5) {
                    return Res.ok({body: 'hello, world'})
                } else {
                    return Res.notFound();
                }
            }, {"content-type": "text/plain"} as const,
            [
                Res.ok({body: 'hello, world', headers: {"content-type": "text/plain"}}),
                Res.notFound({headers: {"content-type": "text/plain"}}),
            ]),
    }
}
