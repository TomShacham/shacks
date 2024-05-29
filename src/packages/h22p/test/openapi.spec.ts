import {expect} from "chai";
import {Res} from "../src/response";
import {OpenApi, Route} from "../src";

describe('openapi', () => {
    it('produces openAPI spec', async () => {
        const routes = {
            getUser: Route.get('/users/{userId}?name', {
                    handle: async (req) => {
                        if (Math.random() > 0.5) {
                            return Res.ok({body: 'hello, world'})
                        } else {
                            return Res.notFound();
                        }
                    }
                }, {"content-type": "text/plain"} as const,
                [
                    Res.ok({body: 'hello, world', headers: {"content-type": "text/plain"}}),
                    Res.notFound({headers: {"content-type": "text/plain"}}),
                ]),
            postUser: Route.post('/users/{userId}', {
                    gov: {
                        st: "downing",
                        info: {occupied: true, no: 10, who: 'dishy'}
                    }
                }, {
                    handle: async (req) => {
                        if (Math.random() > 0.5) {
                            return Res.created({body: {user: {name: 'tom', worksAt: 'Evil Corp'}}})
                        } else {
                            return Res.notFound();
                        }
                    }
                }, {"content-type": "application/json"} as const,
                [
                    Res.created({
                        body: {user: {name: 'tom', worksAt: 'Evil Corp', employed: true, yearsExperience: 10}},
                        headers: {"content-type": "application/json"},
                    }),
                    Res.notFound({headers: {"content-type": "text/plain"}}),
                ]),
            getUserAccount: Route.get('/users/{userId}/account/{accountId}?name&accountType', {
                    handle: async (req) => {
                        if (Math.random() > 0.5) {
                            return Res.ok({body: 'hello, world'})
                        } else {
                            return Res.notFound();
                        }
                    }
                }, {"content-type": "text/plain"} as const,
                // TODO why does it care about the Body type but not the Headers or Status ??
                //   it doesnt seem to care about Body type either now ;D
                [
                    Res.ok({body: 'hello, world', headers: {"content-type": "text/plain"}}),
                    Res.notFound({headers: {"content-type": "text/plain"}}),
                ]),
        }

        const schema = OpenApi.specFrom(routes as any, {
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
                    "requestBody": {
                        "required": true,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "gov": {
                                            "type": "object",
                                            "properties": {
                                                "st": {
                                                    "type": "string",
                                                    "example": "downing"
                                                },
                                                "info": {
                                                    "type": "object",
                                                    "properties": {
                                                        "no": {
                                                            "type": "integer"
                                                        },
                                                        "occupied": {
                                                            "type": "boolean"
                                                        },
                                                        "who": {
                                                            "type": "string",
                                                            "example": "dishy"
                                                        },
                                                    },
                                                },
                                            }
                                        },
                                    },
                                },
                                "examples": {
                                    "example1": {
                                        "value": {
                                            "gov": {
                                                "st": "downing",
                                                "info": {
                                                    "occupied": true,
                                                    "no": 10,
                                                    "who": "dishy"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
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
                                                    "yearsExperience": {
                                                        "type": "integer"
                                                    },
                                                    "employed": {
                                                        "type": "boolean"
                                                    }
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
