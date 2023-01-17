// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

/// @title FixedPoint96
/// @notice A library for handling binary fixed point numbers, see https://en.wikipedia.org/wiki/Q_(number_format)
/// @dev Used in SqrtPriceMath.sol
library FixedPoint96 {
  uint8 internal constant RESOLUTION = 96;
  uint256 internal constant Q96 = 0x1000000000000000000000000; // 2^96
}
