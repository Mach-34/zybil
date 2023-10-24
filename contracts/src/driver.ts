import {
    AztecAddress,
    DebugLogger,
    EthAddress,
    FieldLike,
    Fr,
    NotePreimage,
    PXE,
    TxHash,
    TxStatus,
    Wallet as AztecWallet,
    computeMessageSecretHash,
    AccountWallet,
} from '@aztec/aztec.js';
import { OutboxAbi } from '@aztec/l1-artifacts';
import { Signer, Contract, SigningKey } from 'ethers';
import { ZybilContract } from './artifacts/l2/Zybil.js';
import { ENSFactory, PortalFactory } from './artifacts/index.js'
import { hexTou8Array } from './utils.js';

const DEADLINE = 2 ** 32 - 1; // message expiry deadline

export type ClaimSecret = {
    secret: Fr;
    hash: Fr;
}

/**
 * Deploy L1 and L2 contracts
 * @param aztecWallet - the aztec wallet instance
 * @param ethWallet - the ethers signer instance
 * @param registry - address of L1 rollup registry to pass to initialize the token portal
 * @returns 
 *  - zybil: instance of deployed Zybil Contract on L2
 *  - portal: instance of deployed Portal contract on L1
 *  - ens: instance of deployed ToyENS contract on L1
 */
export async function deployAndInitialize(
    aztecWallet: AztecWallet,
    ethWallet: Signer,
    registry: EthAddress,
): Promise<{
    zybil: AztecAddress;
    portal: Contract;
    ens: Contract;
}> {
    // if underlying L1 contract address is not supplied, deploy it
    const ensFactory = ENSFactory.connect(ethWallet);
    const ens = await ensFactory.deploy() as Contract;
    await ens.waitForDeployment();

    // deploy L1 portal contract
    const portalFactory = PortalFactory.connect(ethWallet);
    const portal = await portalFactory.deploy() as Contract;
    await portal.waitForDeployment();


    // deploy instance of L2 Zybil Contract using deployer as backend
    const backend = aztecWallet.getCompleteAddress().publicKey;
    const deployReceipt = await ZybilContract.deploy(aztecWallet, { x: backend.x, y: backend.y })
        .send({ portalContract: EthAddress.fromString(await portal.getAddress()) })
        .wait();

    // check that the deploy tx is confirmed
    if (deployReceipt.status !== TxStatus.MINED) throw new Error(`Deploy token tx status is ${deployReceipt.status}`);
    const zybil = await ZybilContract.at(deployReceipt.contractAddress!, aztecWallet);

    // check backend is set correctly
    // if ((await ))
    // if ((await token.methods.admin().view()) !== owner.toBigInt()) throw new Error(`Token admin is not ${owner}`);

    // initialize L1 portal
    let tx = await portal.initialize(
        registry.toString(),
        await ens.getAddress(),
        zybil.address.toString()
    );
    await tx.wait();

    // return contract addresses
    return { zybil: zybil.address, portal, ens };
}

/**
 * A Class for driving actions across l1 and l2 for Zybil
 */
export class ZybilDriver {

    /**
     * Create a new cross-chain test harness
     * 
     * @param pxe - private execution environment instance for aztec
     * @param aztecWallet - aztec wallet to deploy with
     * @param ethWallet - ethers signer to deploy with
     * @param logger - debug logger for aztec rpc calls
     * @returns - new ZybilDriver instance
     */
    static async new(
        pxe: PXE,
        aztecWallet: AztecWallet,
        ethWallet: Signer,
        logger: DebugLogger,
    ): Promise<ZybilDriver> {
        aztecWallet.getCompleteAddress().address;
        const l1ContractAddresses = (await pxe.getNodeInfo()).l1ContractAddresses;

        const outbox = new Contract(
            l1ContractAddresses.outboxAddress.toString(),
            [...OutboxAbi],
            ethWallet
        );

        // Deploy and initialize all required contracts
        logger('Deploying and initializing token, portal and its bridge...');
        const { zybil, portal, ens } = await deployAndInitialize(
            aztecWallet,
            ethWallet,
            l1ContractAddresses.registryAddress,
        );
        logger('Deployed and initialized token, portal and its bridge.');

        return new ZybilDriver(
            pxe,
            logger,
            zybil,
            portal,
            ens,
            outbox,
            aztecWallet
        );
    }

    constructor(
        /** Private eXecution Environment (PXE). */
        public pxe: PXE,
        /** Logger. */
        public logger: DebugLogger,
        /** L2 Token contract. */
        public zybil: AztecAddress,
        /** Token portal instance. */
        public portal: Contract,
        /** Underlying token for portal tests. */
        public ens: Contract,
        /** Message Bridge Outbox. */
        public outbox: Contract,
        /** Backend Address */
        public backend: AztecWallet,
    ) { }

    /**
     * Generates a claim secret and hashes it for use in cross-chain redemption and consumption
     * 
     * @returns - ClaimSecret onject containing the secret and the pedersen hash of the secret
     */
    async generateClaimSecret(): Promise<ClaimSecret> {
        this.logger("Generating a claim secret using pedersen's hash function");
        const secret = Fr.random();
        const hash = await computeMessageSecretHash(secret);
        this.logger('Generated claim secret: ' + hash.toString(true));
        return { secret, hash };
    }

    /**
     * Sets the ENS address for a given signer on L1
     * @notice - name should be < 31 characters
     * 
     * @param name - the name to set for the signer
     * @param from - the signer with provider to use to broadcast the l1 transaction
     */
    async setENSName(name: string, from: Signer) {
        const tx = await (this.ens.connect(from) as Contract).set(name);
        await tx.wait();
    }

    /**
     * Publish an existing ENS address on L1 through the Aztec portal to L2
     * 
     * @param redemptionHash - the hash of a claim secret to use for private l2 redemption
     * @param consumptionHash - the hash of a claim secret to use to publish a message on l1 to l2
     * @param from - the signer with provider to use to broadcast the l1 transaction
     */
    async pushENStoAztec(redemptionHash: Fr, consumptionHash: Fr, from: Signer): Promise<Fr> {
        const tx = await (this.portal.connect(from) as Contract).pushENSToAztec(
            DEADLINE,
            redemptionHash,
            consumptionHash
        );
        const receipt = await tx.wait();
        return Fr.fromString(receipt.logs[0].args[0]);
    }

    async stampEthAddress(aztecWallet: AccountWallet, ethWallet: Signer): Promise<void> {
        // generate inputs for eth address verification stamp
        const aztecAddress = aztecWallet.getAddress();
        const signature = await ethWallet.signMessage(aztecAddress.toString())
        const serialized = SigningKey.recoverPublicKey(aztecAddress.toString(), signature);
        const inputs = {
            // slice off sig_v (end)
            signature: hexTou8Array(signature.slice(0, -2)),
            // slice off `0x04` from serialized pubkey
            pubkey: {
                x: hexTou8Array(serialized.slice(4, 68)),
                y: hexTou8Array(serialized.slice(68))
            }
        }
        // stamp eth address in L2 Zybil contract
        const instance = await ZybilContract.at(this.zybil, aztecWallet);
        const receipt = await instance.methods.stamp_ethkey(
            inputs.pubkey.x,
            inputs.pubkey.y,
            inputs.signature
        ).send().wait();
        // throw if tx does not mine
        if (receipt.status !== TxStatus.MINED)
            throw new Error(`Failed to stamp Eth Address: ${receipt.status}`);
    }

    async stampWeb2(aztecWallet: AccountWallet, msg: Array<FieldLike>, signature: Uint8Array): Promise<void> {
        const instance = await ZybilContract.at(this.zybil, aztecWallet);
        const receipt = await instance.methods.stamp_web2(Array.from(signature), msg).send().wait();
        console.log('Receipt: ', receipt);
    }

    async getStampId(aztecWallet: AccountWallet): Promise<void> {
        const instance = await ZybilContract.at(this.zybil, aztecWallet);
        const receipt = await instance.methods.getScore(aztecWallet.getAddress()).view();
        console.log('Receipt: ', receipt);
    }
}