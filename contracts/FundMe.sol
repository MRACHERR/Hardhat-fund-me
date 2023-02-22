//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "./PriceConverter.sol";

contract FundMe {
    using PriceConverter for uint256;
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address[] private s_funders;
    mapping(address => uint256) private s_AddressToAmountFunded;
    address private immutable i_owner;
    error FundMe__notOwner();

    AggregatorV3Interface private s_pricefeed;

    constructor(address pricefeedAddress) {
        i_owner = msg.sender;
        s_pricefeed = AggregatorV3Interface(pricefeedAddress);
    }

    function fund() public payable {
        require(
            msg.value.getConvertionRAte(s_pricefeed) > MINIMUM_USD,
            "Didn't send enought!"
        );
        s_funders.push(msg.sender);
        s_AddressToAmountFunded[msg.sender] = msg.value;
    }

    //withdraw()
    function withdraw() public OnlyOwner {
        for (
            uint256 FunderIndex = 0;
            FunderIndex < s_funders.length;
            FunderIndex++
        ) {
            address funder = s_funders[FunderIndex];
            s_AddressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        //transfer
        payable(msg.sender).transfer(address(this).balance);
        //send
        bool sendSuccess = payable(msg.sender).send(address(this).balance);
        require(sendSuccess, "send failed");

        //call
        (bool callsuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callsuccess, "Call failed");
    }

    modifier OnlyOwner() {
        //require(i_owner==msg.sender,"Sender is not the owner");

        //h
        if (i_owner != msg.sender) {
            revert FundMe__notOwner();
        }
        _;
    }

    function cheaperWithdraw() public OnlyOwner {
        address[] memory funders = s_funders;
        for (uint256 funderIndex; funderIndex < funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            s_AddressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunsders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_AddressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_pricefeed;
    }
}
