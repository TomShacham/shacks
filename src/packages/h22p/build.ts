// @ts-nocheck  --- I've done this because @types/bun conflicts with @types/node and this file causes tsc to fail
import * as Bun from 'bun';
import * as fs from "fs";

const entrypoints = [
    `/src/browser-index.ts`,
    `/test/browser/test-app.ts`
];

const outdir = `${__dirname}/bun`;
Bun
    .build({
        entrypoints: entrypoints.map(entry => `${__dirname}${entry}`),
        outdir: outdir,
        target: "browser"
    })
    .then(r => {
        if (!r.success) throw new Error(`Failed to compile \n ${r.logs.join('\n')}`);
        entrypoints.forEach(path => {
            const pathToBuiltJs = path.replace('.ts', '.js');
            return bunHotFixes(`${outdir}${pathToBuiltJs}`);
        });
    })
    .then(_ => console.log(`bun compiled to ${outdir}`));


function bunHotFixes(filePath: string) {
    let output = fs.readFileSync(filePath, 'utf-8');
    output = output.replaceAll('extends undefined', '');
    output = output.replaceAll('export {', 'window.h22p = {');
    output = output.replaceAll('global.', 'globalThis.');
    output = output.replaceAll(`constructor() {
    super(...arguments);
  }`, '');
    fs.writeFileSync(filePath, output, 'utf-8');
}

