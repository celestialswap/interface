import Pool from "@/components/farm/Pool";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { getFarmPoolLength } from "@/state/farm";
import { Grid, GridItem, Stack } from "@chakra-ui/react";
import { NextPage } from "next";
import { useEffect, useState } from "react";

const Farm: NextPage = () => {
  const { library } = useActiveWeb3React();

  const [poolLength, setPoolLength] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    library &&
      getFarmPoolLength(library)
        .then((res) => isMounted && setPoolLength(res as any))
        .catch(console.error);
    return () => {
      isMounted = false;
    };
  }, [library]);

  return (
    <Stack spacing="4">
      <Grid templateColumns="repeat(24  ,1fr)" gap="4">
        <GridItem colSpan={6}>Farm</GridItem>
        <GridItem colSpan={6}>Pending Reward</GridItem>
        <GridItem colSpan={6}>Total APR</GridItem>
        <GridItem colSpan={6}>TVL</GridItem>
      </Grid>
      {new Array(poolLength).fill("").map((_, pid) => (
        <Pool key={pid} pid={pid} />
      ))}
    </Stack>
  );
};

export default Farm;
