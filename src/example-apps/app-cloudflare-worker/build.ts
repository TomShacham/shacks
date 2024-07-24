// @ts-nocheck  --- nocheck because @types/bun conflicts with @types/node and this file causes tsc to fail
import * as Bun from 'bun';
import * as fs from 'fs';
import {watch} from 'fs';

const watcher = watch(
    `${__dirname}/src`,
    {recursive: true},
    (event, filename) => {
        debounce(build)
    },
);

let time = Date.now();

function debounce(f: () => any) {
    if ((Date.now() - time) > 1000) {
        console.log('executing');
        f()
    } else {
        console.log('debouncing');
    }
    time = Date.now()
}

build();

function build() {
    const outdir = `${__dirname}/bun`;
    const entrypoints = ['/worker.ts'];
    return Bun.build({
        entrypoints: entrypoints.map(entry => `${__dirname}/src${entry}`),
        outdir: outdir,
        target: "browser",
        // minify: true
    })
        .then(r => {
            if (!r.success) throw new Error(`Failed to compile \n ${r.logs.join('\n')}`);
            entrypoints.forEach(path => {
                const pathToBuiltJs = path.replace('.ts', '.js');
                return bunHotFixes(`${outdir}${pathToBuiltJs}`);
            });
        })
        .then(_ => console.log(`bun compiled to ${outdir}`));
}

function bunHotFixes(filePath: string) {
    let output = fs.readFileSync(filePath, 'utf-8');
    output = output.replaceAll('extends undefined', '');
    output = output.replaceAll('global.', 'globalThis.');
    output = output.replaceAll('as default', '');
    output = output.replaceAll('stream.Readable', 'ReadableStream');
    output = output.replaceAll(`constructor() {
    super(...arguments);
  }`, '');
    output = output.replace('export {\n  worker_default \n};', 'export default worker_default')
    fs.writeFileSync(filePath, output, 'utf-8');
}
