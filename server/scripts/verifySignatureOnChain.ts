import {
    AztecAddress,
    createPXEClient,
    Contract,
    GrumpkinScalar,
    generatePublicKey,
    getSandboxAccountsWallets,
    Point,
    Wallet,
} from "@aztec/aztec.js";
import { ContractArtifact } from '@aztec/foundation/abi';
import { Schnorr } from "@aztec/circuits.js/barretenberg";
import ZybilContractAbi from '../../contracts/l2/target/Zybil.json' assert {type: 'json'};
import { objectToUint8Array } from "../src/utils/index.js";
import { padBytes } from "../src/utils/index.js";


const privkey = '0x29c89d44801553848239a90cc867e0dc01719fcc55692074cf9c620d51f9b661';
const sandboxURL = 'http://localhost:8080';

const connectToContract = (client: Wallet) => {
    const address = '0x1edc4643b971bc022855e50af649dba83f80605d125fe9051c237e6860077a5f';
    return Contract.at(AztecAddress.fromString(address), ZybilContractAbi as ContractArtifact, client);
}

const deployContract = async (client: Wallet, pubkey: Point) => {
    return await Contract.deploy(
        client, ZybilContractAbi as ContractArtifact,
        [{ x: pubkey.x, y: pubkey.y }]
    ).send().deployed();
}

const generateSignatureAndMsg = async (privkey: GrumpkinScalar) => {
    const data = {
        platform: 2,
        record: {
            email: 'test@email.com',
        },
        valid: true,
    }
    // Convert msg to bytes and pad to ensure a length of 380
    const msg = padBytes(objectToUint8Array(data));
    const schnorr = await Schnorr.new();
    const signature = schnorr.constructSignature(msg, privkey);
    const signatureBytes = new Uint8Array(signature.toBuffer());
    return { msg: Array.from(msg), signature: Array.from(signatureBytes) }
}


async function main() {
    const pubkey = await generatePublicKey(GrumpkinScalar.fromString(privkey))
    const client = createPXEClient(sandboxURL);
    const zybil = await deployContract(client as Wallet, pubkey);
    const { msg, signature } = await generateSignatureAndMsg(GrumpkinScalar.fromString(privkey));
    const verified = await zybil.methods.valid_signature(
        signature,
        msg
    ).view();
    console.log('Verified: ', verified);
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
