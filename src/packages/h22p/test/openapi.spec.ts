import {get, h22p, post} from "../src";
import {openApiSchema} from "../src/openapi";
import {expect} from "chai";

describe('openapi', () => {
    it('produces openAPI spec', async () => {
        const routes = {
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
            postUser: post('/users/{userId}', {example: 'payload'}, {
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

        // TODO make this blow up even if query string provided (it's being interpreted as path parameter!)
        //   at the moment query params look like a path param when the path param is omitted
        //   ALSO - adding further parts to the path seems like a path param i.e. /user/123/account/456 fulfils /user/{id}

        const foo = await routes.getUser.handler.handle({
            method: 'GET',
            uri: '/users/123/?name=tom',
            body: undefined,
            headers: {"content-type": 'text/plain'}
        })
        if (foo.status === 200) {
            // Todo make this not compile ;(
            foo.body
        }
        const schema = openApiSchema(routes as any, {
            description: "This is a sample API to demonstrate OpenAPI documentation.",
            title: "Example API",
            apiVersion: "1.0.0",
            server: {url: "http://localhost:3000", description: "Local"},
        });
        expect(schema).deep.eq(expectedOpenapiSpec())
    })
})

function expectedOpenapiSpec() {
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
                    "operationId": "getUser",
                    "parameters": [
                        {
                            "name": "userId",
                            "in": "path",
                            "required": true,
                            "schema": {
                                "type": "string"
                            }
                        },
                        {
                            "example": "text/plain",
                            "in": "header",
                            "name": "content-type",
                            "required": true,
                            "schema": {
                                "type": "string"
                            }
                        },
                        {
                            "in": "query",
                            "name": "name",
                            "required": true,
                            "schema": {
                                "type": "string"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
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
                    "operationId": "postUser",
                    "parameters": [
                        {
                            "name": "userId",
                            "in": "path",
                            "required": true,
                            "schema": {
                                "type": "string"
                            }
                        },
                        {
                            "example": "application/json",
                            "in": "header",
                            "name": "content-type",
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
                },
            },
            "/users/{userId}/account/{accountId}": {
                "get": {
                    "operationId": "getUserAccount",
                    "parameters": [
                        {
                            "in": "path",
                            "name": "userId",
                            "required": true,
                            "schema": {
                                "type": "string"
                            }
                        },
                        {
                            "in": "path",
                            "name": "accountId",
                            "required": true,
                            "schema": {
                                "type": "string"
                            }
                        },
                        {
                            "example": "text/plain",
                            "in": "header",
                            "name": "content-type",
                            "required": true,
                            "schema": {
                                "type": "string"
                            }
                        },
                        {
                            "in": "query",
                            "name": "name",
                            "required": true,
                            "schema": {
                                "type": "string"
                            }
                        },
                        {
                            "in": "query",
                            "name": "accountType",
                            "required": true,
                            "schema": {
                                "type": "string"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "content": {
                                "text/plain": {
                                    "schema": {
                                        "example": "hello, world",
                                        "type": "string"
                                    }
                                }
                            }
                        },
                        "404": {
                            "content": {
                                "text/plain": {
                                    "schema": {
                                        "example": "Not Found",
                                        "type": "string"
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
