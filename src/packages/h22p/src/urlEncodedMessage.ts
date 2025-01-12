import {getQueryKey, queriesFromString, queryObject} from "./interface";

export class UrlEncodedMessage {
    static parse<S extends string>(str: S | undefined): queryObject<S> {
        const params: queryObject<S> = {} as queryObject<S>;
        if (typeof str !== 'string') return {} as queryObject<S>;
        if (str === '') return {} as queryObject<S>;

        str = (str.startsWith('?') ? str.slice(1) : str) as S;
        str = (str.replace(new RegExp("\\+", 'g'), " ")) as S;
        const keyValuePairs = str.split('&');
        for (const pair of keyValuePairs) {
            const [key, value] = pair.split('=');
            const k = decodeURIComponent(key) as getQueryKey<queriesFromString<S>>;
            params[k] = params[k]
                ? typeof params[k] === 'string'
                    ? [params[k], decodeURIComponent(value || '')]
                    : [...params[k], decodeURIComponent(value || '')]
                : decodeURIComponent(value || '');
        }

        return params as queryObject<S>;
    }

    static stringify<S extends string>(params: queryObject<S>): S {
        const queryStringParts: string[] = [];

        for (const key in params) {
            const value = params[key as getQueryKey<queriesFromString<S>>];
            typeof value === 'string' ?
                queryStringParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                : value.forEach(v => queryStringParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`))
        }

        return queryStringParts.join('&') as S;
    }
}
