// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

/**
 * @title Module for liquidated positions and vaults that are below the liquidation ratio.
 */
interface ILiquidationModule {
  /**
   * @notice Data structure that holds liquidation information, used in events and in return statements.
   */
  struct LiquidationData {
    uint256 debtLiquidated;
    uint256 collateralLiquidated;
    uint256 amountRewarded;
  }

  /**
   * @notice Liquidates a position by distributing its debt and collateral among other positions in its vault.
   * @param accountId The id of the account whose position is to be liquidated.
   * @param poolId The id of the pool which holds the position that is to be liquidated.
   * @param collateralType The address of the collateral being used in the position that is to be liquidated.
   * @param liquidateAsAccountId Account id that will receive the rewards from the liquidation.
   * @return liquidationData Information about the position that was liquidated.
   */
  function liquidate(
    uint128 accountId,
    uint128 poolId,
    address collateralType,
    uint128 liquidateAsAccountId
  ) external returns (LiquidationData memory liquidationData);

  /**
   * @notice Liquidates an entire vault.
   * @dev Can only be done if the vault itself is under collateralized.
   * @dev LiquidateAsAccountId determines which account to deposit the seized collateral into (this is necessary particularly if the collateral in the vault is vesting).
   * @dev Will only liquidate a portion of the debt for the vault if `maxUsd` is supplied.
   * @param poolId The id of the pool whose vault is being liquidated.
   * @param collateralType The address of the collateral whose vault is being liquidated.
   * @param maxUsd The maximum amount of USD that the liquidator is willing to provide for the liquidation, denominated with 18 decimals of precision.
   * @return liquidationData Information about the vault that was liquidated.
   */
  function liquidateVault(
    uint128 poolId,
    address collateralType,
    uint128 liquidateAsAccountId,
    uint256 maxUsd
  ) external returns (LiquidationData memory liquidationData);

  /**
   * @notice Determines whether a specified position is liquidatable.
   * @param accountId The id of the account whose position is being queried for liquidation.
   * @param poolId The id of the pool whose position is being queried for liquidation.
   * @param collateralType The address of the collateral backing up the position being queried for liquidation.
   * @return canLiquidate A boolean with the response to the query.
   */
  function isPositionLiquidatable(
    uint128 accountId,
    uint128 poolId,
    address collateralType
  ) external returns (bool canLiquidate);

  /**
   * @notice Determines whether a specified vault is liquidatable.
   * @param poolId The id of the pool that owns the vault that is being queried for liquidation.
   * @param collateralType The address of the collateral being held at the vault that is being queried for liquidation.
   * @return canVaultLiquidate A boolean with the response to the query.
   */
  function isVaultLiquidatable(uint128 poolId, address collateralType) external returns (bool canVaultLiquidate);
}
