import { ZybilContract } from "./l2/Zybil.js";
import ENSArtifact from './l1/ToyENS.json' assert { type: 'json' };
import EASArtifact from './l1/ToyEAS.json' assert { type: 'json' };
import PortalArtifact from './l1/ZybilPortal.json' assert { type: 'json' };
import { ContractFactory } from "ethers";

const ENSAbi = ENSArtifact.abi;
const ENSBytecode = ENSArtifact.bytecode;
const EASAbi = EASArtifact.abi;
const EASBytecode = EASArtifact.bytecode;
const PortalAbi = PortalArtifact.abi;
const PortalBytecode = PortalArtifact.bytecode;

const ENSFactory = new ContractFactory(ENSAbi, ENSBytecode);
const EASFactory = new ContractFactory(EASAbi, EASBytecode);
const PortalFactory = new ContractFactory(PortalAbi, PortalBytecode);

export {
    ZybilContract,
    ENSAbi,
    EASAbi,
    PortalAbi,
    ENSFactory,
    EASFactory,
    PortalFactory
}