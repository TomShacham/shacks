import {httpServer} from "../../src/server";
import {get, h22p, HttpRequest, HttpResponse, post, URI} from "../../src";
import {openApiSpecFrom} from "../../src/openapi";


async function openApiSwaggerServer() {
    const {server, close, port} = await httpServer({
        async handle(req: HttpRequest): Promise<HttpResponse> {
            const uri = URI.parse(req.uri);
            if (uri.path === '/api/v3/openapi.json') {
                const spec = openApiSpecFrom(routes() as any, {
                    server: {description: 'some description', url: 'http://localhost:3000'},
                    apiVersion: '0.0.0',
                    description: 'my test openapi server',
                    title: 'h22p Openapi Spec'
                });
                return h22p.response({body: spec, status: 200})
            } else {
                return h22p.response({body: html(), status: 200})
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
        getUser: get('/users/{userId}?name', {
                handle: async (req) => {
                    const u = req.uri
                    if (u.length > 5) {
                        return h22p.ok({body: 'hello, world'})
                    } else {
                        return h22p.notFound();
                    }
                }
            }, {"content-type": "text/plain"} as const,
            [
                h22p.ok({body: 'hello, world', headers: {"content-type": "text/plain"}}),
                h22p.notFound({headers: {"content-type": "text/plain"}}),
            ]),
        postUser: post('/users/{userId}/*', {
                foo: 'bar',
                gov: {st: "downing", info: {occupied: true, no: 10, who: 'dishy'}}
            }, {
                handle: async (req) => {
                    const u = req.uri
                    if (u.length > 5) {
                        return h22p.created({body: {user: {name: 'tom', worksAt: 'Evil Corp'}}})
                    } else {
                        return h22p.notFound();
                    }
                }
            }, {"content-type": "application/json"} as const,
            [
                h22p.created({
                    body: {user: {name: 'tom', worksAt: 'Evil Corp'}},
                    headers: {"content-type": "application/json"},
                }),
                h22p.notFound({headers: {"content-type": "text/plain"}}),
            ]),
        getUserAccount: get('/users/{userId}/account/{accountId}?name&accountType', {
                handle: async (req) => {
                    const u = req.uri
                    if (u.length > 5) {
                        return h22p.ok({body: 'hello, world'})
                    } else {
                        return h22p.notFound();
                    }
                }
            }, {"content-type": "text/plain"} as const,
            // TODO why does it care about the Body type but not the Headers or Status ??
            //   it doesnt seem to care about Body type either now ;D
            [
                h22p.ok({body: 'hello, world', headers: {"content-type": "text/plain"}}),
                h22p.notFound({headers: {"content-type": "text/plain"}}),
            ]),
    }
}
