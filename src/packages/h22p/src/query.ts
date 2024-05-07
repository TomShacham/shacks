export class Query {
    static parse(str: string | undefined): NodeJS.Dict<string> {
        const params: Record<string, string> = {};
        if (str === undefined) return {};

        str = str.startsWith('?') ? str.slice(1) : str;
        const keyValuePairs = str.split('&');
        for (const pair of keyValuePairs) {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }

        return params;
    }
}
