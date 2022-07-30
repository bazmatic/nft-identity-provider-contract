import { ethers as tsEthers } from "ethers";
import { NFT__factory } from "../../../build/typechain";
import { NFT } from "../../../build/typechain";
import { getSignerForDeployer } from "../utils";

export const contractNames = () => ["nft"];

export type NftConstructorArguments = [
  name: string,
  symbol: string,
  baseUri: string,
];

export function constructorArguments (): NftConstructorArguments {
  return [
    process.env.CONSTRUCTOR_NFT_NAME,
    process.env.CONSTRUCTOR_NFT_SYMBOL,
    process.env.CONSTRUCTOR_NFT_BASE_URI
  ]
};

const deployNFT = async (
  constructorArguments: NftConstructorArguments,
  signer?: tsEthers.Signer,
  waitCount = 1
) => {
  signer = signer ?? (await getSignerForDeployer());
  const NFT = new NFT__factory(signer);
  const contract = await NFT.deploy(
    constructorArguments[0], //name
    constructorArguments[1], //symbol
    constructorArguments[2]  //base URI
  );
  await contract.deployTransaction.wait(waitCount);
  return contract;
};

export const deploy = async (deployer, setAddresses) => {
  console.log("deploying NFT");
  const nftContract: NFT = await deployNFT(constructorArguments(), deployer, 1);
  console.log(`deployed NFT to address ${nftContract.address}`);
  setAddresses({ nft: nftContract.address });

  //Minting
  for (let i = 0; i < 10; i++) {
    const receipt = await nftContract.mint(process.env.DEMO_NFT_OWNER);
    await receipt.wait();
    const uri = await nftContract.tokenURI(i)
    console.log(`Minted ${uri}`);
  }

  return nftContract;
};
