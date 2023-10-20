// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import {IRegistry} from "@aztec/l1-contracts/src/core/interfaces/messagebridge/IRegistry.sol";
import {IInbox} from "@aztec/l1-contracts/src/core/interfaces/messagebridge/IInbox.sol";
import {DataStructures} from "@aztec/l1-contracts/src/core/libraries/DataStructures.sol";
import {Hash} from "@aztec/l1-contracts/src/core/libraries/Hash.sol";
import {ToyENS, Record} from "./ToyENS.sol";

contract ZybilPortal {
    event L2Message(bytes32 _key);

    IRegistry public registry;
    ToyENS public underlying;
    bytes32 public l2ZybilAddress;
    bool initialized;

    function initialize(
        address _registry,
        address _underlying,
        bytes32 _l2ZybilAddress
    ) public {
        require(initialized == false, "Already initialized");
        registry = IRegistry(_registry);
        underlying = ToyENS(_underlying);
        l2ZybilAddress = _l2ZybilAddress;
        initialized = true;
    }

    /**
     * @notice Gets the age of an ENS record for the given account
     * @param _secretRedemptionHash - The hash of the secret to redeem minted notes privately on Aztec. The hash should be 254 bits (so it can fit in a Field element)
     * @param _address - the address to get ENS name for
     * @param _canceller - The address that can cancel the L1 to L2 message
     * @param _deadline - The timestamp after which the entry can be cancelled
     * @param _secretConsumptionHash - The hash of the secret consumable L1 to L2 message. The hash should be 254 bits (so it can fit in a Field element)
     * @return _key - The key of the entry in the Inbox
     */
    function pushENSToAztec(
        bytes32 _secretRedemptionHash,
        address _address,
        address _canceller,
        uint32 _deadline,
        bytes32 _secretConsumptionHash
    ) external payable returns (bytes32 _key) {
        // Preamble
        IInbox inbox = registry.getInbox();
        DataStructures.L2Actor memory actor = DataStructures.L2Actor(
            l2ZybilAddress,
            1
        );

        // get ens data
        (string memory name, uint256 timestamp) = getENSRecordAge(_address);

        // Hash message content to be reconstructed in the receiving contract
        bytes32 contentHash = Hash.sha256ToField(
            abi.encodeWithSignature(
                "stamp_ens(bytes32,bytes32,uint256,address)",
                _secretRedemptionHash,
                bytes32(bytes(name)),
                timestamp,
                _canceller
            )
        );

        // Send message to L2
        _key = inbox.sendL2Message{value: msg.value}(
            actor, _deadline, contentHash, _secretConsumptionHash
        );
    }

    function getENSRecordAge(
        address _account
    ) public view returns (string memory _name, uint256 _timestamp) {
        // get name (will fail if no ens registered)
        // todo: handle 256 bit names
        _name = underlying.getReverse(_account);
        // get timestamp = records
        (, , _timestamp) = underlying.records(_name);
    }
}
