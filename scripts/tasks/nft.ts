import { task } from "hardhat/config";
import contracts from "../../contracts.json";
import { ethers as tsEthers } from "ethers";
import { getLedgerSigner } from "../utils";

task("mint")
    .addParam("address")
    .setAction(async (args, hre) => {
        let signer: tsEthers.Signer;
        if (!args.ledgersigner) {
            signer = (await hre.ethers.getSigners())[0];
        } else {
            signer = getLedgerSigner(args.ledgersigner, hre.ethers.provider);
        }
        const contractAddress = contracts[hre.network.name].NFT;
        console.log(`network is ${hre.network.name}`);
        console.log(`token address is ${contractAddress}`);
        const nftContract = (await hre.ethers.getContractFactory("NFT"))
        .attach(contractAddress)
        .connect(signer);

        const receipt = await nftContract.mint(args.address);
        console.log("waiting for confirmation...");
        await receipt.wait(1);
        console.log(`minted ${args.amount} for address ${args.address}`);
    });
