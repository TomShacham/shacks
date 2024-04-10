import {httpServer} from "../../src/server";
import {Req, res, Res} from "../../src/interface";
import {Body, MultipartFormPart} from "../../src/body";
import * as fs from "fs";

async function multipartFormServer() {
    const {server, close} = await httpServer({
        async handle(req: Req): Promise<Res> {
            const fileparts = await Body.multipartForm(req);
            const filePart = (fileparts as MultipartFormPart[]).find(part => part.headers.some(h => h['filename'] !== undefined))
            if (filePart) {
                console.log('here');
                console.log({filePart});
                fs.writeFileSync('./hbg.txt', filePart!.body);
            }
            if (req.method === 'GET') {
                return res({
                    body: html(), status: 200
                })
            } else {
                return res({
                    body: '', status: 302, headers: {"Location": "/file"}
                })
            }
        }
    }, 3000);
}

function html() {
    return `
<html>
    <p>combo of simple field and a file</p>
    <form enctype="multipart/form-data" action="/file" method="post">
        <input type="text" id="name" name="name" placeholder="name..." />
        <input type="file" id="avatar" name="file" />
        <input type="submit" value="submit" formaction="/file"/>    
    </form>
    
    <p>doesn't have a field; just a single file</p>
    <form enctype="multipart/form-data" action="/file" method="post">
        <input type="file" id="avatar" name="file" />
        <input type="submit" value="submit" formaction="/file"/>    
    </form>
    
    <p>doesn't have a file; just a single field</p>
    <form enctype="multipart/form-data" action="/file" method="post">
        <input type="text" id="name" name="name" placeholder="name..." />
        <input type="submit" value="submit" formaction="/file"/>    
    </form>
    
    <p>multiple simple fields and multiple files</p>
    <form enctype="multipart/form-data" action="/file" method="post">
        <input type="text" id="name" name="name" placeholder="name..." />
        <input type="file" id="avatar" name="file" />
        <input type="text" id="title" name="title" placeholder="title..." />
        <input type="file" id="bio" name="bio" />
        <input type="submit" value="submit" formaction="/file"/>    
    </form>
    
    <p>combo of simple field and a multiple files</p>
    <form enctype="multipart/form-data" action="/file" method="post">
        <input type="text" id="name" name="name" placeholder="name..." />
        <input type="file" id="avatar" name="file" />
        <input type="file" id="bio" name="bio" />
        <input type="submit" value="submit" formaction="/file"/>    
    </form>
    
    <p>combo of simple field and multiple files with clashing name</p>
    <form enctype="multipart/form-data" action="/file" method="post">
        <input type="text" id="name" name="name" placeholder="name..." />
        <input type="file" id="avatar" name="file" />
        <input type="file" id="avatar" name="file" />
        <input type="submit" value="submit" formaction="/file"/>    
    </form>
</html>
`;
}

multipartFormServer();