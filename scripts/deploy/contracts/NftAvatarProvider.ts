import { ethers as tsEthers } from "ethers";
import { NftIdentityProvider, NftIdentityProvider__factory } from "../../../build/typechain";

import { getSignerForDeployer } from "../utils";

const CONTRACT_NAME = "nftAvatarProvider";

export const contractNames = () => [CONTRACT_NAME];

export type NftAvatarProviderConstructorArguments = [
    owner: string,
];

export function constructorArguments (): NftAvatarProviderConstructorArguments {
    return [
        process.env.CONSTRUCTOR_NFT_AVATAR_PROVIDER_OWNER
    ]
};

const deployAvatarProvider = async (
    constructorArguments: NftAvatarProviderConstructorArguments,
    signer?: tsEthers.Signer,
    waitCount = 1
) => {
    signer = signer ?? (await getSignerForDeployer());
    const nftAvatarProvider = new NftIdentityProvider__factory(signer);
    const contract = await nftAvatarProvider.deploy(
        constructorArguments[0], //owner
    );
    await contract.deployTransaction.wait(waitCount);
    return contract;
};

export const deploy = async (deployer, setAddresses) => {
    console.log("deploying NFT Avatar Provider");
    const contract: NftIdentityProvider = await deployAvatarProvider(constructorArguments(), deployer, 1);
    console.log(`deployed NFT Avatar Provider to address ${contract.address}`);
    setAddresses({ [CONTRACT_NAME]: contract.address });
    return contract;
};
