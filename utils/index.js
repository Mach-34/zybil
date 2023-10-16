export const constructURLSearchParams = (paramObj) => {
    const params = new URLSearchParams();
    for (const key in paramObj) {
        params.append(key, paramObj[key])
    }
    return params.toString()
}