import { execSync } from "child_process";
import * as url from 'url';
import { createWalletClient, http, Abi, Hex } from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import { foundry } from 'viem/chains'

const account = mnemonicToAccount('test test test test test test test test test test test junk')

const walletClient = createWalletClient({
    account,
    chain: foundry,
    transport: http("http://localhost:8545")
})


const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const CONTRACT_PATH = `${__dirname}/../contracts/`;
const PORTAL_PATH = `${__dirname}/../contracts/ZybilPortal.sol`;
const REMAP = `@aztec/l1-contracts=${__dirname}/../node_modules/@aztec/l1-contracts`;
const OUTPUT_FLAG = {
    portal: "======= contracts/ZybilPortal.sol:ZybilPortal =======",
}

// Compilation artifacts for a contract
type Artifact = {
    bytecode: string,
    abi: Abi,
}

/**
 * Gets the string needed to look for slicing output
 * @param contract - the name of the contract being compiled
 * @returns - the string to use index of to slice output from solc
 */
function getOutputFlag(contract: string) {
    return `======= contracts/${contract}.sol:${contract} =======`;
}

/**
 * Compiles a contract and returns artifacts
 * @param contract - the name of the contract to compile
 * @return - the abi and bytecode for a given contract
 */
function compile(contract: string): Artifact {
    // get output flag
    const outputFlag = getOutputFlag(contract);
    // get bytecode
    const bytecodeOutput = execSync(`solc ${REMAP} ${CONTRACT_PATH}${contract}.sol --bin`).toString();
    let sliceIndex = bytecodeOutput.indexOf(
        "Binary:\n",
        bytecodeOutput.indexOf(outputFlag)
    ) + "Binary:\n".length;
    const bytecode = bytecodeOutput.slice(sliceIndex).trim();
    // get abi
    const abiOutput = execSync(`solc ${REMAP} ${CONTRACT_PATH}${contract}.sol --abi`).toString();
    sliceIndex = abiOutput.indexOf("[{", abiOutput.indexOf(OUTPUT_FLAG.portal));
    const abi = JSON.parse(abiOutput.slice(sliceIndex).trim());
    return { bytecode, abi };
}

/**
 * Returns the 
 */
async function getContracts() {
    const portal = compile("ZybilPortal");
    const ens = compile("ToyENS");

    // try deploying
    let hash = await walletClient.deployContract({
        abi: portal.abi,
        bytecode: `0x${portal.bytecode}`
    })

    console.log("Hash: ", hash);
}

getContracts()
    .then(process.exit(0));