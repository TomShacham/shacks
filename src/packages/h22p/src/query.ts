import {DictString} from "./interface";

export class Query {
    static parse(str: string | undefined): DictString {
        const params: Record<string, string> = {};
        if (str === undefined) return {};

        str = str.startsWith('?') ? str.slice(1) : str;
        str = str.replaceAll("+", " ");
        const keyValuePairs = str.split('&');
        for (const pair of keyValuePairs) {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }

        return params;
    }

    static stringify(params: NodeJS.Dict<string>): string {
        const queryStringParts: string[] = [];

        for (const key in params) {
            const value = params[key] as string;
            queryStringParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }

        return queryStringParts.join('&');
    }
}
