import {getQueryKey, queriesFromString, queryObject} from "./router";

export class UrlEncodedMessage {
    static parse<S extends string>(str: S | undefined): queryObject<S> {
        const params: queryObject<S> = {} as queryObject<S>;
        if (typeof str !== 'string') return {} as queryObject<S>;

        str = (str.startsWith('?') ? str.slice(1) : str) as S;
        str = (str.replace(new RegExp("\\+", 'g'), " ")) as S;
        const keyValuePairs = str.split('&');
        for (const pair of keyValuePairs) {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key) as getQueryKey<queriesFromString<S>>] = decodeURIComponent(value || '');
        }

        return params as queryObject<S>;
    }

    static stringify<S extends string>(params: queryObject<S>): S {
        const queryStringParts: string[] = [];

        for (const key in params) {
            const value = params[key as getQueryKey<queriesFromString<S>>];
            queryStringParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }

        return queryStringParts.join('&') as S;
    }
}
