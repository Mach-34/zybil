/**
 * Sleep for a given number of milliseconds.
 * 
 * @param ms - the number of milliseconds to sleep for
 */
export function sleep(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

/**
 * Converts a hex string to the expected format for a u8 array
 * 
 * @param hex - the hex string to convert
 * @returns - u8 array that is compatible with noir inputs
 */
export function hexTou8Array(hex: string): number[] {
    // check if hex string starts with 0x and slice off if so
    hex = hex.startsWith("0x") ? hex.slice(2) : hex;
    // convert hex string to number[]
    return Array.from(Uint8Array.from(Buffer.from(hex, "hex")));
}