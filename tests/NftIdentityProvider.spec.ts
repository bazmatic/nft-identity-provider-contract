
import { ethers } from "hardhat"
import { expect } from "chai"

const BASE_URI_CRYPTOSPUNKS = "https://cryptospunks.io/nft/";
import { NFT, NftIdentityProvider, NftIdentityProvider__factory, NFT__factory } from "../build/typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

//import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
const YOU_NOT_OWNER_ERROR = "You are not the owner of the supplied identity token";
const NOT_OWNER_ERROR = "User is not the owner of the registered identity token";

let nftContract: NFT;
let nftIdentityProviderContract: NftIdentityProvider;
let nftIdentityProviderForDeployer: NftIdentityProvider;
let nftIdentityProviderForUser1: NftIdentityProvider;
let nftIdentityProviderForUser2: NftIdentityProvider;
let deployerAccount: SignerWithAddress;
let userAccount1: SignerWithAddress;
let userAccount2: SignerWithAddress;

describe.only("NFT Identity Provider", function () {
    beforeEach("Should deploy contracts", async function () {
        [ deployerAccount, userAccount1, userAccount2 ] = await ethers.getSigners();
        nftContract = await new NFT__factory(deployerAccount).deploy(
            "CryptoSpunks",
            "CSPUNX",
            BASE_URI_CRYPTOSPUNKS
        );
        expect(await nftContract.symbol()).to.equal("CSPUNX");

        //Deploy NFT Identity Provider
        nftIdentityProviderContract = await new NftIdentityProvider__factory(deployerAccount).deploy(deployerAccount.address);
        expect(nftIdentityProviderContract.address).to.contain('0x')

        nftIdentityProviderForDeployer = nftIdentityProviderContract.connect(deployerAccount);
        nftIdentityProviderForUser1 = nftIdentityProviderContract.connect(userAccount1);
        nftIdentityProviderForUser2 = nftIdentityProviderContract.connect(userAccount2);

        //const tokenURI = `${BASE_URI_CRYPTOSPUNKS}${tokenId}`;ß
        let nft = nftContract.connect(deployerAccount)
        await nft.mint(deployerAccount.address);
        await nft.mint(userAccount1.address);
        await nft.mint(userAccount2.address);
        const uri = await nft.tokenURI(1);

        expect(uri).to.equal(`${BASE_URI_CRYPTOSPUNKS}${1}`);
        expect(await nft.ownerOf(0)).to.equal(deployerAccount.address);
        expect(await nft.ownerOf(1)).to.equal(userAccount1.address);
        expect(await nft.ownerOf(2)).to.equal(userAccount2.address);


    });

    it("Should not be able to associate an identity with a token if you are not the owner", async function () {
        const nftIdentityProvider = nftIdentityProviderContract.connect(userAccount1)
        await expect(nftIdentityProvider.register(nftContract.address, 2)).to.be.revertedWith(YOU_NOT_OWNER_ERROR);
    }); 
    
    it("Associate an identity with a token", async function () {
        const tokenId = 1;

        let nft = nftContract.connect(deployerAccount);
        const tokenOwner = await nft.ownerOf(tokenId)
        expect(tokenOwner).to.equal(userAccount1.address);
        expect(await nftIdentityProviderForUser1.signer.getAddress()).to.equal(userAccount1.address);

        await nftIdentityProviderForUser1.register(nftContract.address, tokenId);
        
        let [ _code, uri, contractAddress, returnedTokenId ] = await nftIdentityProviderForUser1.getMyIdentity();
        
        const nftUri = await nftContract.tokenURI(tokenId);

        expect(uri).to.equal(nftUri, "NFT address is not correct");
        expect(contractAddress).to.equal(nftContract.address, "NFT address is not correct");
        expect(returnedTokenId).to.equal(1, "Token ID is not correct");

        [ _code, uri, contractAddress, returnedTokenId ] = await nftIdentityProviderForDeployer.getUserIdentity(userAccount1.address);
        
        expect(uri).to.equal(nftUri, "NFT address is not correct");
        expect(contractAddress).to.equal(nftContract.address, "NFT address is not correct");
        expect(returnedTokenId).to.equal(tokenId, "Token ID is not correct");

    }); 

    it("Should not be able to log in if you are no longer the owner of the NFT", async function () {

        await nftIdentityProviderForUser1.register(nftContract.address, 1);

        //Send the NFT away
        const nft = nftContract.connect(userAccount1)
        await nft.transferFrom(userAccount1.address, userAccount2.address, 1);

        expect(nftIdentityProviderForUser1.getMyIdentity()).to.be.revertedWith(NOT_OWNER_ERROR)
        expect(nftIdentityProviderForUser1.getUserIdentity(userAccount1.address)).to.be.revertedWith(NOT_OWNER_ERROR)
    });

    it("Contract owner should be able to register a metadata key", async function () {
        await nftIdentityProviderForDeployer.registerMetadataKey("species", true);
        expect(await nftIdentityProviderForDeployer.isPermittedMetadataKey("species")).to.equal(true);
    });


    it("Should not be able to add a metadata value to an unregistered key", async function () {
        await nftIdentityProviderForUser1.register(nftContract.address, 1);
        expect(nftIdentityProviderForUser1.addIdentityMetadata("species", "skunk")).to.be.reverted;
    });

    it("Should be able to add a metadata value to a registered key", async function () {
        await nftIdentityProviderForDeployer.registerMetadataKey("species", true);   
        await nftIdentityProviderForUser1.register(nftContract.address, 1);
        expect(nftIdentityProviderForUser1.addIdentityMetadata("species", "skunk")).to.not.be.reverted;
    });

    it("Should not be able to add a duplicate metadata value if it requires unique values", async function () {
        await nftIdentityProviderForDeployer.registerMetadataKey("species", true); 

        await nftIdentityProviderForUser1.register(nftContract.address, 1);
        await nftIdentityProviderForUser1.addIdentityMetadata("species", "skunk");

        await nftIdentityProviderForUser2.register(nftContract.address, 2);
        expect(nftIdentityProviderForUser2.addIdentityMetadata("species", "skunk")).to.be.reverted;
    });

    it.only("Should return metadata", async function () {
        await nftIdentityProviderForDeployer.registerMetadataKey("species", true); 

        await nftIdentityProviderForUser1.register(nftContract.address, 1);
        await nftIdentityProviderForUser1.addIdentityMetadata("species", "skunk");
        let [ code ] = await nftIdentityProviderForUser1.getMyIdentity();

        const metadata = await nftIdentityProviderForUser1.getIdentityMetadata(code);
        const speciesMetadata = metadata.find(m => m.key === "species");
        expect(speciesMetadata.value).to.equal("skunk", "Species is not correct");
    });
});



