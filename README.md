# NiftID: NFT Identity Provider Contract

This contract allows the ownership of an NFT to confirm an identity, much as control of an email address is used to confirm an identity in other identity provider systems. 



# Registering

To register an identity with an NFT, call the `register` method, passing the address of the ERC-721 contract and the ID the token. 

```
nftIdentityProvider.register(erc721ContractAddress, tokenId)
```

You must own the token, or the transaction will be reverted.

If the token is transferred to a new owner, it is not useable as an identity until the new owner re-registers it.

# Checking an identity

To get your own identity, call `getMyIdentity()` via a signer attached to your own key. It will look up the NFT registered for your address, check that you own it, and if so return the identity's unique identifer, the metadata URI, the ERC-721 contract address and the token ID.

```
let [ identityIdentifier, uri, tokenContractAddress, tokenId ] = await nftIdentityProvider.getMyIdentity();
```

To get the identity for another address, call `getUserIdentity(userAddress)`. It will return the identity information for that address.

```
let [ identityIdentifier, uri, tokenContractAddress, tokenId ] = await nftIdentityProvider.getUserIdentity(userAddress);
```

# Attaching metadata

Metadata values can be attached to an identity. This can be used to add special properties to the NFT such as a name, URL, etc that are not part of the NFTs native metadata.

Only metadata keys that have been permitted by the contract owner may be used. Metadata keys may require unique values. To register a permitted metadata key and indicate that the values must be unique:

```
nftIdentityProvider.registerMetadataKey("myUniqueProperty", true);
```

To attach a metadata value to an NFT identity, pass the code for the Identity, the metadata key, and the value to assign.

```
nftIdentityProvider.addMetadata(identityIdentifier, "myUniqueProperty", "Bob the dog")
```

For unique metadata keys, you can also get the identity associated with the unique value:

```
const identity = nftIdentityProvider.getIdentityByUniqueMetadata("myUniqueProperty", "Bob the dog");
```
## Scripts

### hh:compile
Compiles the contracts with Hardhat

### hh:deploy
Runs the deployment script with the network set in `process.env.NETWORK`.

### hh:node
Starts a local hardhat node with the `localhost` network.

## Contracts
Contracts are located in the `/contracts` folder.

***There is an example ERC20 contract in `/contracts/Token.sol`***

## Configuration
See `/hardhat.config.ts` for hardhat configuration. Some values are fetched from environment variables, see `dev.env` for local development environment variables and copy it into `.env` before changing the values.

## Deployment
The deployment script is located in the `/scripts/deploy` folder. Each contract to be deployed should have its own deployment module.


***See `/scripts/deploy/contracts/Token.ts` for an example with an ERC20.***

### Contract addresses
Deployed addresses are saved in `/contracts.json` for each network. This file should be committed so that addresses are managed by git.

## Hardhat Tasks
Tasks are located in the `/scripts/tasks` folder.
A hardhat task allows for easy contract interaction from the command line. To run a contract task, run a command with the following structure:
```
npx hardhat <taskName>
  --network <networkName>
  [--argName <argValue>]
```
For the local hardhat network, use the default `localhost` value for `networkName`. 

### Example template tasks
#### accounts
```
npx hardhat accounts --network localhost
```
Output:
```
0xA39560b08FAF6d8Cd2aAC286479D25E0ea70f510: 10.0 ETH
```
#### mint
Minting the deployed example `Token.sol` as an ERC20 with 0 decimals.
```
npx hardhat mint --amount 1 --address 0xA39560b08FAF6d8Cd2aAC286479D25E0ea70f510 --network localhost
```
Output:
```
network is localhost
token address is 0x47A78de7a881CCa1a0f510efA2E520b447F707Bb
waiting for confirmation...
minted 1 for address 0xA39560b08FAF6d8Cd2aAC286479D25E0ea70f510
```
#### read-balance
Reading balance for the deployed example `Token.sol` as an ERC20 with 0 decimals.
```
npx hardhat read-balance --address 0xA39560b08FAF6d8Cd2aAC286479D25E0ea70f510 --network localhost
```
Output:
```
network is localhost
token address is 0x47A78de7a881CCa1a0f510efA2E520b447F707Bb
balance is 1 wei for address 0xA39560b08FAF6d8Cd2aAC286479D25E0ea70f510
```