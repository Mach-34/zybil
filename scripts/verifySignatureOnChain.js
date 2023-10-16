import { createPXEClient, Contract } from "@aztec/aztec.js";
import ZybilContractAbi from '../contracts/zybil/target/Zybil.json' assert {type: 'json'};

(async () => {
    const sandboxURL = 'http://localhost:8080';
    const pxe = createPXEClient(sandboxURL);

    const zybil = await Contract.deploy(pxe, ZybilContractAbi, [])
        .send()
        .deployed();

    console.log('Zybil: ', zybil);
})();