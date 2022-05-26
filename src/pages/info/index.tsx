import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import type { NextPage } from "next";
import { useAllTokenData } from "@/contexts/TokenData";
import { useAllPairData } from "@/contexts/PairData";
import { useGlobalData, useGlobalTransactions } from "@/contexts/GlobalData";

const Info: NextPage = () => {
  const { chainId, account } = useActiveWeb3React();
  const allPairs = useAllPairData();
  const allTokens = useAllTokenData();
  const transactions = useGlobalTransactions();
  const {
    totalLiquidityUSD,
    oneDayVolumeUSD,
    volumeChangeUSD,
    liquidityChangeUSD,
  } = useGlobalData();

  console.log(
    allPairs,
    allTokens,
    transactions,
    totalLiquidityUSD,
    oneDayVolumeUSD,
    volumeChangeUSD,
    liquidityChangeUSD
  );

  return (
    <div>
      <div>chainId {chainId}</div>
      <div>account {account}</div>
    </div>
  );
};

export default Info;
