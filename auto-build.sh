#!/bin/bash

#run with fswatch src ./auto-build.sh

set -e
set -x

echo "Building..."
pwd
./build.sh
rm -Rf ../cvv/frontend/node_modules/lstate/dist
cp -Rfv dist ../cvv/frontend/node_modules/lstate
echo "Done!"
