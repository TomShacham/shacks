import {
    HttpMessageBody,
    HttpResponse,
    isBuffer,
    isStream,
    JsonBody,
    JsonObject,
    MessageBody,
    URI,
    UrlEncodedMessage
} from "@shacks/h22p";
import {RouteDefinition, Routes} from "./router";

export class OpenApi {
    public static specFrom(rs: Routes, config: OpenapiMetadata): OpenApiSchema {
        return Object.entries(rs).reduce((acc, [routeName, route]) => {
            const path: string = route.matcher.uri.split("?")[0];
            const paths = acc.paths;
            const method = route.matcher.method;
            const parameters = this.requestParameters(route);
            const requestBody = this.requestBodyFrom(route.matcher.body);
            const responses = route.responses;
            const definition = {
                operationId: routeName,
                ...(parameters.length === 0 ? {} : {parameters}),
                ...(requestBody === undefined ? {} : {requestBody}),
                "responses": this.responsesSchema(responses)
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
        }, this.buildMetadata(config) as OpenApiSchema)

    }

    private static buildMetadata(config: OpenapiMetadata) {
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


    private static requestParameters(route: RouteDefinition<any, any, any, any, any>): OpenapiParameter[] {
        const uri = URI.parse(route.matcher.uri);
        const pathParameterNames = (uri.path ?? '')
                .match(new RegExp('\\{([^}]+)}', 'g'))
                ?.map((it: string) => it.replace('{', '').replace('}', ''))
            ?? [];
        const requestHeaders = route.matcher.headers;
        return [
            ...pathParameterNames.map((name: string) => ({
                name,
                "in": "path",
                "required": true, // path parameters are always required
                "schema": {type: "string"}
            })),
            ...Object.keys(requestHeaders).map((name: string) => ({
                name: name,
                "in": "header",
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


    private static requestBodyFrom(body: MessageBody): OpenapiRequestBody | undefined {
        if (body === undefined) return undefined;
        const contentType = this.contentTypeHeaderFromBody(body);
        return {
            required: true,
            content: {
                [contentType]: {
                    schema: this.bodyTypes(body),
                    examples: {
                        example1: {value: this.exampleBodyFrom(body)}
                    }
                }
            }
        }
    }

    private static responsesSchema(responses: HttpResponse[]): OpenapiResponses {
        return responses.reduce((acc, r) => {
            const header = r.headers['content-type'] as string | undefined;
            acc[r.status.toString()] = {
                content: {
                    [header ?? this.contentTypeHeaderFromBody(r.body)]: {
                        schema: this.bodyTypes(r.body, r.statusText)
                    }
                }
            }
            return acc;
        }, {} as OpenapiResponses);
    }

    private static objectTypes(body: JsonObject): bodySchema {
        return Object.keys(body).reduce((obj, key) => {
            if (typeof body[key] === "string") {
                // @ts-ignore
                obj[key] = {type: "string", example: body[key]}
            } else if (typeof body[key] === "number" || typeof body[key] === "bigint") {
                // @ts-ignore
                obj[key] = {type: "integer"}
            } else if (typeof body[key] === "boolean") {
                // @ts-ignore
                obj[key] = {type: "boolean"}
            } else if (Array.isArray(body)) {
                // TODO how to reference components ;D
                // @ts-ignore
                obj[key] = {type: "array", items: {"$ref": "#/components/schemas/pet"}}
            } else {
                // @ts-ignore
                obj[key] = {type: "object", properties: this.objectTypes(body[key])}
            }
            return obj
        }, {} as bodySchema)
    }

    private static bodyTypes(body: MessageBody, statusText?: string): bodySchema {
        if (typeof body === "string") {
            return {type: "string", example: body}
        } else if (isStream(body) || isBuffer(body)) {
            return {type: "string", example: 'stream'}
        } else if (body === undefined) {
            return {type: "string", example: statusText ?? '[empty string]'}
        } else if (Array.isArray(body)) {
            // TODO how to reference components ;D
            return {type: "array", items: {"$ref": "#/components/schemas/pet"}}
        } else {
            // @ts-ignore
            return {type: "object", properties: this.objectTypes(body)};
        }
    }

    private static exampleBodyFrom(body: MessageBody): string | JsonBody {
        return typeof body === 'string'
            ? "string"
            : isStream(body)
                ? "stream"
                : isBuffer(body)
                    ? "buffer"
                    : typeof body === 'object'
                        ? body
                        : ""
    }

    private static contentTypeHeaderFromBody(body: HttpMessageBody): string {
        return typeof body === 'string'
            ? 'text/plain'
            : isBuffer(body)
                ? 'application/octet-stream'
                : isStream(body)
                    ? 'application/octet-stream'
                    : typeof body === 'object'
                        ? 'application/json'
                        : 'application/octet-stream'
    }

}


type OpenapiMetadata = {
    server: { description: string; url: string };
    description: string;
    title: string;
    apiVersion: string
};
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
type OpenapiRequestBody = {
    required: true,
    content: {
        [contentType: string]: {
            schema: bodySchema,
            examples: {
                example1: { value: string | JsonBody }
            }
        }
    }
};
type OpenapiResponses = {
    [statusCode: string]: {
        "content": {
            [contentType: string]: { // e.g. "application/json"
                "schema": bodySchema
            }
        }
    }
};
type bodySchema = responseValueType | responseObjectType;
type responseObjectType =
    | { type: "object", properties: responseObjectType | { [prop: string]: responseObjectType | responseValueType } }
type responseValueType =
    | { type: "string", example: string }
    | { type: "integer" }
    | { type: "array", items: { "$ref": `#/components/${string}` } }
type Resource = {
    operationId: string; // "getUserById",
    requestBody?: OpenapiRequestBody,
    parameters?: OpenapiParameter[],
    responses?: OpenapiResponses

};
type Paths = {
    [path: string]: {
        [mtd: string]: Resource
    }
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
    paths: Paths
};
