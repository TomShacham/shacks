import {HttpRequest, Req} from "../src";
import {expect} from "chai";
import {DictString} from "../src/interface";

describe('cookie', () => {

    it('get cookie', () => {
        const req = Req.get("/", {cookie: ''});
        expect(Cookie.from(req)).deep.eq({});
    })

})

class Cookie {
    static from(req: HttpRequest): DictString {
        return {}
    }
}