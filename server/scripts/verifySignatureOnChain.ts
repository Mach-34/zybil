import {
    AztecAddress,
    createPXEClient,
    Contract,
    GrumpkinScalar,
    generatePublicKey,
    getSandboxAccountsWallets,
    FieldLike,
    Point,
    Wallet,
} from "@aztec/aztec.js";
import { ContractArtifact } from '@aztec/foundation/abi';
import { Schnorr } from "@aztec/circuits.js/barretenberg";
import ZybilContractAbi from '../../contracts/l2/target/Zybil.json' assert {type: 'json'};
import { objectToUint8Array, removePadding } from "../src/utils/index.js";
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

// TODO: Change to handle max length email
const encodeId = (id: string) => {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(id);
    return Buffer.from(encoded).toString('hex');
}

// Hardcode to string for now
const encodeVerifiedData = (stampType: number, id: string) => {
    if (stampType < 1 || stampType > 3) {
        throw new Error('Stamp type needs to be between 1 and 3')
    }
    // Allow max string length of 63 bytes for now
    if (id.length > 63) {
        throw new Error('UUID length exceeds max size')
    }
    const encodedId = encodeId(id);
    return [stampType, encodedId]
}

const msgToBytes = (msg: Array<any>) => {
    const bytes = new Uint8Array(33);
    bytes.set([msg[0]], 0)
    bytes.set(Uint8Array.from(Buffer.from((`0x${msg[1]}` as string), 'hex')), 1);
    return bytes
}

const generateSignatureAndMsg = async (privkey: GrumpkinScalar) => {
    const msg = encodeVerifiedData(2, 'Test@gmail.com');
    const bytes = msgToBytes(msg);
    const schnorr = await Schnorr.new();
    const signature = schnorr.constructSignature(bytes, privkey);
    const signatureBytes = new Uint8Array(signature.toBuffer());
    // @ts-ignore
    msg[0] = msg[0] as FieldLike;
    // @ts-ignore
    msg[1] = Buffer.from(`0x${msg[1]}`, 'hex') as FieldLike;
    return { msg: msg, signature: Array.from(signatureBytes) }
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
    console.log('Decoded: ', verified);
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
