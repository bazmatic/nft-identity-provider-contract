// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// E.g: name, ipfsHash, etc.
struct MetadataItem {
    string key;
    string value;
}

// Struct to hold token ERC721 contract address and ID
struct Identity {
    ERC721URIStorage tokenContract;
    uint256 tokenID;
    bytes32 code;
    bool exists;
}

enum MetadataConstraint {
    NotPermitted,
    Any,
    Unique
}

contract NftIdentityProvider {
    address public owner;
    //Map address to Identity code
    mapping (address => bytes32) public identityCodeRegistry;

    // Map code to Identity
    mapping (bytes32 => Identity) public identityRegistry;

    // Permitted metadata keys
    mapping (bytes32 => MetadataConstraint) public permittedMetadataKeys;

    // For unique metadata keys, map metadata key to a mapping of values to the identity code
    mapping (bytes32 => mapping(bytes32 => bytes32)) public uniqueMetadataRegistry;

    //Permitted metadata keys
    bytes32[] public metadataKeys;

    //Mapping of identity to metadata array
    mapping (bytes32 => MetadataItem[]) public metadataRegistry;

    // Constructor
    constructor (address _owner) {
        owner = _owner;
        registerMetadataKey("name", true);
    }

    // Function to allow a user to register their address with an ERC721 contract and a token ID
    // @param _tokenContract Address of ERC721 contract
    // @param _tokenID Token ID
    // @param _name Unique name for the identity
    function register(
        ERC721URIStorage _tokenContract,
        uint256 _tokenID
    ) onlyTokenOwner(_tokenContract, _tokenID) public {
        bytes32 _nftIdentityCode = identityCode(address(_tokenContract), _tokenID);

        // If this NFT has not already been registered, register it
        if (!identityRegistry[_nftIdentityCode].exists) {
            Identity memory _identity;
            _identity.tokenContract = _tokenContract;
            _identity.tokenID = _tokenID;
            _identity.code = _nftIdentityCode;
            _identity.exists = true;
            // Add struct to identity registry
            identityRegistry[_nftIdentityCode] = _identity;
        }

        // Associate the sender with the identity   
        identityCodeRegistry[msg.sender] = _nftIdentityCode;
    }

    // Allow a metadata key to be used
    function registerMetadataKey(string memory key, bool requireUniqueValues) public
    onlyOwner()
    {
        // Hash of key
        bytes32 _key = keccak256(bytes(key));
        permittedMetadataKeys[_key] = requireUniqueValues ? MetadataConstraint.Unique : MetadataConstraint.Any;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    modifier onlyTokenOwner(ERC721 _tokenContract, uint256 _tokenID) {
        require(address(_tokenContract) != address(0), "Token contract address cannot be 0");
        address _tokenOwner = _tokenContract.ownerOf(_tokenID);
        require(msg.sender == _tokenContract.ownerOf(_tokenID), "You are not the owner of the supplied identity token");
        _;
    }

    modifier onlyPermittedMetadataKey(string memory key) {
        bytes32 _key = keccak256(bytes(key));
        require(permittedMetadataKeys[_key] != MetadataConstraint.Any, "Metadata key is not permitted");
        _;
    }

    function addIdentityMetadata(
        string memory key,
        string memory value
    ) public 
    onlyPermittedMetadataKey(key) 
    {
        require (isPermittedMetadataKey(key), "Metadata key is not permitted");
    
        // Hashes of key and value
        bytes32 _key = keccak256(bytes(key));
        bytes32 _value = keccak256(bytes(value));
        MetadataItem memory metadataItem = MetadataItem(key, value);

        bytes32 code = identityCodeRegistry[msg.sender];

        // If the key requires unique values, check if the value is already in the registry
        if (permittedMetadataKeys[_key] == MetadataConstraint.Unique) {
            require(uniqueMetadataRegistry[_key][_value] == 0, "Metadata value is already in use");
            // Add the value to the registry of unique metadata
            uniqueMetadataRegistry[_key][_value] = code;
        }
        // Add metadata item to identity   
        metadataRegistry[code].push(metadataItem);
    }

    function isPermittedMetadataKey(string memory key) public view returns (bool) {
        bytes32 _key = keccak256(bytes(key));
        return permittedMetadataKeys[_key] != MetadataConstraint.NotPermitted;
    }

    function getOwnerOf(ERC721URIStorage _tokenContract, uint256 _tokenID) public view returns (address) {
        return _tokenContract.ownerOf(_tokenID);
    }

    function whoami() public view returns (address) {
        return msg.sender;
    }

    // Return hash of token contract and ID
    function identityCode(address addr, uint256 tokenID) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(addr, tokenID));
    }

    function getMyIdentity() public view returns (bytes32, string memory, address, uint256) {
        return getUserIdentity(msg.sender);
    }

    function getUserIdentity(address user) public view returns (bytes32, string memory, address, uint256) {
        Identity memory identity = _getUserIdentity(user);
        return (identity.code, identity.tokenContract.tokenURI(identity.tokenID), address(identity.tokenContract), identity.tokenID);
    }

    function getIdentityCodeByUniqueKey(string memory key, string memory value) public view returns (bytes32) {
        bytes32 _key = keccak256(bytes(key));
        bytes32 _value = keccak256(bytes(value));
        return uniqueMetadataRegistry[_key][_value];
    }

    function _getUserIdentity(address user) private view returns (Identity memory) {
        // Get token address and ID from registry
        bytes32 _code = identityCodeRegistry[user];
        require(_code != bytes32(0), "User has not registered an identity");
        Identity memory identity = identityRegistry[_code];
        require(identity.exists, "Missing identity");
        require(user == identity.tokenContract.ownerOf(identity.tokenID), "User is not the owner of the registered identity token");
        return identity;
    }

    function getIdentityMetadata(bytes32 _code) public view returns (MetadataItem[] memory) {
        // Look up the metadata
        return metadataRegistry[_code];
    }
}