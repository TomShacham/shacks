import stream from "node:stream";
import {BodyType, h22pStream} from "../src";

describe('h22p stream', () => {

    it('infer type', async () => {
        const typeChecks = (result: true) => console.log(result)
        const doesNotTypeCheck = (result: false) => console.log(result)

        const stream: stream.Readable | { foo: string } = h22pStream.of({foo: 'bar'})

        type streamType = typeof stream;
        type streamTypeOnceRead = BodyType<streamType>;

        typeChecks(true as ((stream.Readable | { foo: string; }) extends streamType ? true : false));
        doesNotTypeCheck(false as ((stream.Readable | { bar: string; }) extends streamType ? true : false));
        typeChecks(true as ({ foo: string; } extends streamTypeOnceRead ? true : false));
    });

});
