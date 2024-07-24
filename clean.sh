#!/usr/bin/env bash
set -x

rm -rf src/packages/*/dist
find src/packages/h22p/src | grep d.ts | xargs rm
find src/packages/h22p/test | grep d.ts | xargs rm
find src/packages/h22p/src | grep .js | xargs rm
find src/packages/h22p/test | grep .js | xargs rm
