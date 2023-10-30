#!/bin/sh

# Check that artifacts asset dir exists
if [ ! -d "./src/artifacts" ]; then
  mkdir ./src/artifacts
fi
if [ ! -d "./src/artifacts/l1" ]; then
  mkdir ./src/artifacts/l1
fi
if [ ! -d "./src/artifacts/l2" ]; then
  mkdir ./src/artifacts/l2
fi

# Compiles l1 artifacts and provides to src/artifacts/1
cd l1
yarn compile
cd ..
mv l1/artifacts/contracts/ToyENS.sol/ToyENS.json src/artifacts/l1
mv l1/artifacts/contracts/ZybilPortal.sol/ZybilPortal.json src/artifacts/l1
rm -rf ./l1/artifacts ./l1/cache

# # Compiles l2 artifacts and provides to src/artifacts/2
yarn aztec-cli compile ./l2 -ts .
mv l2/target/Zybil.json src/artifacts/l2
mv l2/Zybil.ts src/artifacts/l2
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|target/Zybil.json|./Zybil.json|" src/artifacts/l2/Zybil.ts
else
    # Linux
    sed -i "s|target/Zybil.json|./Zybil.json|" src/artifacts/l2/Zybil.ts
fi
rm -rf l2/target