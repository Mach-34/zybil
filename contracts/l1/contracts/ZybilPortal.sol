// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import {IRegistry} from "@aztec/l1-contracts/src/core/interfaces/messagebridge/IRegistry.sol";
import {IInbox} from "@aztec/l1-contracts/src/core/interfaces/messagebridge/IInbox.sol";
import {DataStructures} from "@aztec/l1-contracts/src/core/libraries/DataStructures.sol";
import {Hash} from "@aztec/l1-contracts/src/core/libraries/Hash.sol";
import {ToyENS, Record} from "./ToyENS.sol";
import {ToyEAS} from "./ToyEAS.sol";

contract ZybilPortal {
    event L2Message(
        bytes32 _key,
        bytes32 _name,
        uint256 _timestamp,
        address _address
    );
    event L1MSG(bytes32 _key);

    IRegistry public registry;
    ToyENS public ens;
    ToyEAS public eas;
    // address public eas;

    bytes32 public l2ZybilAddress;
    bool initialized;

    function initialize(
        address _registry,
        address _ens,
        address _eas,
        bytes32 _l2ZybilAddress
    ) public {
        require(initialized == false, "Already initialized");
        registry = IRegistry(_registry);
        ens = ToyENS(_ens);
        eas = ToyEAS(_eas);
        // eas = _eas;
        l2ZybilAddress = _l2ZybilAddress;
        initialized = true;
    }

    /**
     * Gets the age of an ENS record for the given account
     * @notice uses msg.sender for ens lookup and canceller
     *
     * @param _deadline - The timestamp after which the entry can be cancelled
     * @param _redemptionHash - The hash of the secret to redeem minted notes privately on Aztec. The hash should be 254 bits (so it can fit in a Field element)
     * @param _consumptionHash - The hash of the secret consumable L1 to L2 message. The hash should be 254 bits (so it can fit in a Field element)
     * @return _key - The key of the entry in the Inbox
     */
    function pushENSToAztec(
        uint32 _deadline,
        bytes32 _redemptionHash,
        bytes32 _consumptionHash
    )
        external
        payable
        returns (
            // bytes32 _timestamp
            bytes32 _key
        )
    {
        // Preamble
        IInbox inbox = registry.getInbox();
        DataStructures.L2Actor memory actor = DataStructures.L2Actor(
            l2ZybilAddress,
            1
        );

        // get ens data
        (string memory name, uint256 timestamp) = getENSRecordAge(msg.sender);

        // Hash message content to be reconstructed in the receiving contract
        bytes32 nameBytes = bytes32(padZeros(bytes(name), 32));
        bytes32 contentHash = Hash.sha256ToField(
            abi.encodeWithSignature(
                "stamp_ens(bytes32,bytes32,uint256,address)",
                _redemptionHash,
                nameBytes,
                timestamp,
                msg.sender
            )
        );

        // Send message to L2
        _key = inbox.sendL2Message{value: msg.value}(
            actor,
            _deadline,
            contentHash,
            _consumptionHash
        );

        // Emit event to retrieve from L2
        emit L2Message(_key, nameBytes, timestamp, msg.sender);
    }

    function attestToStamps(uint256 _root) external returns (bytes32) {
        // compute content hash
        DataStructures.L2ToL1Msg memory message = DataStructures.L2ToL1Msg({
            sender: DataStructures.L2Actor(l2ZybilAddress, 1),
            recipient: DataStructures.L1Actor(address(this), block.chainid),
            content: Hash.sha256ToField(
                abi.encodeWithSignature(
                    "attest(address, uint256)",
                    msg.sender,
                    _root
                )
            )
        });

        // consume message
        bytes32 key = registry.getOutbox().consume(message);
        // perform attestation
        eas.attest(msg.sender, _root);
        // emit key
        emit L1MSG(key);
        // return message key
        return key;
    }

    function getENSRecordAge(
        address _account
    ) public view returns (string memory _name, uint256 _timestamp) {
        // get name (will fail if no ens registered)
        // todo: handle 256 bit names
        _name = ens.getReverse(_account);
        // get timestamp = records
        (, , _timestamp) = ens.records(_name);
    }

    /**
     * Add leading zeroes to the beginning of the ens name converted to bytes. By default solidity pads zeros to the end
     * of the string when converted to bytes32 and this hexidecimal representation often exceeds the field size
     *
     * TODO
     */
    function padZeros(
        bytes memory original,
        uint256 totalLength
    ) public pure returns (bytes memory) {
        require(
            totalLength >= original.length,
            "Total length must be greater than or equal to the original length"
        );

        bytes memory padded = new bytes(totalLength);
        uint256 paddingLength = totalLength - original.length;

        for (uint256 i = 0; i < original.length; i++) {
            padded[i + paddingLength] = original[i];
        }

        return padded;
    }
}
