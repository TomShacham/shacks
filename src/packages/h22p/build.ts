import * as Bun from 'bun';
import * as fs from "fs";

Bun.build({
    entrypoints: ['./src/browser-index.ts'],
    outdir: './bun',
    target: "browser"
}).then(r => {
    let output = fs.readFileSync('./bun/browser-index.js', 'utf-8');
    output = output.replaceAll('extends undefined', '');
    output = output.replaceAll('export {', 'window.h22p = {');
    output = output.replaceAll('global.', 'globalThis.');
    output = output.replaceAll(`constructor() {
    super(...arguments);
  }`, '');
    fs.writeFileSync('./bun/browser-index.js', output, 'utf-8');
})

