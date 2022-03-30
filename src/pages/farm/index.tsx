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
      <Grid templateColumns="repeat(26  ,1fr)" gap="4">
        <GridItem colSpan={6}>Farm</GridItem>
        <GridItem colSpan={6}>Pending Reward</GridItem>
        <GridItem colSpan={6}>Total APR</GridItem>
        <GridItem colSpan={6}>TVL</GridItem>
        <GridItem colSpan={2}></GridItem>
      </Grid>
      {new Array(poolLength).fill("").map((_, pid) => (
        <Pool key={pid} pid={pid} />
      ))}
    </Stack>
  );
};

export default Farm;
