// import { viem } from 'hardhat';

// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// async function main() {
//     const publicClient = await viem.getPublicClient();
//     const chainId = await publicClient.getChainId();
//     console.log(`====================================`);
//     console.log(`Deploying Zybil L1 Contracts to ${chainId}...`)

//     // deploy ToyENS
//     const ens = await viem.deployContract("ToyEns");

//     // deploy zybil portal
//     const portal = await viem.deployContract("ZybilPortal",);

//     console.log(`ToyENS.sol deployed to ${ens.address}`);
//     console.log(`ZybilPortal.sol deployed to ${portal.address}`);
//     console.log(`====================================`);
// }

// main()
//     .then(() => process.exit(0))
//     .catch(error => {
//         console.error(error);
//         process.exit(1);
//     });