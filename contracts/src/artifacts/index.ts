import { ZybilContract } from "./l2/Zybil.js";
import ENSArtifact from './l1/ToyENS.json' assert { type: 'json' };
import PortalArtifact from './l1/ZybilPortal.json' assert { type: 'json' };
import { ContractFactory } from "ethers";

const ENSAbi = ENSArtifact.abi;
const ENSBytecode = ENSArtifact.bytecode;
const PortalAbi = PortalArtifact.abi;
const PortalBytecode = PortalArtifact.bytecode;

const ENSFactory = new ContractFactory(ENSAbi, ENSBytecode);
const PortalFactory = new ContractFactory(PortalAbi, PortalBytecode);

export {
    ZybilContract,
    ENSAbi,
    PortalAbi,
    ENSFactory,
    PortalFactory
}