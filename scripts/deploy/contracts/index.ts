import { ethers as tsEthers } from "ethers";
import * as NftDemo from "./NFT";
import * as NftAvatarProvider from "./NftAvatarProvider";

export interface DeploymentModule {
  contractNames: (...params: any) => string[];
  constructorArguments: (addresses?: any) => any[];
  deploy: (
    deployer: tsEthers.Signer,
    setAddresses: Function,
    addresses?: any
  ) => Promise<tsEthers.Contract>;
  upgrade?: (deployer: tsEthers.Signer, addresses?: any) => void;
}

const modules: DeploymentModule[] = [NftAvatarProvider, NftDemo];

export default modules;
