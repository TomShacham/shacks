import {HttpMessage} from "./interface";

export class Bodies {
    static async text(req: HttpMessage) {
        let text = '';
        if (!req.body) return text;
        for await (const chunk of req.body ?? []) {
            text += chunk
        }
        return text;
    }

}