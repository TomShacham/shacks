import {expect} from "chai";
import {
    Body,
    get,
    h22p,
    h22pStream,
    HttpMessageBody,
    HttpResponse,
    JsonObject,
    OpenapiResponse,
    post,
    router
} from "../src";
import stream from "stream";
import {doesNotTypeCheck} from "./helpers";

// todo put, patch etc
//  - some good name for them? put them in h22p.static ?
//  open api docs based off routes
//    - how do we do responses :S
//  move the old router tests over still some edge cases to test
//    - like matching on headers and query exactly if they're supplied;
//    - should body parameter be optional because we aren't matching on it; or should we match on it ?


describe('test', () => {
    describe('type-safe routing', () => {
        const routes = {
            getResource: get('/resource/{id}/sub/{subId}?q1&q2', {
                handle: async (req) => {
                    try {
                        const s = await Body.json(req.body);
                        // @ts-expect-error - there is no .foo on undefined body
                        s.foo
                    } catch (e) {
                        // SyntaxError: Unexpected end of JSON input
                    }
                    return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
                }
            }, {"content-type": "text/csv"} as const),
            postJsonResource: post('/resource/{id}', {foo: {baz: 'json'}}, {
                handle: async (req) => {
                    const s = await Body.json(req.body);
                    s.foo.baz
                    return {status: 200, body: {quux: 'json'}, headers: {}}
                }
            }),
            postStringResource: post('/resource/{id}', '', {
                handle: async (req) => {
                    const s = await Body.text(req.body);
                    s.slice
                    return {status: 200, body: 'some response string', headers: {}}
                }
            }),
            postStreamResource: post('/resource/{id}', stream.Readable.from(''), {
                handle: async (req) => {
                    const s = await Body.json(req.body);
                    // @ts-expect-error - I can't preserve a stream type and an h22pStream type cos theyre both stream.Readable ;(
                    s.read

                    return {status: 200, body: stream.Readable.from('123'), headers: {}}
                }
            }),
            postH22pStreamResource: post('/resource/{id}', h22pStream.of({"a": 123}), {
                handle: async (req) => {
                    const s = await Body.json(req.body);
                    s.a

                    return {status: 200, body: stream.Readable.from('123'), headers: {}}
                }
            }),
        };

        it('handle an in-memory type-safe request and response', async () => {
            const response = await routes.getResource.handler.handle({
                method: 'GET',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                body: undefined,
                headers: {"content-type": "text/csv"},
            });
            response.body.bar
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo

            // status comes through exactly typed i.e. 200
            // typeChecks(true as (typeof response.status extends 200 ? true : false));
            doesNotTypeCheck(false as (typeof response.status extends 201 ? true : false));

            response.headers.foo
            // @ts-expect-error -- foo does not exist on type body
            response.headers.bar
        })

        it('build a type-safe request', async () => {
            const typeSafeRequest = routes.getResource.request(
                'GET',
                '/resource/123/sub/456?q1=v1&q2=v2',
                undefined,
                {"content-type": "text/csv"}
            );
            expect(typeSafeRequest).deep.eq({
                "body": undefined,
                "headers": {
                    "content-type": "text/csv",
                },
                "method": "GET",
                "uri": "/resource/123/sub/456?q1=v1&q2=v2"
            })

            /*
                --- expect errors in the below to prove we are type-safe ---
             */

            const wrongPathProvided = routes.getResource.request(
                'GET',
                // @ts-expect-error
                '/resource/123/sub?q1=v1&q2=v2',
                undefined,
                {"content-type": "text/csv"}
            );
            const noQueryProvided = routes.getResource.request(
                'GET',
                // @ts-expect-error
                '/resource/123/sub/456',
                undefined,
                {"content-type": "text/csv"}
            );
            const wrongMethod = routes.getResource.request(
                // @ts-expect-error
                'POST',
                '/resource/123/sub?q1=v1&q2=v2',
                undefined,
                {"content-type": "text/csv"}
            );
            const wrongUri = routes.getResource.request(
                'GET',
                // @ts-expect-error
                '/resource/123/sub?q1=v1&q2=v2',
                undefined,
                {"content-type": "text/csv"}
            );
            const wrongBody = routes.getResource.request(
                'GET',
                '/resource/123/sub/456?q1=v1&q2=v2',
                // we should be @ts-expect-error 'ing for a body when we want undefined
                // but for some reason TS think it's an unused @ts-expect-error ....
                // @ts-ignore
                {foo: {bar: 123}},
                {"content-type": "text/csv"}
            );
            const emptyHeaders = routes.getResource.request(
                'GET',
                '/resource/123/sub/456?q1=v1&q2=v2',
                undefined,
                // @ts-expect-error
                {}
            );
            const wrongHeaders = routes.getResource.request(
                'GET',
                '/resource/123/sub/456?q1=v1&q2=v2',
                undefined,
                // @ts-expect-error
                {"content-type": "text/html"}
            );
        });

        it('handle json body', async () => {
            await routes.postJsonResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                // @ts-expect-error -- not a string body
                body: {foo: {bar: 'json'}},
                headers: {"content-type": "text/csv"},
            });
            const response = await routes.postJsonResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                body: {foo: {baz: 'json'}},
                headers: {"content-type": "text/csv"},
            });
            response.body.quux
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo
        });

        it('handle string body', async () => {
            await routes.postStringResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                // @ts-expect-error -- not a string body
                body: {foo: {bar: 'json'}},
                headers: {"content-type": "text/csv"},
            });
            const response = await routes.postStringResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                // @ts-expect-error -- not a string body
                body: 'any thing',
                headers: {"content-type": "text/csv"},
            });
            response.body.slice
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo
        });

        it('handle stream body', async () => {
            await routes.postStreamResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                // @ts-expect-error -- not a stream body
                body: '{"a": 123}',
                headers: {"content-type": "text/csv"},
            });
            const response = await routes.postStreamResource.handler.handle({
                method: 'POST',
                uri: '/resource/123/sub/456?q1=v1&q2=v2',
                body: stream.Readable.from('{"a": 123}'),
                headers: {"content-type": "text/csv"},
            });
            response.body.read
            // @ts-expect-error -- foo does not exist on type body
            response.body.foo
        });

        it('wildcard match', async () => {
            const routes = {
                wildcard: get('*/resource/{id}/sub/{subId}/*', {
                    handle: async (req) => {
                        const wildcards = req.vars?.wildcards;
                        return {status: 200, body: `wildcards: ${wildcards?.join(' ')}`, headers: {"foo": "bar"}}
                    }
                })
            }
            const r = router(routes);

            const resp = await r.handle({
                method: 'GET',
                uri: 'stuff/before/resource/123/sub/456/stuff/after',
                body: undefined,
                headers: {},
            });

            expect(resp.body).eq('wildcards: stuff/before stuff/after')

            await routes.wildcard.handler.handle({
                method: 'GET',
                // doesn't need to have stuff before and after to match
                uri: '/resource/123/sub/456/',
                body: undefined,
                headers: {},
            });

            await routes.wildcard.handler.handle({
                method: 'GET',
                // @ts-expect-error - but does need to fulfil the basic contract
                uri: '/resource/123/sub',
                body: undefined,
                headers: {},
            });
        })
    })

    describe('routing logic of router', () => {
        it('not found default', async () => {
            const r = router({
                getResource: get('/resource', {
                    handle: async (req) => {
                        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
                    }
                }, {"content-type": "text/csv"} as const)
            });
            const res = await r.handle(h22p.request({method: 'GET', uri: '/not/found'}))
            expect(res.status).eq(404);
            expect(await Body.text(res.body)).eq('Not found');
        })

        it('simple route', async () => {
            const r = router({
                getResource: get('/', {
                    handle: async (req) => {
                        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
                    }
                }, {"content-type": "text/csv"} as const)
            });
            const res = await r.handle(h22p.request({method: 'GET', uri: '/'}))
            expect(res.status).eq(200);
            expect(await Body.text(res.body)).eq(`{"bar":"json"}`);
        })

        it('path param', async () => {
            const rs = {
                getResource: get('/resource/{id}/sub/{subId}?q1&q2', {
                    handle: async (req) => {
                        const path = req.vars?.path;
                        return {status: 200, body: `Hello ${path?.id} ${path?.subId}`, headers: {"foo": "bar"}}
                    }
                }, {"content-type": "text/csv"} as const)
            };
            const r = router(rs);
            const res = await r.handle(h22p.get('/resource/123/sub/456'))
            expect(res.status).eq(200);
            expect(await Body.text(res.body)).eq('Hello 123 456');
        })
    })

    it('produces openAPI spec', async () => {
        const routes = {
            getResource: get('/users/{userId}', {
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
                [
                    {
                        ...h22p.ok({body: 'hello, world', headers: {"content-type": "text/plain"}}),
                        description: "Get user"
                    },
                    h22p.notFound({headers: {"content-type": "text/plain"}}),
                ]),
            postResource: post('/users/{userId}?q1&q2', {example: 'payload'}, {
                    handle: async (req) => {
                        const u = req.uri
                        if (u.length > 5) {
                            return h22p.created({body: {user: {name: 'tom', worksAt: 'Evil Corp'}}})
                        } else {
                            return h22p.notFound();
                        }
                    }
                }, {"content-type": "application/json"} as const,
                // TODO why does it care about the Body type but not the Headers or Status ??
                [
                    {
                        ...h22p.created({
                            body: {user: {name: 'tom', worksAt: 'Evil Corp'}},
                            headers: {"content-type": "application/json"},
                        }),
                        description: "create user"
                    },
                    h22p.notFound({headers: {"content-type": "text/plain"}}),
                ]),
        }

        // TODO make this blow up even if query string provided (it's being interpreted as path parameter!)

        const foo = await routes.getResource.handler.handle({
            method: 'GET',
            uri: '/users/123?q1=v1&q2=v2',
            body: undefined,
            headers: {"content-type": 'text/plain'}
        })

        if (foo.status === 200) {
            // Todo make this not compile ;(
            foo.body
        }

        const schema = openApiSchema(routes, {
            description: "This is a sample API to demonstrate OpenAPI documentation.",
            title: "Example API",
            apiVersion: "1.0.0",
            server: {url: "http://localhost:3000", description: "Local"},
        });

        expect(schema).deep.eq(output())


        function openApiSchema(rs: typeof routes, config: {
            server: { description: string; url: string };
            description: string;
            title: string;
            apiVersion: string
        }): OpenApiSchema {
            const metadata = {
                "openapi": "3.0.3",
                "info": {
                    "description": config.description,
                    "title": config.title,
                    "version": config.apiVersion,
                },
                "servers": [
                    {
                        "url": config.server.url, // "https://api.example.com/v1",
                        "description": config.server.description, // "Production server"
                    }
                ], paths: {}
            };
            const routes = Object.entries(rs);
            return routes.reduce((acc, [routeName, route]) => {
                const uri: string = route.matcher.uri.split("?")[0];
                const paths = acc.paths;
                const method = route.matcher.method;

                // console.log(URI.parse(route.matcher.uri));

                const responses = route.responses;
                const definition = {
                    operationId: routeName,
                    "tags": [],
                    "parameters": [
                        {
                            "name": "userId",
                            "in": "path", //  | "query" | "header" | "cookie", // "path"
                            "required": true, // path parameters are always required
                            "schema": {type: "string"}
                        }
                    ] as OpenapiParameter[],
                    "responses": responses.reduce((schema, r) => {
                        const header = r.headers['content-type'] as string | undefined;
                        const type = typeFromBody(r.body);
                        schema[r.status.toString()] = {
                            ...(r.description ? {description: r.description} : {}),
                            content: {
                                [header ?? contentTypeHeaderFromBody(r.body)]: {
                                    schema: bodyTypes(r)
                                }
                            }
                        }
                        return schema;

                        function objectTypes(body: JsonObject): properties {
                            return Object.keys(body).reduce((obj, key) => {
                                if (typeof body[key] === "string") {
                                    // @ts-ignore
                                    obj[key] = {type: "string", example: body[key]}
                                } else if (typeof body[key] === "number") {
                                    // @ts-ignore
                                    obj[key] = {type: "integer"}
                                } else if (Array.isArray(body)) {
                                    // TODO how to reference components ;D
                                    // @ts-ignore
                                    obj[key] = {type: "array", items: {"$ref": "#/components/schemas/pet"}}
                                } else {
                                    // @ts-ignore
                                    obj[key] = {type: "object", properties: objectTypes(body[key])}
                                }
                                return obj
                            }, {} as properties)
                        }

                        function bodyTypes(res: OpenapiResponse<HttpResponse>): properties {
                            const body = res.body;
                            if (typeof body === "string") {
                                return {type: "string", example: body}
                            } else if (body instanceof stream.Readable || body instanceof Buffer) {
                                return {type: "string", example: 'stream'}
                            } else if (body === undefined) {
                                return {type: "string", example: res.statusText ?? '[empty string]'}
                            } else if (Array.isArray(body)) {
                                // TODO how to reference components ;D
                                return {type: "array", items: {"$ref": "#/components/schemas/pet"}}
                            } else {
                                // @ts-ignore
                                return {type: "object", properties: objectTypes(body)};
                            }
                        }

                    }, {} as any)
                };
                const mtd = method.toLowerCase();
                if (paths[uri] === undefined) {
                    paths[uri] = {
                        [mtd]: definition as any
                    }
                } else {
                    paths[uri][mtd] = definition as any
                }
                return acc;
            }, metadata as OpenApiSchema)
        }

        type properties = leaf | inner;
        type inner =
            | { type: "object", properties: inner | { [prop: string]: inner | leaf } }
        type leaf =
            | { type: "string", example: string }
            | { type: "integer" }
            | { type: "array", items: { "$ref": `#/components/${string}` } }

        function typeFromBody(body: HttpMessageBody): SchemaType['type'] {
            return typeof body === 'string'
                ? 'string'
                : body instanceof Buffer
                    ? 'string'
                    : body instanceof stream.Readable
                        ? 'string'
                        : typeof body === 'object'
                            ? 'object'
                            : 'binary'
        }


        function contentTypeHeaderFromBody(body: HttpMessageBody): string {
            return typeof body === 'string'
                ? 'text/plain'
                : body instanceof Buffer
                    ? 'application/octet-stream'
                    : body instanceof stream.Readable
                        ? 'application/octet-stream'
                        : typeof body === 'object'
                            ? 'application/json'
                            : 'application/octet-stream'
        }

        function output() {
            return {
                "openapi": "3.0.3",
                "info": {
                    "title": "Example API",
                    "description": "This is a sample API to demonstrate OpenAPI documentation.",
                    "version": "1.0.0"
                },
                "servers": [
                    {
                        "description": "Local",
                        "url": "http://localhost:3000"
                    }
                ],
                "paths": {
                    "/users/{userId}": {
                        "get": {
                            "operationId": "getResource",
                            "tags": [],
                            "parameters": [
                                {
                                    "name": "userId",
                                    "in": "path",
                                    "required": true,
                                    "schema": {
                                        "type": "string"
                                    }
                                }
                            ],
                            "responses": {
                                "200": {
                                    "description": "Get user",
                                    "content": {
                                        "text/plain": {
                                            "schema": {
                                                "type": "string",
                                                "example": "hello, world"
                                            }
                                        }
                                    }
                                },
                                "404": {
                                    "content": {
                                        "text/plain": {
                                            "schema": {
                                                "type": "string",
                                                "example": "Not Found"
                                            }
                                        }
                                    },
                                }
                            }
                        },
                        "post": {
                            "operationId": "postResource",
                            "tags": [],
                            "parameters": [
                                {
                                    "name": "userId",
                                    "in": "path",
                                    "required": true,
                                    "schema": {
                                        "type": "string"
                                    }
                                }
                            ],
                            "responses": {
                                "201": {
                                    "content": {
                                        "application/json": {
                                            "schema": {
                                                "type": "object",
                                                "properties": {
                                                    "user": {
                                                        "type": "object",
                                                        "properties": {
                                                            "name": {
                                                                "type": "string",
                                                                "example": "tom"
                                                            },
                                                            "worksAt": {
                                                                "type": "string",
                                                                "example": "Evil Corp"
                                                            },
                                                        }
                                                    },
                                                }
                                            }
                                        }
                                    },
                                    "description": "create user"
                                },
                                "404": {
                                    "content": {
                                        "text/plain": {
                                            "schema": {
                                                "type": "string",
                                                "example": "Not Found"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            }
        }
    })
})


type SchemaType = {
    "type": "string" | "integer" | "object" | "array" | "boolean" | "binary"
};
type OpenapiParameter = {
    "name": string // "userId",
    "in": "path" | "query" | "header" | "cookie", // "path"
    "required": boolean, // path parameters are always required
    "description": string // "ID of the user to retrieve",
    "schema": SchemaType
};

type OpenapiResponses = {
    [statusCode: string]: {
        "description": string, // "A user object",
        "content": {
            [contentType: string]: { // "application/json"
                "schema": {
                    "$ref"?: string // "#/components/schemas/User"
                    type?: SchemaType['type']; // string
                    format?: "binary" | "int32" | "int64" | "date" | string // binary
                }
            }
        }
    }
};
type Resource = {
    operationId: string; // "getUserById",
    "tags": string[],  // ["Users"],
    "parameters": OpenapiParameter[],
    "responses": OpenapiResponses

};
type OpenApiSchema = {
    "openapi": "3.0.3",
    "info": {
        "title": string, // "Example API"
        "description": string, // "This is a sample API to demonstrate OpenAPI documentation."
        "version": string, // "1.0.0"
    },
    "servers": [
        {
            "url": string, // "https://api.example.com/v1",
            "description": string, // "Production server"
        }
    ],
    paths: {
        [path: string]: {
            [mtd: string]: Resource
        }
    }
};
