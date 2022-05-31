import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import type { NextPage } from "next";
import { useAllTokenData } from "@/contexts/TokenData";
import { useAllPairData } from "@/contexts/PairData";
import { useGlobalData, useGlobalTransactions } from "@/contexts/GlobalData";
import { Box } from "@chakra-ui/react";
import GlobalChart from "@/components/info/GlobalChart";

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

  // console.log(
  //   allPairs,
  //   allTokens,
  //   transactions,
  //   totalLiquidityUSD,
  //   oneDayVolumeUSD,
  //   volumeChangeUSD,
  //   liquidityChangeUSD
  // );

  return (
    <Box>
      <GlobalChart display="liquidity" />
    </Box>
  );
};

export default Info;
