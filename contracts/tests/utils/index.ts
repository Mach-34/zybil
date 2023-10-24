import { SigningKey } from "ethers";
import { GrumpkinScalar, FieldLike } from "@aztec/aztec.js";
import { Schnorr } from "@aztec/circuits.js/barretenberg";

// points for uncompressed ecdsa pubkey
export type ecdsaPubkey = {
    x: Buffer;
    y: Buffer;
}

export enum StampType {
    GITHUB = 1,
    GOOGLE = 2,
    DISCORD = 3
}

// Verified web2 oauth data
type VerifiedWeb2 = {
    id: string;
    stampType: StampType;
}

/**
 * Get the formatted ecdsa pubkey points from a private key
 * @param privateKey - the scalar private key
 * @returns - the x and y points of the ecdsa pubkey
 */
export function ecdsaUncompressedPubkey(privateKey: string): ecdsaPubkey {
    // get signing key from private key
    const signingKey = new SigningKey(privateKey);
    // get serialized public key coordiantes
    const serialized = signingKey.publicKey.slice(4, signingKey.publicKey.length);
    // extract x and y coordinates
    return {
        x: Buffer.from(serialized.slice(0, 64), "hex"),
        y: Buffer.from(serialized.slice(64, 128), "hex")
    }
}

/**
 * Signs verified data and returns a schnorr signature
 * @param msg - message as bytes
 * @param privkey - Grumpkin private key
 * @returns - Signature as an array of uint8values
 */
const signSchnorr = async (msg: Array<FieldLike>, privkey: GrumpkinScalar): Promise<Uint8Array> => {
    // Convert message to bytes
    const bytes = new Uint8Array(33);
    // Concat stamp type at start and id to rest of byte array
    bytes.set([msg[0] as number], 0);
    bytes.set(Uint8Array.from(msg[1] as Buffer), 1);

    const schnorr = await Schnorr.new();
    const signature = schnorr.constructSignature(bytes, privkey);
    return new Uint8Array(signature.toBuffer());
}

/**
 * Encode web2 data into Noir friendly format of Field array
 * @param data - Web2 data
 * @returns = Array of FieldTypes where stamp type is a number and id is a buffer
 */
const encodeWeb2Data = (data: VerifiedWeb2): Array<FieldLike> => {
    // Prevent ids from being longer than 63 characters for now
    if (data.id.length > 63) {
        throw new Error('UUID length exceeds max size')
    }
    // Convert id to buffer
    const buffer = Buffer.from(data.id)
    return [data.stampType, buffer]
}

/**
 * Generate signature of verified data and a message serialized as an array of FieldTypes
 * @param privateKey - the scalar private key
 * @returns - The message returned as an array of FieldTypes and the signature as an array of uint8 values
 */
export async function generateSignatureAndMsg(data: VerifiedWeb2, privkey: string): Promise<{ msg: Array<FieldLike>, signature: Uint8Array }> {
    const msg = encodeWeb2Data(data);
    const signature = await signSchnorr(msg, GrumpkinScalar.fromString(privkey));
    return { msg, signature };
}