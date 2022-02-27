rm -Rf ./dist
yarn buildDTS
# yarn buildWithEsbuild
esbuild --bundle src/index.ts --external:react --platform=node --format=esm --outfile=dist/index.js
