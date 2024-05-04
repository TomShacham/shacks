import stream from "node:stream";
import {h22pStream, isH22PStream} from "../src";
import {expect} from "chai";

describe('h22p stream', () => {

    it('create and see if h22pStream or not', () => {
        const str = h22pStream.create();
        expect(isH22PStream(str)).eq(true);
        expect(isH22PStream(stream.Readable.from('foo'))).eq(false);
    });

})