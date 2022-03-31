import Pool from "@/components/liquidity/Pool";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { getOwnerLiquidityPools, PoolState } from "@/state/liquidity";
import { Box, Button, Grid } from "@chakra-ui/react";
import type { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

const Liquidity: NextPage = () => {
  const { account, library } = useActiveWeb3React();

  const [ownerPools, setOwnerPools] = useState<PoolState[]>([]);
  const [reload, setReload] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    getOwnerLiquidityPools(library, account)
      .then((res) => isMounted && setOwnerPools(res as any))
      .catch(console.error);
    return () => {
      isMounted = false;
    };
  }, [account, library, reload]);

  return (
    <Box>
      <Box fontWeight="semibold">Your pools</Box>
      <Link href="/liquidity/add" passHref>
        <Button colorScheme="teal">add liquidity</Button>
      </Link>

      <Box>
        <Box>Your liquidity</Box>
        <Grid
          templateColumns={[
            "repeat(1,1fr)",
            "repeat(1,1fr)",
            "repeat(2,1fr)",
            "repeat(3,1fr)",
          ]}
          gap="8"
        >
          {ownerPools.map((pool, i) => (
            <Pool key={i} pool={pool} setReload={setReload} />
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Liquidity;
