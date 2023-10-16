import { GrumpkinScalar, generatePublicKey } from "@aztec/aztec.js";
import { Schnorr } from '@aztec/circuits.js/barretenberg';

(async () => {
    const privkeyHex = '0x29c89d44801553848239a90cc867e0dc01719fcc55692074cf9c620d51f9b661'
    const privkey = GrumpkinScalar.fromString(privkeyHex);
    const pubkey = await generatePublicKey(privkey);
    const data = {
        value1: 27,
        value2: 38
    }
    const textEncoder = new TextEncoder();
    const encodedData = textEncoder.encode(JSON.stringify(data));
    const schnorr = await Schnorr.new();
    const signature = schnorr.constructSignature(encodedData, privkey);
    const verified = schnorr.verifySignature(encodedData, pubkey, signature);
    console.log('Verified: ', verified);
})();