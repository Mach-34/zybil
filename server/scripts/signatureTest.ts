import { GrumpkinScalar, generatePublicKey } from "@aztec/aztec.js";
import { Schnorr } from "@aztec/circuits.js/barretenberg";
import { objectToUint8Array } from "../src/utils/index.js";

const privkeyHex = "0x29c89d44801553848239a90cc867e0dc01719fcc55692074cf9c620d51f9b661";

async function main(pkeyHex: string): Promise<boolean> {
    const privkey = GrumpkinScalar.fromString(privkeyHex);
    const pubkey = await generatePublicKey(privkey);
    const data = { value1: 27, value2: 38 };
    const encodedData = objectToUint8Array(data);
    const schnorr = await Schnorr.new();
    const signature = schnorr.constructSignature(encodedData, privkey);
    return schnorr.verifySignature(encodedData, pubkey, signature);
}

main(privkeyHex)
    .then((verified: boolean) => {
        if (!verified) {
            console.error("Signature verification failed");
            process.exit(1);
        } else {
            console.log("Signature verified");
            process.exit(0);
        }
    })
    .catch((err: Error) => {
        console.error(err);
        process.exit(1);
    });