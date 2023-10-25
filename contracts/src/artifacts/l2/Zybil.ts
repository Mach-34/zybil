
/* Autogenerated file, do not edit! */

/* eslint-disable */
import {
  AztecAddress,
  AztecAddressLike,
  CompleteAddress,
  Contract,
  ContractArtifact,
  ContractBase,
  ContractFunctionInteraction,
  ContractMethod,
  DeployMethod,
  EthAddress,
  EthAddressLike,
  FieldLike,
  Fr,
  Point,
  PublicKey,
  Wallet,
} from '@aztec/aztec.js';
import ZybilContractArtifactJson from './Zybil.json' assert { type: 'json' };
export const ZybilContractArtifact = ZybilContractArtifactJson as ContractArtifact;

/**
 * Type-safe interface for contract Zybil;
 */
export class ZybilContract extends ContractBase {
  
  private constructor(
    completeAddress: CompleteAddress,
    wallet: Wallet,
    portalContract = EthAddress.ZERO
  ) {
    super(completeAddress, ZybilContractArtifact, wallet, portalContract);
  }
  

  
  /**
   * Creates a contract instance.
   * @param address - The deployed contract's address.
   * @param wallet - The wallet to use when interacting with the contract.
   * @returns A promise that resolves to a new Contract instance.
   */
  public static async at(
    address: AztecAddress,
    wallet: Wallet,
  ) {
    return Contract.at(address, ZybilContract.artifact, wallet) as Promise<ZybilContract>;
  }

  
  /**
   * Creates a tx to deploy a new instance of this contract.
   */
  public static deploy(wallet: Wallet, signer: { x: FieldLike, y: FieldLike }) {
    return new DeployMethod<ZybilContract>(Point.ZERO, wallet, ZybilContractArtifact, Array.from(arguments).slice(1));
  }

  /**
   * Creates a tx to deploy a new instance of this contract using the specified public key to derive the address.
   */
  public static deployWithPublicKey(publicKey: PublicKey, wallet: Wallet, signer: { x: FieldLike, y: FieldLike }) {
    return new DeployMethod<ZybilContract>(publicKey, wallet, ZybilContractArtifact, Array.from(arguments).slice(2));
  }
  

  
  /**
   * Returns this contract's artifact.
   */
  public static get artifact(): ContractArtifact {
    return ZybilContractArtifact;
  }
  

  /** Type-safe wrappers for the public methods exposed by the contract. */
  public methods!: {
    
    /** compute_note_hash_and_nullifier(contract_address: field, nonce: field, storage_slot: field, preimage: array) */
    compute_note_hash_and_nullifier: ((contract_address: FieldLike, nonce: FieldLike, storage_slot: FieldLike, preimage: FieldLike[]) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** encode_msg(msg: array) */
    encode_msg: ((msg: FieldLike[]) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** getEthAddress(owner: field) */
    getEthAddress: ((owner: FieldLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** getScore(owner: struct) */
    getScore: ((owner: AztecAddressLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** initialize(signer_x: field, signer_y: field) */
    initialize: ((signer_x: FieldLike, signer_y: FieldLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** stamp_ens(redemption_hash: field, name: field, timestamp: field, msg_key: field, consumption_hash: field) */
    stamp_ens: ((redemption_hash: FieldLike, name: FieldLike, timestamp: FieldLike, msg_key: FieldLike, consumption_hash: FieldLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** stamp_ethkey(pubkey_x: array, pubkey_y: array, signature: array) */
    stamp_ethkey: ((pubkey_x: (bigint | number)[], pubkey_y: (bigint | number)[], signature: (bigint | number)[]) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** stamp_web2(signature: array, msg: array) */
    stamp_web2: ((signature: (bigint | number)[], msg: FieldLike[]) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;
  };
}
