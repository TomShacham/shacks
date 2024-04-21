import {httpServer} from "../../src/server";
import {Req, Res, response} from "../../src/interface";
import {Body} from "../../src/body";

async function multipartFormServer() {
    let {baselineHeap, heap} = heapStats();
    const logInterval = setInterval(() => {
        console.log({runningAverageHeapDelta: fmt(heap.slice(-5).reduce((acc, next) => acc + next) / 5)})
    }, 500)

    const {server, close} = await httpServer({
        async handle(req: Req): Promise<Res> {
            if (req.method === 'POST') {
                const {headers, body} = await Body.multipartFormField(req);
                for await (const b of body) {
                    heap.push(process.memoryUsage().heapUsed - baselineHeap)
                }
            }
            if (req.method === 'GET') {
                return response({
                    body: html(), status: 200
                })
            } else {
                return response({
                    body: '', status: 302, headers: {"Location": "/file"}
                })
            }
        }
    }, 3000);
}

const fmt = (data) => `${Math.round(data / 1024 / 1024)} MB`;

function html() {
    return `
<html>
    <p>combo of simple field and a file</p>
    <form enctype="multipart/form-data" action="/file" method="post">
        <input type="text" id="name" name="name" placeholder="name..." />
        <input type="file" id="pic" name="pic" />
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

function heapStats() {
    const baselineHeap = process.memoryUsage().heapUsed
    let heap = [
        process.memoryUsage().heapUsed - baselineHeap,
        process.memoryUsage().heapUsed - baselineHeap,
        process.memoryUsage().heapUsed - baselineHeap,
        process.memoryUsage().heapUsed - baselineHeap,
        process.memoryUsage().heapUsed - baselineHeap
    ];
    return {baselineHeap, heap};
}

multipartFormServer();
