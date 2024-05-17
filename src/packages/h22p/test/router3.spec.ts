import {JsonBody} from "../src";

type pathParameterToString<Part> = Part extends `{${infer Name}}` ? string : Part;
type backToPath<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? `${pathParameterToString<PartA>}/${backToPath<PartB>}`
    : pathParameterToString<Path>;

type req<Uri extends string, TBody extends JsonBody> = {
    uri: Uri,
    body: TBody
}
type res<TBody extends JsonBody> = {
    body: TBody;
    status: number
}

type handler<
    Uri extends string,
    ReqB extends JsonBody,
    ResB extends JsonBody,
> = {
    handle: (req: req<Uri, ReqB>) => Promise<res<ResB>>
}

function handle<
    Uri extends string,
    ReqB extends JsonBody,
    ResB extends JsonBody,
>(fn: (req: req<Uri, ReqB>) => Promise<res<ResB>>): handler<Uri, ReqB, ResB> {
    return {handle: fn}
}

type routes<
    O extends { [key: string]: handler<Uri, ReqB, ResB> },
    Uri extends string,
    ReqB extends JsonBody,
    ResB extends JsonBody
> = {
    [K in keyof O]: handler<Uri, ReqB, ResB> extends infer R extends handler<infer U, infer RqB, infer RsB>
        ? handler<U, RqB, RsB>
        : handler<Uri, ReqB, ResB>
}

type x = '/resource/{id}'
type y = backToPath<x>

function get<
    Uri extends string,
    ReqB extends JsonBody,
    ResB extends JsonBody,
>(uri: Uri, body: ReqB, handler: handler<backToPath<Uri>, ReqB, ResB>): handler<backToPath<Uri>, ReqB, ResB> {
    return {handle: (req: req<backToPath<Uri>, ReqB>) => handler.handle(req)}
}

const routes = {
    getResource: get('/resource/{id}/sub/{subId}', {foo: {bar: 'json'}} as const, handle(async (req) => {
        const u = req.uri
        return {status: 200, body: {bar: 'json'}}
    })),
};

describe('test', () => {
    it('does a thing', async () => {
        const response = await routes.getResource.handle({uri: '/resource/123/sub/456', body: {foo: {bar: 'json'}}});
        response.body.bar
        // @ts-expect-error -- foo does not exist on type body
        response.body.foo

    })
})


