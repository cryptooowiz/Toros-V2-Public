import { HardhatRuntimeEnvironment } from "hardhat/types";
import { proposeTx, tryVerify } from "../../../Helpers";
import { addOrReplaceGuardInFile } from "../helpers";
import { IJob, IProposeTxProperties, IUpgradeConfig, IVersions } from "../../../types";

export const aaveIncentivesControllerV3ContractGuardJob: IJob<void> = async (
  config: IUpgradeConfig,
  hre: HardhatRuntimeEnvironment,
  // TODO: This optimally should not be mutated
  versions: IVersions,
  filenames: { contractGuardsFileName: string },
  addresses: { aaveV3?: { aaveIncentivesControllerAddress?: string } } & IProposeTxProperties,
) => {
  if (!addresses.aaveV3?.aaveIncentivesControllerAddress) {
    console.warn(
      "aaveV3 aaveIncentivesControllerAddress not configured for aaveIncentivesControllerContractGuard: skipping.",
    );
    return;
  }
  //
  // Todo: This Job needs to be made more generic not all chains will have wmatic incentives
  //

  const ethers = hre.ethers;
  const Governance = await hre.artifacts.readArtifact("Governance");
  const governanceABI = new ethers.utils.Interface(Governance.abi);

  console.log("Will deploy aaveincentivescontrollerv3guard");
  if (config.execute) {
    const AaveIncentivesControllerV3Guard = await ethers.getContractFactory("AaveIncentivesControllerV3Guard");
    const aaveIncentivesControllerV3Guard = await AaveIncentivesControllerV3Guard.deploy();
    await aaveIncentivesControllerV3Guard.deployed();
    console.log("AaveIncentivesControllerV3Guard deployed at", aaveIncentivesControllerV3Guard.address);
    versions[config.newTag].contracts.AaveIncentivesControllerV3Guard = aaveIncentivesControllerV3Guard.address;

    await tryVerify(
      hre,
      aaveIncentivesControllerV3Guard.address,
      "contracts/guards/contractGuards/AaveIncentivesControllerV3Guard.sol:AaveIncentivesControllerV3Guard",
      [],
    );

    const setContractGuardABI = governanceABI.encodeFunctionData("setContractGuard", [
      addresses.aaveV3.aaveIncentivesControllerAddress,
      aaveIncentivesControllerV3Guard.address,
    ]);
    await proposeTx(
      versions[config.oldTag].contracts.Governance,
      setContractGuardABI,
      "setContractGuard for AaveIncentivesControllerV3Guard",
      config,
      addresses,
    );
    const deployedGuard = {
      contractAddress: addresses.aaveV3.aaveIncentivesControllerAddress,
      guardName: "AaveIncentivesControllerV3Guard",
      guardAddress: aaveIncentivesControllerV3Guard.address,
      description: "Aave Incentives Controller V3 contract",
    };
    await addOrReplaceGuardInFile(filenames.contractGuardsFileName, deployedGuard, "contractAddress");
  }
};
