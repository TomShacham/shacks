import stream from "node:stream";
import {Body, h22pStream} from "../src";


describe('h22p stream', () => {

    it('infer type', async () => {
        const typeChecks = (result: true) => console.log(result)
        const doesNotTypeCheck = (result: false) => console.log(result)

        // cast as an h22pStream
        const stream = h22pStream.of({foo: 'bar'}) as h22pStream<{ foo: string }>

        type streamType = typeof stream;
        const json = await Body.json(stream)
        type streamTypeOnceRead = typeof json;

        // stream has type Readable or whatever T is ( here it's {foo: string} )
        typeChecks(true as ((stream.Readable) extends streamType ? true : false));
        doesNotTypeCheck(false as ((stream.Readable | { bar: string; }) extends streamType ? true : false));

        // once we read it
        typeChecks(true as ({ foo: string; } extends streamTypeOnceRead ? true : false));
        doesNotTypeCheck(false as (streamTypeOnceRead extends h22pStream<{ foo: string; }> ? true : false))
        doesNotTypeCheck(false as (streamTypeOnceRead extends { foo: string; bar: string; } ? true : false))
    });

});
