#!/usr/bin/env bash
set -x

git subtree push  --prefix src/app-example origin app-example &&
git push heroku origin/app-example:main
