// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract AirDrop {

    string[] public addresses;
    string public winner;
    bool public isDrawn = false;

    constructor(string[] memory _addresses) {
        addresses = _addresses;
    }

    function selectWinner() public {
        require(!isDrawn, "The winner is already selected.");
        uint256 index = block.prevrandao % addresses.length;
        winner = addresses[index];
        isDrawn = true;
    }

}