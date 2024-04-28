import * as stream from 'stream';
import * as fs from "fs";

function go() {
    const inn = fs.createReadStream('./../../Desktop/boarding.pdf');
    let out = new stream.Readable({
        read() {
        }
    })
    processIn(inn, out)
    processOut(out)
}

function processIn(inn: stream.Readable, out: stream.Readable) {
    let chunk;
    inn.on('readable', function () {
        while ((chunk = inn.read()) != null) {
            console.log({w: 'writing ' + chunk.length});
            out.push(chunk)
        }
    });
}

async function processOut(out: stream.Readable) {
    for await (const w of out) {
        console.log({w: 'reading ' + w.length});
    }
}

go()
