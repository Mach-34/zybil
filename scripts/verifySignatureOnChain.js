import { createPXEClient, Contract, GrumpkinScalar, generatePublicKey  } from "@aztec/aztec.js";
import { Schnorr } from '@aztec/circuits.js/barretenberg';
import ZybilContractAbi from '../contracts/zybil/target/Zybil.json' assert {type: 'json'};
import { objectToUint8Array } from "../utils/index.js";

const serializeData = () => {
    
}

(async () => {
    const sandboxURL = 'http://localhost:8080';
    const pxe = createPXEClient(sandboxURL);
    const zybil = await Contract.deploy(pxe, ZybilContractAbi).send().deployed();

    const privkeyHex = '0x29c89d44801553848239a90cc867e0dc01719fcc55692074cf9c620d51f9b661'
    const privkey = GrumpkinScalar.fromString(privkeyHex);
    const pubkey = await generatePublicKey(privkey);

    const data = {
        platform: 2,
        record: {
            email,
        },
        valid: verified_email,
    }
    
    const msg = objectToUint8Array(data);
    const schnorr = await Schnorr.new();
    const signature = schnorr.constructSignature(msg, privkey);
    const signatureBytes = new Uint8Array(signature.buffer);
    const verified = await zybil.methods.verify_signature(
        {x: pubkey.x.value, y: pubkey.y.value},
        signatureBytes,
        msg
    ).view();
    console.log('Verified: ', verified);
})();