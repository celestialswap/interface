import Pool from "@/components/liquidity/Pool";
import { Field } from "@/configs/networks";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { getOwnerLiquidityPools, PoolState } from "@/state/liquidity";
import {
  Box,
  Button,
  Grid,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
} from "@chakra-ui/react";
import type { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

const Liquidity: NextPage = () => {
  const { chainId, account, library } = useActiveWeb3React();

  const [ownerPools, setOwnerPools] = useState<PoolState[]>([]);
  const [reload, setReload] = useState<boolean>(false);

  useEffect(() => {
    getOwnerLiquidityPools(chainId, library, account).then((res) =>
      setOwnerPools(res as any)
    );
  }, [chainId, account, library, reload]);

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
