import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { DhedgeNftTrackerStorage } from "../../types/DhedgeNftTrackerStorage";
import { IHasGuardInfo__factory, MockContract } from "../../types";
import { expect } from "chai";

describe("DhedgeNftTrackerStorage Test", () => {
  let nftTracker: DhedgeNftTrackerStorage;
  let poolFactory: MockContract, poolLogic: MockContract, guardedContract: MockContract;
  let validNftTrackerGuard: SignerWithAddress, invalidNftTrackerGuard: SignerWithAddress;
  const nftType = ethers.utils.solidityKeccak256(["string"], ["LYRA_NFT_TYPE"]);
  const iPoolFactory = new ethers.utils.Interface(IHasGuardInfo__factory.abi);

  beforeEach(async () => {
    [validNftTrackerGuard, invalidNftTrackerGuard] = await ethers.getSigners();

    const MockContract = await ethers.getContractFactory("MockContract");

    poolFactory = await MockContract.deploy();
    poolLogic = await MockContract.deploy();
    guardedContract = await MockContract.deploy();

    await poolFactory.givenCalldataReturnAddress(
      iPoolFactory.encodeFunctionData("getContractGuard", [guardedContract.address]),
      validNftTrackerGuard.address,
    );

    const DhedgeNftTrackerStorage = await ethers.getContractFactory("DhedgeNftTrackerStorage");
    nftTracker = <DhedgeNftTrackerStorage>await upgrades.deployProxy(DhedgeNftTrackerStorage, [poolFactory.address]);
  });

  describe("addData", () => {
    const data = "0x0000000001";

    it("revert if invalid contract guard calls the function", async () => {
      await expect(
        nftTracker.connect(invalidNftTrackerGuard).addData(guardedContract.address, nftType, poolLogic.address, data),
      ).to.revertedWith("not correct contract guard");
    });

    it("authorized guard can add data", async () => {
      await nftTracker.connect(validNftTrackerGuard).addData(guardedContract.address, nftType, poolLogic.address, data);

      expect(await nftTracker.getData(nftType, poolLogic.address, 0)).to.equal(data);
      expect(await nftTracker.getDataCount(nftType, poolLogic.address)).to.equal(1);
      expect((await nftTracker.getAllData(nftType, poolLogic.address)).length).to.equal(1);
    });

    it("authorized guard can add multiple data", async () => {
      await nftTracker.connect(validNftTrackerGuard).addData(guardedContract.address, nftType, poolLogic.address, data);
      await nftTracker.connect(validNftTrackerGuard).addData(guardedContract.address, nftType, poolLogic.address, data);

      expect(await nftTracker.getData(nftType, poolLogic.address, 0)).to.equal(data);
      expect(await nftTracker.getData(nftType, poolLogic.address, 1)).to.equal(data);
      expect(await nftTracker.getDataCount(nftType, poolLogic.address)).to.equal(2);
      expect((await nftTracker.getAllData(nftType, poolLogic.address)).length).to.equal(2);
    });
  });

  describe("removeData", () => {
    const data1 = "0x0000000001";
    const data2 = "0x0000000002";
    const data3 = "0x0000000002";

    it("revert if invalid contract guard calls the function", async () => {
      await expect(
        nftTracker.connect(invalidNftTrackerGuard).removeData(guardedContract.address, nftType, poolLogic.address, 0),
      ).to.revertedWith("not correct contract guard");
    });

    it("revert if index is invalid", async () => {
      await expect(
        nftTracker.connect(validNftTrackerGuard).removeData(guardedContract.address, nftType, poolLogic.address, 1),
      ).to.revertedWith("invalid index");
    });

    it("authorized guard can remove data: remove data in the middle", async () => {
      await nftTracker
        .connect(validNftTrackerGuard)
        .addData(guardedContract.address, nftType, poolLogic.address, data1);
      await nftTracker
        .connect(validNftTrackerGuard)
        .addData(guardedContract.address, nftType, poolLogic.address, data2);
      await nftTracker
        .connect(validNftTrackerGuard)
        .addData(guardedContract.address, nftType, poolLogic.address, data3);

      expect(await nftTracker.getData(nftType, poolLogic.address, 0)).to.equal(data1);
      expect(await nftTracker.getData(nftType, poolLogic.address, 1)).to.equal(data2);
      expect(await nftTracker.getData(nftType, poolLogic.address, 2)).to.equal(data3);
      expect(await nftTracker.getDataCount(nftType, poolLogic.address)).to.equal(3);
      expect((await nftTracker.getAllData(nftType, poolLogic.address)).length).to.equal(3);

      await nftTracker.connect(validNftTrackerGuard).removeData(guardedContract.address, nftType, poolLogic.address, 1);

      expect(await nftTracker.getData(nftType, poolLogic.address, 0)).to.equal(data1);
      expect(await nftTracker.getData(nftType, poolLogic.address, 1)).to.equal(data3);
      expect(await nftTracker.getDataCount(nftType, poolLogic.address)).to.equal(2);
      expect((await nftTracker.getAllData(nftType, poolLogic.address)).length).to.equal(2);
    });

    it("authorized guard can remove data: remove data at the end", async () => {
      await nftTracker
        .connect(validNftTrackerGuard)
        .addData(guardedContract.address, nftType, poolLogic.address, data1);
      await nftTracker
        .connect(validNftTrackerGuard)
        .addData(guardedContract.address, nftType, poolLogic.address, data2);
      await nftTracker
        .connect(validNftTrackerGuard)
        .addData(guardedContract.address, nftType, poolLogic.address, data3);

      expect(await nftTracker.getData(nftType, poolLogic.address, 0)).to.equal(data1);
      expect(await nftTracker.getData(nftType, poolLogic.address, 1)).to.equal(data2);
      expect(await nftTracker.getData(nftType, poolLogic.address, 2)).to.equal(data3);
      expect(await nftTracker.getDataCount(nftType, poolLogic.address)).to.equal(3);
      expect((await nftTracker.getAllData(nftType, poolLogic.address)).length).to.equal(3);

      await nftTracker.connect(validNftTrackerGuard).removeData(guardedContract.address, nftType, poolLogic.address, 2);

      expect(await nftTracker.getData(nftType, poolLogic.address, 0)).to.equal(data1);
      expect(await nftTracker.getData(nftType, poolLogic.address, 1)).to.equal(data2);
      expect(await nftTracker.getDataCount(nftType, poolLogic.address)).to.equal(2);
      expect((await nftTracker.getAllData(nftType, poolLogic.address)).length).to.equal(2);
    });
  });
});
