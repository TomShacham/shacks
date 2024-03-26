import {HttpMessage} from "./interface";

export class Wire {
    static async text(msg: HttpMessage) {
        let text = '';
        if (!msg.body) return text;
        for await (const chunk of msg.body ?? []) {
            text += chunk
        }
        return text;
    }

}