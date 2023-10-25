import { expect, jest, test, describe, beforeAll } from '@jest/globals';
import {
    AccountWallet,
    AztecAddress,
    DebugLogger,
    EthAddress,
    Fr,
    computeAuthWitMessageHash,
    createDebugLogger,
    createPXEClient,
    getSandboxAccountsWallets,
    waitForSandbox
} from '@aztec/aztec.js';
import { ZybilContract } from '../src/artifacts/index.js';
import { ZybilDriver, ClaimSecret } from '../src/driver.js';
import { sleep } from '@aztec/aztec.js';
import { Signer, SigningKey, JsonRpcProvider, HDNodeWallet, Mnemonic, solidityPackedKeccak256 } from 'ethers';
import { ecdsaUncompressedPubkey, ecdsaPubkey, generateSignatureAndMsg, StampType, stringTo32Bytes } from './utils/index.js';
import dotenv from 'dotenv';
dotenv.config();
const {
    PXE_URL = 'http://localhost:8080',
    ETHEREUM_URL = 'http://localhost:8545',
    MNEMONIC = 'test test test test test test test test test test test junk',
    GRUMPKIN_PRIV_KEY
} = process.env;

describe('Zybil', () => {
    jest.setTimeout(90000);

    const ethProvider = new JsonRpcProvider(ETHEREUM_URL);
    const mnemonic = Mnemonic.fromPhrase(MNEMONIC);

    let logger: DebugLogger;
    let aztecUsers: {
        backend: AccountWallet,
        alice: AccountWallet,
        bob: AccountWallet
    };
    let ethUsers: {
        backend: Signer,
        alice: Signer,
        bob: Signer
    };
    let driver: ZybilDriver;

    beforeAll(async () => {
        // initialize logger
        logger = createDebugLogger("aztec:zybil");

        // initialize sandbox connection
        const pxe = await createPXEClient(PXE_URL);

        // initialize eth signers
        const hdPath = "m/44'/60'/0'/0";
        ethUsers = {
            backend: HDNodeWallet.fromMnemonic(mnemonic, `${hdPath}/0`).connect(ethProvider),
            alice: HDNodeWallet.fromMnemonic(mnemonic, `${hdPath}/1`).connect(ethProvider),
            bob: HDNodeWallet.fromMnemonic(mnemonic, `${hdPath}/2`).connect(ethProvider),
        }

        // initialize aztec signers
        const wallets = await getSandboxAccountsWallets(pxe)
        aztecUsers = {
            backend: wallets[0],
            alice: wallets[1],
            bob: wallets[2],
        }
        // initialilze driver
        driver = await ZybilDriver.new(pxe, aztecUsers.backend, ethUsers.backend, logger);
        logger("Initialized Test Environment")
    })

    // test("Insert Gmail Stamp", async () => {
    //     const verifiedData = { stampType: StampType.GOOGLE, id: 'Test@gmail.com' };
    //     const { msg, signature } = await generateSignatureAndMsg(verifiedData, GRUMPKIN_PRIV_KEY!);
    //     await driver.stampWeb2(aztecUsers.alice, msg, signature);
    //     const score = Number(await driver.getScore(aztecUsers.alice));
    //     expect(score).toEqual(4);
    // });

    // test("Insert Github Stamp", async () => {
    //     const verifiedData = { stampType: StampType.GITHUB, id: '19249235023632746335' };
    //     const { msg, signature } = await generateSignatureAndMsg(verifiedData, GRUMPKIN_PRIV_KEY!);
    //     await driver.stampWeb2(aztecUsers.alice, msg, signature);
    //     const score = Number(await driver.getScore(aztecUsers.alice));
    //     expect(score).toEqual(19);
    // });

    // test("Insert Discord Stamp", async () => {
    //     const verifiedData = { stampType: StampType.DISCORD, id: '9401783215792375383' };
    //     const { msg, signature } = await generateSignatureAndMsg(verifiedData, GRUMPKIN_PRIV_KEY!);
    //     await driver.stampWeb2(aztecUsers.alice, msg, signature);
    //     const score = Number(await driver.getScore(aztecUsers.alice));
    //     expect(score).toEqual(21);
    // });

    // test("Get Ethereum Address Stamp", async () => {
    //     await driver.stampEthAddress(aztecUsers.alice, ethUsers.alice);
    //     // const score = Number(await driver.getScore(aztecUsers.alice));
    //     // expect(score).toEqual(28);
    // });

    // test("Insert ENS Stamp", async () => {
    //     const ens = 'ens.eth';
    //     // await driver.stampEthAddress(aztecUsers.alice, ethUsers.alice);
    //     await driver.setENSName(ens, ethUsers.alice);
    //     // Generate consumption and remdemption has
    //     const { hash: consumptionHash, secret: consumptionSecret } = await driver.generateClaimSecret();
    //     const { hash: redemptionHash, secret: redemptionSecret } = await driver.generateClaimSecret();
    //     const bytes = `0x${stringTo32Bytes(ens).toString('hex')}`;
    //     // @ts-ignore
    //     const { contentHash, name, timestamp } = await driver.pushENStoAztec(redemptionHash, consumptionHash, ethUsers.alice, bytes);
    //     // Clain ENS ownership on L2
    //     const noirComputedHash = await driver.getContentHash(aztecUsers.alice, redemptionHash, Buffer.from(name.slice(2), 'hex'), timestamp, ethUsers.alice);
    //     console.log('Content hash: ', contentHash);
    //     console.log('Noir computed hash: ', `0x${noirComputedHash.toString(16)}`);
    //     // await driver.stampENS(aztecUsers.alice);
    // })

    test("Keccak", async () => {
        let [expectedHash, empiricalHash] = await driver.getKeccak256(aztecUsers.alice);
        console.log("Expected Hash: ", expectedHash);
        console.log("Empirical Hash: ", empiricalHash);
        expect(expectedHash == empiricalHash);
    })


    // test("x", async () => {
    //     console.log("A");

    // })
})

