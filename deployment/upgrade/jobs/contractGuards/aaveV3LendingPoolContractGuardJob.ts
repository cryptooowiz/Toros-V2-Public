import { HardhatRuntimeEnvironment } from "hardhat/types";
import { proposeTx, tryVerify } from "../../../deploymentHelpers";
import { addOrReplaceGuardInFile } from "../helpers";
import { IAddresses, IJob, IUpgradeConfig, IVersions, IFileNames } from "../../../types";

export const aaveV3LendingPoolContractGuardJob: IJob<void> = async (
  config: IUpgradeConfig,
  hre: HardhatRuntimeEnvironment,
  versions: IVersions,
  filenames: IFileNames,
  addresses: IAddresses,
) => {
  if (!addresses.aaveV3?.aaveLendingPoolAddress) {
    console.warn("aaveLendingPoolAddress not configured for aaveV3LendingPoolContractGuardJob: skipping.");
    return;
  }

  const ethers = hre.ethers;
  const Governance = await hre.artifacts.readArtifact("Governance");
  const governanceABI = new ethers.utils.Interface(Governance.abi);

  console.log("Will deploy aavev3lendingpoolguard");
  if (config.execute) {
    const AaveLendingPoolGuard = await ethers.getContractFactory("AaveLendingPoolGuardV3L2Pool");
    const aaveLendingPoolGuard = await AaveLendingPoolGuard.deploy();
    await aaveLendingPoolGuard.deployed();
    console.log("AaveLendingPoolGuardV3L2Pool deployed at", aaveLendingPoolGuard.address);
    versions[config.newTag].contracts.AaveLendingPoolGuardV3 = aaveLendingPoolGuard.address;

    await tryVerify(
      hre,
      aaveLendingPoolGuard.address,
      "contracts/guards/contractGuards/AaveLendingPoolGuardV3L2Pool.sol:AaveLendingPoolGuardV3L2Pool",
      [],
    );

    const setContractGuardABI = governanceABI.encodeFunctionData("setContractGuard", [
      addresses.aaveV3.aaveLendingPoolAddress,
      aaveLendingPoolGuard.address,
    ]);
    await proposeTx(
      versions[config.oldTag].contracts.Governance,
      setContractGuardABI,
      "setContractGuard for Aave V3 Lending Pool",
      config,
      addresses,
    );

    const deployedGuard = {
      contractAddress: addresses.aaveV3.aaveLendingPoolAddress,
      guardName: "AaveLendingPoolGuardV3L2Pool",
      guardAddress: aaveLendingPoolGuard.address,
      description: "Aave V3 Lending Pool contract",
    };
    await addOrReplaceGuardInFile(filenames.contractGuardsFileName, deployedGuard, "contractAddress");
  }
};
