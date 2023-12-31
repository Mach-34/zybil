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
    waitForSandbox,
    CheatCodes
} from '@aztec/aztec.js';
import { ZybilDriver, ClaimSecret } from '../src/driver.js';
import { sleep } from '@aztec/aztec.js';
import { Signer, SigningKey, JsonRpcProvider, HDNodeWallet, Mnemonic, id, } from 'ethers';
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
    jest.setTimeout(1500000);

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
    let cc: CheatCodes;

    beforeAll(async () => {
        // initialize logger
        logger = createDebugLogger("aztec:zybil");

        // initialize sandbox connection
        const pxe = await createPXEClient(PXE_URL);

        // initialize eth signers
        const hdPath = "m/44'/60'/0'/0";
        ethUsers = {
            backend: HDNodeWallet.fromMnemonic(mnemonic, `${hdPath}/1`).connect(ethProvider),
            alice: HDNodeWallet.fromMnemonic(mnemonic, `${hdPath}/2`).connect(ethProvider),
            bob: HDNodeWallet.fromMnemonic(mnemonic, `${hdPath}/3`).connect(ethProvider),
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
        // initialize cheat codes
        cc = await CheatCodes.create(ETHEREUM_URL, pxe);
        logger("Initialized Test Environment")
    })

    test("Insert Gmail Stamp", async () => {
        // console.log(await driver.eas.getAddress());
        const verifiedData = { stampType: StampType.GOOGLE, id: 'Test@gmail.com' };
        const { msg, signature } = await generateSignatureAndMsg(verifiedData, GRUMPKIN_PRIV_KEY!);
        await driver.stampWeb2(aztecUsers.alice, msg, signature);
        const score = Number(await driver.getScore(aztecUsers.alice));
        expect(score).toEqual(4);
    });

    test("Insert Github Stamp", async () => {
        const verifiedData = { stampType: StampType.GITHUB, id: '19249235023632746335' };
        const { msg, signature } = await generateSignatureAndMsg(verifiedData, GRUMPKIN_PRIV_KEY!);
        await driver.stampWeb2(aztecUsers.alice, msg, signature);
        const score = Number(await driver.getScore(aztecUsers.alice));
        expect(score).toEqual(19);
    });

    test("Insert Discord Stamp", async () => {
        const verifiedData = { stampType: StampType.DISCORD, id: '9401783215792375383' };
        const { msg, signature } = await generateSignatureAndMsg(verifiedData, GRUMPKIN_PRIV_KEY!);
        await driver.stampWeb2(aztecUsers.alice, msg, signature);
        const score = Number(await driver.getScore(aztecUsers.alice));
        expect(score).toEqual(21);
    });

    test("Get Ethereum Address Stamp", async () => {
        await driver.stampEthAddress(aztecUsers.alice, ethUsers.alice);
        const score = Number(await driver.getScore(aztecUsers.alice));
        expect(score).toEqual(28);
    });

    test("Insert ENS Stamp", async () => {
        // Stamp eth address
        const ens = 'mach34.eth';
        await driver.setENSName(ens, ethUsers.alice);
        // Generate consumption and remdemption hash
        const { hash: consumptionHash, secret: consumptionSecret } = await driver.generateClaimSecret();
        const { hash: redemptionHash } = await driver.generateClaimSecret();
        // Push ENS from L1 to L2
        const { msgKey, name, timestamp } = await driver.pushENStoAztec(redemptionHash, consumptionHash, ethUsers.alice);
        // Make l2 transaction so l2 consumes l1 message during new block production
        await driver.stampEthAddress(aztecUsers.bob, ethUsers.bob);
        // Claim ENS on L2
        await driver.stampENS(aztecUsers.alice, redemptionHash, name, timestamp, msgKey, consumptionSecret);
        // Check that score is 28 (current stamp score) + 24 (ENS stamp value)
        const score = Number(await driver.getScore(aztecUsers.alice));
        expect(score).toEqual(52);
    })

    test("Test content hash", async () => {
        // get stamp root
        const root = await driver.getStampRoot(aztecUsers.alice);
        // send attestation from L2
        await driver.sendAttestationFromL2(aztecUsers.alice, ethUsers.alice);
        // consume attestation on L1
        await driver.consumeAttestationOnL1(ethUsers.alice, root);
        // get attestation stored on L1 and compare to expected root
        console.log("Expected Attestation: ", root);
        const attestation = await driver.getAttestation(ethUsers.alice);
        expect(attestation).toEqual(root);
    });
})

