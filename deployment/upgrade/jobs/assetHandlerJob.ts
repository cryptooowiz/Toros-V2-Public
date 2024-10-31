import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getImplementationAddress } from "@openzeppelin/upgrades-core";
import { proposeTx, tryVerify } from "../../deploymentHelpers";
import { IJob, IProposeTxProperties, IUpgradeConfig, IVersions, IFileNames } from "../../types";

export const assetHandlerJob: IJob<void> = async (
  config: IUpgradeConfig,
  hre: HardhatRuntimeEnvironment,
  versions: IVersions,
  _: IFileNames,
  addresses: IProposeTxProperties,
) => {
  const ethers = hre.ethers;
  const upgrades = hre.upgrades;

  const ProxyAdmin = await hre.artifacts.readArtifact("ProxyAdmin");
  const proxyAdmin = new ethers.utils.Interface(ProxyAdmin.abi);

  if (config.execute) {
    if (versions[config.oldTag].contracts.AssetHandlerProxy) {
      console.log("Will upgrade assethandler");
      const oldAssetHandler = versions[config.oldTag].contracts.AssetHandlerProxy;
      const AssetHandler = await ethers.getContractFactory("AssetHandler");
      const assetHandler = await upgrades.prepareUpgrade(oldAssetHandler, AssetHandler);
      console.log("assetHandler logic deployed to: ", assetHandler);

      await tryVerify(hre, assetHandler, "contracts/priceAggregators/AssetHandler.sol:AssetHandler", []);

      const upgradeABI = proxyAdmin.encodeFunctionData("upgrade", [oldAssetHandler, assetHandler]);
      await proposeTx(addresses.proxyAdminAddress, upgradeABI, "Upgrade Asset Handler", config, addresses);
    } else {
      console.log("Will deploy assethandler");
      if (!versions[config.oldTag].contracts.USDPriceAggregator) {
        const USDPriceAggregator = await ethers.getContractFactory("USDPriceAggregator");
        const usdPriceAggregator = await USDPriceAggregator.deploy();
        await usdPriceAggregator.deployed();
        console.log("USDPriceAggregator deployed at ", usdPriceAggregator.address);

        await tryVerify(
          hre,
          usdPriceAggregator.address,
          "contracts/priceAggregators/USDPriceAggregator.sol:USDPriceAggregator",
          [],
        );

        versions[config.newTag].contracts.USDPriceAggregator = usdPriceAggregator.address;
      }

      const AssetHandlerLogic = await ethers.getContractFactory("AssetHandler");
      const assetHandler = await upgrades.deployProxy(AssetHandlerLogic, [[]]);
      await assetHandler.deployed();
      console.log("AssetHandler deployed at ", assetHandler.address);

      await assetHandler.transferOwnership(addresses.protocolDaoAddress);

      const assetHandlerImplementation = await getImplementationAddress(ethers.provider, assetHandler.address);

      await tryVerify(hre, assetHandlerImplementation, "contracts/priceAggregators/AssetHandler.sol:AssetHandler", []);

      versions[config.newTag].contracts.AssetHandlerProxy = assetHandler.address;
      versions[config.newTag].contracts.AssetHandler = assetHandlerImplementation;
    }
  }
};
