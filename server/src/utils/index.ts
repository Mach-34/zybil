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

export const padBytes = (bytes: Uint8Array) => {
    const padded = new Uint8Array(60);
    padded.set(bytes);
    return padded;
}

export const removePadding = (bytes: Uint8Array) => {
    let index = 0;
    let nullFound = false;
    while (!nullFound) {
        if (bytes[index] === 0) {
            nullFound = true;
        } else {
            index++;
        }
    }
    return bytes.slice(0, index);
}