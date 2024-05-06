import stream from "node:stream";
import {Body, h22pStream, isH22PStream} from "../src";
import {expect} from "chai";

describe('h22p stream', () => {

    it('create and see if h22pStream or not', () => {
        const str = h22pStream.from(stream.Readable.from('foo'));
        expect(isH22PStream(str)).eq(true);
        expect(isH22PStream(stream.Readable.from('foo'))).eq(false);
    });

    it('create h22pStream from different HttpMessageBody types', async () => {
        expect(await Body.text(h22pStream.from('123'))).eq('123');
        expect(await Body.text(h22pStream.from({"some": "json"}))).eq('{"some":"json"}');
        expect(await Body.text(h22pStream.from(stream.Readable.from('123')))).eq('123');
        expect(await Body.text(h22pStream.from(Buffer.from('123')))).eq('123');
        expect(await Body.text(h22pStream.from(undefined))).eq('');
    });

});
