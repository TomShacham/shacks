import {expect} from "chai";
import {JsonBody, Method} from "../src";
import stream from "stream";
import {doesNotTypeCheck, typeChecks} from "./helpers";

type toQueryString<Qs> = Qs extends `${infer Q1}&${infer Q2}`
    ? `${Q1}=${string}&${toQueryString<Q2>}`
    : Qs extends `${infer Q1}`
        ? `${Q1}=${string}`
        : Qs;

type expandPathParameterOrWildcard<Part> = Part extends `{${infer Name}}`
    ? string
    : Part extends `*`
        ? string
        : Part;
type backToPath<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? `${expandPathParameterOrWildcard<PartA>}/${backToPath<PartB>}`
    : expandPathParameterOrWildcard<Path>;

type fullPath<Part> = Part extends `${infer Path}?${infer Query}`
    ? `${backToPath<Path>}?${toQueryString<Query>}`
    : backToPath<Part>;

type Headers = { [key: string]: string };
type MessageBody = stream.Readable | JsonBody | string | undefined;
type BodyType<M extends MessageBody> = M extends infer J extends JsonBody
    ? J
    : M extends stream.Readable
        ? stream.Readable
        : M extends string
            ? string : undefined;
type req<
    Mtd extends Method,
    Uri extends string,
    TBody extends MessageBody,
    Hds extends Headers
> = {
    method: Mtd,
    uri: Uri,
    body: BodyType<TBody>,
    headers: Hds,
}
type res<
    TBody extends MessageBody,
    Hds extends Headers,
    Status extends number,
> = {
    body: TBody;
    status: Status,
    headers: Hds
}

type handler<
    Mtd extends Method,
    Uri extends string,
    ReqB extends MessageBody,
    ResB extends MessageBody,
    ReqHds extends Headers,
    ResHds extends Headers,
    Status extends number,

> = {
    handle: (req: req<Mtd, Uri, ReqB, ReqHds>) => Promise<res<ResB, ResHds, Status>>
}

function handle<
    Mtd extends Method,
    Uri extends string,
    ReqB extends MessageBody,
    ResB extends MessageBody,
    ReqHds extends Headers,
    ResHds extends Headers,
    Status extends number,
>(fn: (req: req<Mtd, Uri, ReqB, ReqHds>) => Promise<res<ResB, ResHds, Status>>): handler<Mtd, Uri, ReqB, ResB, ReqHds, ResHds, Status> {
    return {handle: fn}
}

function get<
    Uri extends string,
    ReqB extends undefined,
    ResB extends MessageBody,
    ReqHds extends Headers,
    ResHds extends Headers,
    Status extends number,
>(uri: Uri, body: ReqB, handler: handler<'GET', fullPath<Uri>, ReqB, ResB, ReqHds, ResHds, Status>, headers?: ReqHds): {
    handler: handler<'GET', fullPath<Uri>, ReqB, ResB, ReqHds, ResHds, Status>,
    req: (mtd: 'GET', uri: fullPath<Uri>, body: BodyType<ReqB>, headers: ReqHds) => req<'GET', fullPath<Uri>, ReqB, ReqHds>
} {
    return {
        handler: {handle: (req: req<'GET', fullPath<Uri>, ReqB, ReqHds>) => handler.handle(req)},
        req: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers})
    }
}

function post<
    Uri extends string,
    ReqB extends MessageBody,
    ResB extends MessageBody,
    ReqHds extends Headers,
    ResHds extends Headers,
    Status extends number,
>(uri: Uri, body: ReqB, handler: handler<'POST', fullPath<Uri>, ReqB, ResB, ReqHds, ResHds, Status>, headers?: ReqHds): {
    handler: handler<'POST', fullPath<Uri>, ReqB, ResB, ReqHds, ResHds, Status>,
    req: (mtd: 'POST', uri: fullPath<Uri>, body: BodyType<ReqB>, headers: ReqHds) => req<'POST', fullPath<Uri>, ReqB, ReqHds>
} {
    return {
        handler: {handle: (req: req<'POST', fullPath<Uri>, ReqB, ReqHds>) => handler.handle(req)},
        req: (mtd, uri, body, headers) => ({method: mtd, uri, body, headers: headers})
    }
}

const routes = {
    getResource: get('/resource/{id}/sub/{subId}?q1&q2', undefined, handle(async (req) => {
        const u = req.uri
        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
    }), {"content-type": "text/csv"} as const),
    postJsonResource: post('/resource/{id}', {foo: {baz: 'json'}}, handle(async (req) => {
        const u = req.uri
        return {status: 200, body: {quux: 'json'}, headers: {}}
    })),
    postStringResource: post('/resource/{id}', '', handle(async (req) => {
        const u = req.uri
        return {status: 200, body: 'some response string', headers: {}}
    })),
    postStreamResource: post('/resource/{id}', stream.Readable.from(''), handle(async (req) => {
        const u = req.uri
        return {status: 200, body: stream.Readable.from('123'), headers: {}}
    })),
    wildcard: get('*/resource/{id}/sub/{subId}/*', undefined, handle(async (req) => {
        const u = req.uri
        return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
    })),
};

// todo put, patch etc
// Todo routing based off routes
//  open api docs based off routes
//    - how do we do responses :S
//  stitch back into main

describe('test', () => {
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
        typeChecks(true as (typeof response.status extends 200 ? true : false));
        doesNotTypeCheck(false as (typeof response.status extends 201 ? true : false));

        response.headers.foo
        // @ts-expect-error -- foo does not exist on type body
        response.headers.bar
    })

    it('build a type-safe request', async () => {
        const typeSafeRequest = routes.getResource.req(
            'GET',
            '/resource/123/sub/456?q1=v1&q2=v2',
            undefined,
            {"content-type": "text/csv"}
        );
        expect(typeSafeRequest).deep.eq({uri: '/resource/123/sub/456', body: {foo: {bar: 'json'}}})
        const noQueryProvided = routes.getResource.req(
            'GET',
            // @ts-expect-error
            '/resource/123/sub/456',
            undefined,
            {}
        );
        const wrongMethod = routes.getResource.req(
            // @ts-expect-error
            'POST',
            '/resource/123/sub?q1=v1&q2=v2',
            undefined,
            {}
        );
        const wrongUri = routes.getResource.req(
            'GET',
            // @ts-expect-error
            '/resource/123/sub?q1=v1&q2=v2',
            undefined,
            {}
        );
        const wrongBody = routes.getResource.req(
            'GET',
            '/resource/123/sub/456?q1=v1&q2=v2',
            // @ts-expect-error
            {foo: {bar: 123}},
            {}
        );
        const emptyHeaders = routes.getResource.req(
            'GET',
            '/resource/123/sub/456?q1=v1&q2=v2',
            undefined,
            // @ts-expect-error
            {}
        );
        const wrongHeaders = routes.getResource.req(
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
            body: 'string',
            headers: {"content-type": "text/csv"},
        });
        const response = await routes.postStreamResource.handler.handle({
            method: 'POST',
            uri: '/resource/123/sub/456?q1=v1&q2=v2',
            body: stream.Readable.from('any thing'),
            headers: {"content-type": "text/csv"},
        });
        response.body.read
        // @ts-expect-error -- foo does not exist on type body
        response.body.foo
    });

    it('wildcard match', async () => {
        await routes.wildcard.handler.handle({
            method: 'GET',
            uri: 'stuff/before/resource/123/sub/456/stuff/after',
            body: undefined,
            headers: {},
        });

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
    });

    it('produces openAPI spec', async () => {
        const routes = {
            getResource: get('/resource/{id}/sub/{subId}?q1&q2', undefined, handle(async (req) => {
                const u = req.uri
                return {status: 200, body: {bar: 'json'}, headers: {"foo": "bar"}}
            }), {"content-type": "text/csv"} as const),
        }

        expect(openApiSchema(routes)).deep.eq(output)

        function openApiSchema(rs: typeof routes) {
            const paths = Object.values(rs);
            console.log(paths);
            return {
                "paths": paths
            }
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
                        "url": "https://api.example.com/v1",
                        "description": "Production server"
                    }
                ],
                "paths": {
                    "/users/{userId}": {
                        "get": {
                            "summary": "Get a user by ID",
                            "operationId": "getUserById",
                            "tags": ["Users"],
                            "parameters": [
                                {
                                    "name": "userId",
                                    "in": "path",
                                    "required": true,
                                    "description": "ID of the user to retrieve",
                                    "schema": {
                                        "type": "string"
                                    }
                                }
                            ],
                            "responses": {
                                "200": {
                                    "description": "A user object",
                                    "content": {
                                        "application/json": {
                                            "schema": {
                                                "$ref": "#/components/schemas/User"
                                            }
                                        }
                                    }
                                },
                                "404": {
                                    "description": "User not found"
                                }
                            }
                        },
                        "delete": {
                            "summary": "Delete a user by ID",
                            "operationId": "deleteUser",
                            "tags": ["Users"],
                            "parameters": [
                                {
                                    "name": "userId",
                                    "in": "path",
                                    "required": true,
                                    "description": "ID of the user to delete",
                                    "schema": {
                                        "type": "string"
                                    }
                                }
                            ],
                            "responses": {
                                "204": {
                                    "description": "User deleted successfully"
                                },
                                "404": {
                                    "description": "User not found"
                                }
                            }
                        }
                    }
                },
                "components": {
                    "schemas": {
                        "User": {
                            "type": "object",
                            "required": ["id", "name", "email"],
                            "properties": {
                                "id": {
                                    "type": "string",
                                    "example": "12345"
                                },
                                "name": {
                                    "type": "string",
                                    "example": "John Doe"
                                },
                                "email": {
                                    "type": "string",
                                    "format": "email",
                                    "example": "john.doe@example.com"
                                }
                            }
                        }
                    }
                }
            }
        }
    })

})


