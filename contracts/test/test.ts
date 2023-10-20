import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('Test The Word Contract', async () => {
    // wallets to interact with
    let backend: HardhatEthersSigner;
    let alice: HardhatEthersSigner;
    let bob: HardhatEthersSigner;
    // deployed "the word" contract
    let ens: Contract;
    // poseidon hash function

    before(async () => {
        // set signers
        const addresses = await ethers.getSigners();
        backend = addresses[0];
        alice = addresses[1];
        bob = addresses[2];
        // deploy ens toy
        const ensFactory = await ethers.getContractFactory('ToyENS');
        ens = await ensFactory.deploy();
        await ens.waitForDeployment();
        // deploy zybil l1 portal contract
    });

    describe("Test Converters", async () => {
        it("Set ENS Record", async () => {
            const tx = await ens.set("jp4g.eth", await alice.getAddress());
            const receipt = await tx.wait();
            console.log("receipt");
        })
    })
})