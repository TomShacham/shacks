export interface Uri {
    protocol: string;
    username: string | undefined;
    password: string | undefined;
    hostname: string;
    port: string | undefined;
    path: string | undefined;
    query: string | undefined;
    fragment: string | undefined;
}

export class URI {
    static parse(from: string): Uri {
        const uriRegex = /^(?:(?<protocol>https?:)\/\/)?(?:(?<username>[^:@]+)(?::(?<password>[^@]+))?@)?(?<hostname>[^\/:]+)?(?::(?<port>\d+))?(?<path>\/[^?#]*)?(?<query>\?[^#]*)?(?<fragment>#.*)?$/;

        const match = uriRegex.exec(from);

        if (match) {
            const groups = match.groups!;
            const protocol = groups.protocol;
            const username = groups.username;
            const password = groups.password;
            const hostname = groups.hostname;
            const port = groups.port;
            const path = groups.path;
            const query = groups.query;
            const fragment = groups.fragment;

            return {protocol, username, password, hostname, port, path, query, fragment}
        } else {
            throw new Error('Invalid URI format');
        }
    }

    static toString(parsedUri: Uri) {
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

