import { testAaveV3 } from "../../common/aaveV3/AaveV3Test";
import { baseChainData } from "../../../../config/chainData/baseData";

const testParams = {
  ...baseChainData,
  ...baseChainData.aaveV3,
  usdPriceFeeds: {
    ...baseChainData.usdPriceFeeds,
    borrowAsset: "", // stubbed
  },
  assetsBalanceOfSlot: {
    ...baseChainData.assetsBalanceOfSlot,
    borrowAsset: 0, // stubbed
  },
  borrowAsset: "", // stubbed
};

testAaveV3(testParams);
