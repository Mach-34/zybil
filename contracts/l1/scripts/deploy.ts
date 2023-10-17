import { ethers, run } from 'hardhat';
import { Signer } from 'ethers';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
    const network = await ethers.provider.getNetwork();
    console.log(`====================================`);
    console.log(`Deploying Zybil L1 Contracts to ${network.name} (${network.chainId})...`)
    // get deployer wallet
    // type mismatch bug exists with signers, must set type to any
    // https://ethereum.stackexchange.com/questions/154384/argument-of-type-hardhatetherssigner-is-not-assignable-to-parameter-of-type-s
    // const [deployer]: Signer[] = await ethers.getSigners();

    // deploy groth16 verifier
    const ensFactory = await ethers.getContractFactory('ToyENS');
    const ens = await ensFactory.deploy();
    await ens.waitForDeployment();
    const ensAddress = await ens.getAddress();

    // deploy zybil
    console.log(`Deployed ENS Contract to ${ensAddress}`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });