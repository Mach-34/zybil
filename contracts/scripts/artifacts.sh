#!/bin/sh

# Compiles l1 artifacts and provides to src/artifacts/1
cd l1
yarn compile
cd ..
mv l1/artifacts/contracts/ToyENS.sol/ToyENS.json src/artifacts/l1
mv l1/artifacts/contracts/ZybilPortal.sol/ZybilPortal.json src/artifacts/l1
rm -rf l1/artifacts l1/cache

# Compiles l2 artifacts and provides to src/artifacts/2
cd l2
aztec-cli compile . -ts .
cd ..
mv l2/target/Zybil.json src/artifacts/l2
mv l2/Zybil.ts src/artifacts/l2
sed -i "s|target/Zybil.json|./Zybil.json|" src/artifacts/l2/Zybil.ts
rm -rf l2/target