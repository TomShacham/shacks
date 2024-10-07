#!/usr/bin/env bash

packages=`echo h22p h22p-router h22p-node h22p-fetch`
apps=`ls src/example-apps`
success=true

# build and test the packages
function test() {
  echo testing
  for pkg in $packages ; do
      pushd src/packages/$pkg;
      rm -rf dist
      pnpm test
      if [ $? != 0 ]; then
        success=false
      fi
      popd
  done
  for app in $apps ; do
    pushd src/example-apps/$app;
    rm -rf node_modules
    pnpm i
    pnpm test
    if [ $? != 0 ]; then
      success=false
    fi
    popd
  done
  echo $success
}

function bump() {
  if [[ $success == false ]]; then
    echo some test fails
    else
      # release the packages
      for pkg in $packages ; do
          pushd src/packages/$pkg;
          VERSION_STRING='"version": '
          CURR_VERSION=$(awk -F \" '/"version": ".+"/ { print $4; exit; }' package.json)
          NEXT_VERSION=$(echo ${CURR_VERSION} | awk -F. -v OFS=. '{$NF += 1 ; print}')
          sed -i '' "s/\($VERSION_STRING\).*/\1\"$NEXT_VERSION\",/" package.json
          cp package.json tsconfig.json README.md dist &&
          popd
      done

      git commit -am "bump to version ${NEXT_VERSION}"
  fi
}


function publish() {
  if [[ $success == false ]]; then
    echo some test fails
    else
      for pkg in $packages ; do
          pushd src/packages/$pkg;
          pnpm publish --access public
          popd
      done
  fi
}


test

if [[ $1 == "" ]]; then
    exit 0
elif [[ $1 == "bump-version" ]]; then
  bump
else
  publish
fi
