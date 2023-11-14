// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

contract ToyEAS {
    mapping(address => uint256) public attestations;
    address public portal;
    bool public initialized = false;

    /**
     * Initialize the contract to 
     */
    function initialize(address _portal) external {
        require(!initialized, "Contract already initialized");
        portal = _portal;
        initialized = true;
    }

    /**
     * Attest to a root of stamps on L2
     *
     * @param _root - the merkle root of the stamps on L2
     * @param _from - the caller on L1 who is attesting
     */
    function attest(address _from, uint256 _root) external {
        // mimics attester role in EAS by hardcoding portal to attest
        require(msg.sender == portal, "Only portal can attest");
        // set the attestation for the address
        attestations[_from] = _root;
    }
}