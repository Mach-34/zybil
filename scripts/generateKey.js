import { GrumpkinScalar } from "@aztec/aztec.js";

(async () => {;
    const seed = GrumpkinScalar.random();
    const grumpkin = new GrumpkinScalar(seed);
    const privkey = grumpkin.toString().slice(2);
    console.log('Grumpkin key generated: ', privkey)
})();