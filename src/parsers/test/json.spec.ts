import {expect} from "chai";

type Literal = string | number | boolean | null;
type json = { [key: string]: JsonValue } | JsonValue[] | Literal;
type JsonValue = Literal | json | json[];
type Result<T, E> = { success: true; value: T } | { success: false; value: E }

function success<T>(value: T): Result<T, undefined> {
    return {success: true, value}
}

function failure<E>(value: E): Result<undefined, E> {
    return {success: false, value}
}

type ParseResult<T> = Result<{ parsed: T, remaining: string }, { error: string, remaining: string }>;

interface Parser<T> {
    parse: (str: string) => ParseResult<T>
}

class LiteralParser implements Parser<Literal> {
    parse(str: string): ParseResult<Literal> {
        if (str.trim() === 'true') return success({parsed: true, remaining: str.slice(str.length)});
        if (str.trim() === 'false') return success({parsed: false, remaining: str.slice(str.length)});
        if (str.trim() === 'null') return success({parsed: null, remaining: str.slice(str.length)})
        if (!Number.isNaN(Number(str))) return success({parsed: Number(str), remaining: str.slice(str.length)})
        return success({parsed: str, remaining: str.slice(str.length)})
    };
}

function json(str: string): any {
    return new LiteralParser().parse(str)
}

describe('json parsing', () => {
    it('literals', () => {
        expect(json('null').value.parsed).eq(null);
        expect(json('"null"').value.parsed).eq('"null"');
        expect(json('true').value.parsed).eq(true);
        expect(json('"true"').value.parsed).eq('"true"');
        expect(json('false').value.parsed).eq(false);
        expect(json('"false"').value.parsed).eq('"false"');
        expect(json('194').value.parsed).eq(194);
        expect(json('"some word"').value.parsed).eq('"some word"');

        // whitespace is preserved unless special value
        expect(json('  null ').value.parsed).eq(null);
        expect(json('  "null" ').value.parsed).eq('  "null" ');
        expect(json(' true  ').value.parsed).eq(true);
        expect(json(' "true"  ').value.parsed).eq(' "true"  ');
        expect(json(' false  ').value.parsed).eq(false);
        expect(json(' "false"  ').value.parsed).eq(' "false"  ');
        expect(json('  "194" ').value.parsed).eq('  "194" ');
        expect(json('  "some word" ').value.parsed).eq('  "some word" ');

    });
    // it('object', () => {
    //     expect(json('{"key": "value"}').value.parsed).eq({key: "value"});
    // });
})