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

export function uri(from: string): Uri {
    const uriRegex = /^(?<protocol>https?:)\/\/(?:(?<username>[^:@]+)(?::(?<password>[^@]+))?@)?(?<hostname>[^\/:]+)(?::(?<port>\d+))?(?<path>\/[^?#]*)?(?<query>\?[^#]*)?(?<fragment>#.*)?$/;

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

export function uriString(parsedUri: Uri) {
    let uriString = `${parsedUri.protocol}//`;

    if (parsedUri.username) {
        uriString += `${parsedUri.username}`;
        if (parsedUri.password) {
            uriString += `:${parsedUri.password}`;
        }
        uriString += '@';
    }

    uriString += parsedUri.hostname;

    if (parsedUri.port) {
        uriString += `:${parsedUri.port}`;
    }

    if (parsedUri.path) {
        uriString += parsedUri.path;
    }

    if (parsedUri.query) {
        uriString += parsedUri.query;
    }

    if (parsedUri.fragment) {
        uriString += parsedUri.fragment;
    }

    return uriString;
}
