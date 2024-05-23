import stream from "stream";
import {HttpMessageBody, HttpResponse, JsonObject} from "./interface";
import {Route, Routes} from "./router";
import {URI} from "./uri";
import {UrlEncodedMessage} from "./urlEncodedMessage";

export type OpenapiMetadata = {
    server: { description: string; url: string };
    description: string;
    title: string;
    apiVersion: string
};
type SchemaType = {
    "type": "string" | "integer" | "object" | "array" | "boolean" | "binary"
};
export type OpenapiParameter = {
    "name": string // "userId",
    "in": "path" | "query" | "header" | "cookie", // "path"
    "required": boolean, // path parameters are always required
    "description": string // "ID of the user to retrieve",
    "schema": SchemaType
};
export type OpenapiResponses = {
    [statusCode: string]: {
        "content": {
            [contentType: string]: { // "application/json"
                "schema": responseSchema
            }
        }
    }
};
export type responseSchema = responseValueType | responseObjectType;
type responseObjectType =
    | { type: "object", properties: responseObjectType | { [prop: string]: responseObjectType | responseValueType } }
type responseValueType =
    | { type: "string", example: string }
    | { type: "integer" }
    | { type: "array", items: { "$ref": `#/components/${string}` } }
export type Resource = {
    operationId: string; // "getUserById",
    "parameters": OpenapiParameter[],
    "responses": OpenapiResponses

};
type Paths = {
    [path: string]: {
        [mtd: string]: Resource
    }
};
export type OpenApiSchema = {
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
    paths: Paths
};

export function openApiSchema(rs: Routes, config: OpenapiMetadata): OpenApiSchema {
    return Object.entries(rs).reduce((acc, [routeName, route]) => {
        const path: string = route.matcher.uri.split("?")[0];
        const paths = acc.paths;
        const method = route.matcher.method;
        const parameters = requestParameters(route);
        const responses = route.responses;
        const definition = {
            operationId: routeName,
            ...(parameters.length === 0 ? {} : {
                "parameters": parameters
            }),
            "responses": responsesSchema(responses)
        };
        const mtd = method.toLowerCase();
        if (paths[path] === undefined) {
            paths[path] = {
                [mtd]: definition as Resource
            }
        } else {
            paths[path][mtd] = definition as Resource
        }
        return acc;
    }, buildMetadata(config) as OpenApiSchema)

    function buildMetadata(config: OpenapiMetadata) {
        return {
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
            ],
            paths: {}
        };
    }


    function requestParameters(route: Route<any, any, any, any, any>) {
        const uri = URI.parse(route.matcher.uri);
        const pathParameterNames = (uri.path ?? '')
                .match(new RegExp('\\{([^}]+)}', 'g'))
                ?.map(it => it.replace('{', '').replace('}', ''))
            ?? [];
        const requestHeaders = route.matcher.headers;
        return [
            ...pathParameterNames.map(name => ({
                name,
                "in": "path", //  | "query" | "header" | "cookie", // "path"
                "required": true, // path parameters are always required
                "schema": {type: "string"}
            } as OpenapiParameter)),
            ...Object.keys(requestHeaders).map((name: string) => ({
                name: name,
                "in": "header", //  | "query" | "header" | "cookie", // "path"
                "required": true, // path parameters are always required
                "schema": {type: "string"},
                "example": requestHeaders[name as keyof typeof requestHeaders]
            })),
            ...Object.keys(UrlEncodedMessage.parse(uri.query))
                .map(name => ({
                    name,
                    "in": "query",
                    "required": true,
                    "schema": {type: "string"}

                }))
        ];
    }
}

function responsesSchema(responses: HttpResponse[]) {
    return responses.reduce((acc, r) => {
        const header = r.headers['content-type'] as string | undefined;
        acc[r.status.toString()] = {
            content: {
                [header ?? contentTypeHeaderFromBody(r.body)]: {
                    schema: bodyTypes(r)
                }
            }
        }
        return acc;
    }, {} as OpenapiResponses);
}

function objectTypes(body: JsonObject): responseSchema {
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
    }, {} as responseSchema)
}

function bodyTypes(res: HttpResponse): responseSchema {
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