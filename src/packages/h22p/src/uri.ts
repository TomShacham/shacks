import {emptyToString, pathPart, queryPart} from "./interface";

export interface Uri<S extends string> {
    protocol: string;
    username: string | undefined;
    password: string | undefined;
    hostname: string;
    port: string | undefined;
    path: emptyToString<pathPart<S>> | undefined;
    query: emptyToString<queryPart<S>> | undefined;
    fragment: string | undefined;
}

export class URI {
    static parse<S extends string>(from: S): Uri<S> {
        const uriRegex = /^(?:(?<protocol>https?:)\/\/)?(?:(?<username>[^:@]+)(?::(?<password>[^@]+))?@)?(?<hostname>[^\/:]+)?(?::(?<port>\d+))?(?<path>\/[^?#]*)?(?<query>\?[^#]*)?(?<fragment>#.*)?$/;

        const match = uriRegex.exec(from);

        if (match) {
            const groups = match.groups!;
            const protocol = groups.protocol;
            const username = groups.username;
            const password = groups.password;
            const hostname = groups.hostname;
            const port = groups.port;
            const path = groups.path as emptyToString<pathPart<S>>;
            const query = groups.query as emptyToString<queryPart<S>>; // if query string is empty then assume string rather than empty string
            const fragment = groups.fragment;

            return {protocol, username, password, hostname, port, path, query, fragment}
        } else {
            throw new Error('Invalid URI format');
        }
    }

    static toString<S extends string>(parsedUri: Uri<S>): string {
        let uriString = `${parsedUri.protocol}//`;
        if (parsedUri.username) {
            uriString += `${parsedUri.username}`;
            if (parsedUri.password) {
                uriString += `:${parsedUri.password}`;
            }
            uriString += '@';
        }
        uriString += parsedUri.hostname;
        if (parsedUri.port) uriString += `:${parsedUri.port}`;
        if (parsedUri.path) uriString += parsedUri.path;
        if (parsedUri.query) uriString += parsedUri.query;
        if (parsedUri.fragment) uriString += parsedUri.fragment;

        return uriString;
    }

    static query(queryString: string | undefined): { [key: string]: string | Array<string> } {
        if (!queryString) return {};
        var params: { [key: string]: string | string[] } = {};
        var queryStringWithoutQuestionMark = queryString.replace(/^\?/, '');
        var keyValuePairs = queryStringWithoutQuestionMark.split('&');

        keyValuePairs.forEach(function (keyValuePair) {
            var pair = keyValuePair.split('=');
            var key = decodeURIComponent(pair[0]);
            var value = decodeURIComponent(pair[1] || '');

            // If the key already exists, convert it to an array
            if (params.hasOwnProperty(key)) {
                if (!Array.isArray(params[key])) {
                    params[key] = [params[key] as string];
                } else {
                    (params[key] as string[]).push(value);
                }
            } else {
                params[key] = value;
            }
        });

        return params;
    }

}

