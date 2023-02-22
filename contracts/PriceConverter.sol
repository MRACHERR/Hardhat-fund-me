//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(
        AggregatorV3Interface pricefeed
    ) internal view returns (uint256) {
        (, int price, , , ) = pricefeed.latestRoundData();
        return uint256(price * 1e10);
    }

    function getConvertionRAte(
        uint256 ethAmount,
        AggregatorV3Interface pricefeed
    ) internal view returns (uint256) {
        uint256 ethprice = getPrice(pricefeed);
        uint256 ethPriceInUsd = (ethprice * ethAmount) / 1e18;
        return ethPriceInUsd;
    }
}
