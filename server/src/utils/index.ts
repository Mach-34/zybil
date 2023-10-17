export const constructURLSearchParams = (paramObj: any) => {
    const params = new URLSearchParams();
    for (const key in paramObj) {
        params.append(key, paramObj[key])
    }
    return params.toString()
}

export const objectToUint8Array = (object: Object) => {
    const textEncoder = new TextEncoder();
    return textEncoder.encode(JSON.stringify(object));
}

export const numToHex = (num: number) => {
    const hex = (num).toString(16);
    // Add missing padding based of hex number length
    return `${'0'.repeat(64 - hex.length)}${hex}`;
}