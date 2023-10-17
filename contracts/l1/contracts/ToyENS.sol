// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

struct Record {
    string name;
    address addr;
    uint256 timestamp;
}

/* Onchain contract registry with the following features:
 * stores the list of mapped names
 */

contract ToyENS {
    event Set(string name, address addr);

    // address can only have one ens in toy
    mapping(address => string) public reverse;
    mapping(string => Record) public records;
    string[] names;

    /* ! Warning ! */
    /* ToyENS should not have any constructor code because its deployed code is sometimes directly written to addresses, either using vm.etch or using anvil_setCode. */

    function get(
        string calldata _name
    ) public view returns (address payable _addr) {
        _addr = payable(records[_name].addr);
        require(_addr != address(0), "ToyENS: address not found");
    }

    function getReverse(
        address _addr
    ) public view returns (string memory _name) {
        _name = reverse[_addr];
        require(bytes(_name).length != 0, "ToyENS: name not found");
    }

    function set(string calldata _name, address _addr) public {
        require(_addr != address(0), "ToyENS: cannot record a name as 0x0");
        if (records[_name].addr == address(0)) {
            names.push(_name);
        } else {
            address old = records[_name].addr;
            delete reverse[old];
        }
        records[_name] = Record({
            name: _name,
            addr: _addr,
            timestamp: block.timestamp
        });
        reverse[_addr] = _name;
        emit Set(_name, _addr);
    }

    function set(string[] calldata _names, address[] calldata _addrs) external {
        for (uint i = 0; i < _names.length; i++) {
            set(_names[i], _addrs[i]);
        }
    }

    function all() external view returns (Record[] memory _records) {
        _records = new Record[](names.length);
        for (uint i = 0; i < names.length; i++) {
            _records[i] = records[names[i]];
        }
    }
}
