import { SigningKey } from "ethers";

// points for uncompressed ecdsa pubkey
export type ecdsaPubkey = {
    x: Buffer;
    y: Buffer;
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