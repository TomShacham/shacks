#!/usr/bin/env bash
set -x

find src/packages/h22p/src | grep d.ts | xargs rm
find src/packages/h22p/src | grep js | xargs rm
