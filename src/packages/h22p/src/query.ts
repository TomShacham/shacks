import {UrlEncodedMessage} from "./urlEncodedMessage";
import {queryObject} from "./router";

export class Query {
    static parse<S extends string>(from: S | undefined): queryObject<S> {
        return UrlEncodedMessage.parse(from)
    }

    static toString<S extends string>(params: queryObject<S>): S {
        return UrlEncodedMessage.stringify(params)
    }
}

