import {
    createPXEClient,
    Contract,
    GrumpkinScalar,
    generatePublicKey,
    getSandboxAccountsWallets,
    Wallet,
} from "@aztec/aztec.js";
import { ContractArtifact } from '@aztec/foundation/abi';
// import { Schnorr } from "@aztec/circuits.js/src/barretenberg";
import ZybilContractAbi from '../../contracts/l2/target/Zybil.json' assert {type: 'json'};
// import { objectToUint8Array } from "../utils/index.js";

const sandboxURL = 'http://localhost:8080';

async function main() {
    const client = createPXEClient(sandboxURL);
    const zybil = await Contract.deploy(client as Wallet, ZybilContractAbi as ContractArtifact, []).send().deployed();
    console.log('Zybil: ', zybil)

}

main()
    .then(() => {
        console.log('Process exited successfully');
        process.exit(0);
    })
    .catch((err: Error) => {
        console.error(err);
        process.exit(1);
    });

// (async () => {
//     const zybil =

//     const privkeyHex = '0x29c89d44801553848239a90cc867e0dc01719fcc55692074cf9c620d51f9b661'
//     const privkey = GrumpkinScalar.fromString(privkeyHex);
//     const pubkey = await generatePublicKey(privkey);

//     const data = {
//         platform: 2,
//         record: {
//             email,
//         },
//         valid: verified_email,
//     }

//     const msg = objectToUint8Array(data);
//     const schnorr = await Schnorr.new();
//     const signature = schnorr.constructSignature(msg, privkey);
//     const signatureBytes = new Uint8Array(signature.buffer);
//     const verified = await zybil.methods.verify_signature(
//         { x: pubkey.x.value, y: pubkey.y.value },
//         signatureBytes,
//         msg
//     ).view();
//     console.log('Verified: ', verified);
// }) ();
