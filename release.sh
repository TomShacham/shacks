#!/usr/bin/env bash

packages=`echo h22p h22p-router h22p-node h22p-fetch`
apps=`ls src/example-apps`

function test() {
  success=true
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
    pnpm test
    if [ $? != 0 ]; then
      success=false
    fi
    popd
  done
  echo $success
}

test

if [[ $success == false ]]; then
  echo some test fails

  else
    # release the packages

    for pkg in $packages ; do
        pushd src/packages/$pkg;
        VERSION_STRING='"version": '
        CURR_VERSION=$(awk -F \" '/"version": ".+"/ { print $4; exit; }' package.json)
        NEXT_VERSION=$(echo ${CURR_VERSION} | awk -F. -v OFS=. '{$NF += 1 ; print}')
#        sed -i '' "s/\($VERSION_STRING\).*/\1\"$NEXT_VERSION\",/" package.json
          cp package.json tsconfig.json README.md dist &&
          pnpm publish --access public

        popd

    done

fi

