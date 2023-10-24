import { GrumpkinScalar } from "@aztec/aztec.js";

// why is this async
async function main(): Promise<string> {
    const seed = GrumpkinScalar.random();
    return seed.toString();
}

main()
    .then((key: string) => {
        console.log(key);
        process.exit(0);
    })
    .catch((err: Error) => {
        console.error(err);
        process.exit(1);
    });