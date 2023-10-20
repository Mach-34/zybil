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
import { Signer, Wallet, JsonRpcProvider, HDNodeWallet, Mnemonic } from 'ethers';

const {
    PXE_URL = 'http://localhost:8080',
    ETHEREUM_URL = 'http://localhost:8545',
    MNEMONIC = 'test test test test test test test test test test test junk'
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
        console.log("Driv", driver.zybil.address);
        logger("Initialized Test Environment")
    })

    test("x", async () => {
        console.log("A");
       
    })
})

