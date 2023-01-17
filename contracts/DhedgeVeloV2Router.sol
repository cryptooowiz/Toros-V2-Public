//
//        __  __    __  ________  _______    ______   ________
//       /  |/  |  /  |/        |/       \  /      \ /        |
//   ____$$ |$$ |  $$ |$$$$$$$$/ $$$$$$$  |/$$$$$$  |$$$$$$$$/
//  /    $$ |$$ |__$$ |$$ |__    $$ |  $$ |$$ | _$$/ $$ |__
// /$$$$$$$ |$$    $$ |$$    |   $$ |  $$ |$$ |/    |$$    |
// $$ |  $$ |$$$$$$$$ |$$$$$/    $$ |  $$ |$$ |$$$$ |$$$$$/
// $$ \__$$ |$$ |  $$ |$$ |_____ $$ |__$$ |$$ \__$$ |$$ |_____
// $$    $$ |$$ |  $$ |$$       |$$    $$/ $$    $$/ $$       |
//  $$$$$$$/ $$/   $$/ $$$$$$$$/ $$$$$$$/   $$$$$$/  $$$$$$$$/
//
// dHEDGE DAO - https://dhedge.org
//
// Copyright (c) 2022 dHEDGE DAO
//
// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/velodrome/IVelodromeRouter.sol";
import "./interfaces/uniswapv2/IUniswapV2RouterSwapOnly.sol";

contract DhedgeVeloV2Router is IUniswapV2RouterSwapOnly {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  IVelodromeRouter public velo;

  constructor(IVelodromeRouter _velo) {
    velo = _velo;
  }

  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external override returns (uint256[] memory amountsOut) {
    (, bool stable) = velo.getAmountOut(amountIn, path[0], path[1]);

    IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

    IVelodromeRouter.route[] memory routes = new IVelodromeRouter.route[](1);
    routes[0] = IVelodromeRouter.route({from: path[0], to: path[1], stable: stable});

    IERC20(path[0]).approve(address(velo), amountIn);
    amountsOut = velo.swapExactTokensForTokens(amountIn, amountOutMin, routes, to, deadline);

    require(amountsOut[path.length - 1] >= amountOutMin, "too much slippage");
  }

  function swapTokensForExactTokens(
    uint256,
    uint256,
    address[] calldata,
    address,
    uint256
  ) external pure override returns (uint256[] memory) {
    revert("STFET not supported.");
  }

  function getAmountsOut(uint256 amountIn, address[] calldata path)
    external
    view
    override
    returns (uint256[] memory amountsOut)
  {
    (uint256 amountOut, ) = velo.getAmountOut(amountIn, path[0], path[1]);
    amountsOut = new uint256[](path.length);
    amountsOut[path.length - 1] = amountOut;
  }

  function getAmountsIn(uint256, address[] calldata path) external pure returns (uint256[] memory amountsIn) {
    // No Support
    amountsIn = new uint256[](path.length);
  }
}
