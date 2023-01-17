import { getImplementationAddress } from "@openzeppelin/upgrades-core";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { proposeTx, tryVerify } from "../../../Helpers";
import { IAddresses, IFileNames, IJob, IUpgradeConfig, IVersions } from "../../../types";

export const dhedgeStakingV2Job: IJob<void> = async (
  config: IUpgradeConfig,
  hre: HardhatRuntimeEnvironment,
  versions: IVersions,
  _: IFileNames,
  addresses: IAddresses,
) => {
  const ethers = hre.ethers;
  const upgrades = hre.upgrades;

  const dhedgeStakingV2Proxy = versions[config.newTag].contracts.DhedgeStakingV2Proxy;

  console.log("Will deploy DhedgeV2Staking");
  // If we've never deployed staking deploy the proxy and the impl
  if (!dhedgeStakingV2Proxy) {
    console.log("Will deploy DhedgeV2Staking");
    const nftJsonAddress = versions[config.newTag].contracts.DhedgeStakingV2NFTJson;
    if (!nftJsonAddress) {
      console.warn("Please deploy DhedgeStakingV2NFTJson first");
      return;
    }
    if (config.execute) {
      console.log("Creating a new deployment of DhedgeV2Staking");
      const DhedgeStakingV2 = await ethers.getContractFactory("DhedgeStakingV2");
      const dhedgeStakingV2Proxy = await upgrades.deployProxy(DhedgeStakingV2, [addresses.assets.dht]);
      await dhedgeStakingV2Proxy.deployed();

      const dhedgeStakingV2Implementation = await getImplementationAddress(
        ethers.provider,
        dhedgeStakingV2Proxy.address,
      );

      await tryVerify(
        hre,
        dhedgeStakingV2Implementation,
        "contracts/stakingv2/DhedgeStakingV2.sol:DhedgeStakingV2",
        [],
      );

      console.log("dhedgeStakingV2Proxy deployed at ", dhedgeStakingV2Proxy.address);
      console.log("dhedgeStakingV2Impl deployed at ", dhedgeStakingV2Implementation);

      console.log("Initializing implementation...");
      const dhedgeStakingV2Impl = DhedgeStakingV2.attach(dhedgeStakingV2Implementation);
      await dhedgeStakingV2Impl.implInitializer();
      console.log("setTokenUriGenerator");
      await dhedgeStakingV2Proxy.setTokenUriGenerator(nftJsonAddress);

      console.log("Configuring Pools", addresses.stakingV2Pools);

      for (const stakingPool of addresses.stakingV2Pools) {
        await dhedgeStakingV2Proxy.configurePool(stakingPool.pool, stakingPool.cap);
        console.log("Pool Configured", stakingPool);
      }

      await dhedgeStakingV2Proxy.transferOwnership(addresses.protocolDaoAddress);
      versions[config.newTag].contracts.DhedgeStakingV2Proxy = dhedgeStakingV2Proxy.address;
      versions[config.newTag].contracts.DhedgeStakingV2 = dhedgeStakingV2Implementation;
    }
  }
  // Otherwise just upgrade the staking impl
  else {
    console.log("Will upgrade DhedgeV2Staking");
    if (config.execute) {
      console.log("Upgrading DhedgeV2Staking");
      const DhedgeStakingV2 = await ethers.getContractFactory("DhedgeStakingV2");
      const dhedgeStakingV2 = await upgrades.prepareUpgrade(dhedgeStakingV2Proxy, DhedgeStakingV2);
      console.log("dhedgeStakingV2 deployed to: ", dhedgeStakingV2);

      console.log("Initializing implementation...");
      const dhedgeStakingV2Impl = DhedgeStakingV2.attach(dhedgeStakingV2);
      try {
        await dhedgeStakingV2Impl.implInitializer();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!e.error.message.includes("already initialized")) {
          throw e;
        }
        console.log("Implementation is initialized.");
      }
      await tryVerify(hre, dhedgeStakingV2, "contracts/stakingv2/DhedgeStakingV2.sol:DhedgeStakingV2", []);

      const ProxyAdmin = await hre.artifacts.readArtifact("ProxyAdmin");
      const proxyAdmin = new ethers.utils.Interface(ProxyAdmin.abi);

      const upgradeABI = proxyAdmin.encodeFunctionData("upgrade", [dhedgeStakingV2Proxy, dhedgeStakingV2]);
      await proposeTx(addresses.proxyAdminAddress, upgradeABI, "Upgrade DhedgeStakingV2", config, addresses);

      versions[config.newTag].contracts.DhedgeStakingV2 = dhedgeStakingV2;
      console.log("dhedgeStakingV2Impl deployed at ", dhedgeStakingV2);
    }
  }
};
