// @ts-nocheck  --- I've done this because @types/bun conflicts with @types/node and this file causes tsc to fail
import * as Bun from 'bun';
import * as fs from "fs";

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

const entrypoints = ['/src/browser-index.ts', '/test/resources/app.ts'];
Bun.build({
    entrypoints: entrypoints,
    outdir: './bun',
    target: "browser"
}).then(r => {
    entrypoints.forEach(path => {
        const pathToBuiltJs = path.replace('.ts', '.js');
        return bunHotFixes(`./bun${pathToBuiltJs}`);
    });
}).then(d => console.log('compiled'));

