import Pool from "@/components/farm/Pool";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { getFarmPoolLength } from "@/state/farm";
import { Box, Grid, GridItem, Stack } from "@chakra-ui/react";
import { NextPage } from "next";
import { useEffect, useState } from "react";

const Farm: NextPage = () => {
  const { library } = useActiveWeb3React();

  const [poolLength, setPoolLength] = useState<number>(0);

  useEffect(() => {
    library &&
      getFarmPoolLength(library).then(setPoolLength).catch(console.error);
  }, [library]);

  return (
    <Stack spacing="4">
      <Grid templateColumns="repeat(17  ,1fr)">
        <GridItem colSpan={4}>Farm</GridItem>
        <GridItem colSpan={4}>Pending Reward</GridItem>
        <GridItem colSpan={4}>Total APR</GridItem>
        <GridItem colSpan={4}>TVL</GridItem>
        <GridItem></GridItem>
      </Grid>
      {new Array(poolLength).fill("").map((_, pid) => (
        <Pool key={pid} pid={pid} />
      ))}
    </Stack>
  );
};

export default Farm;
