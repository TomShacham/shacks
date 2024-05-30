#!/usr/bin/env bash
set -x

rm -rf dist &&
npm run build &&
npm run test &&
cp release.sh package.json tsconfig.json README.md dist
#npm publish --access public
