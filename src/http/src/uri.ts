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
        const protocol = match.groups.protocol;
        const username = match.groups.username;
        const password = match.groups.password;
        const hostname = match.groups.hostname;
        const port = match.groups.port;
        const path = match.groups.path;
        const query = match.groups.query;
        const fragment = match.groups.fragment;

        return {protocol, username, password, hostname, port, path, query, fragment}
    } else {
        throw new Error('Invalid URI format');
    }
}

export function uriString(parsedUri) {
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
