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
    <Stack spacing="4" p="6" border="1px solid" borderRadius="xl">
      <Box>All Farms</Box>
      <Grid
        templateColumns="repeat(25,1fr)"
        gap="4"
        bg="gray.200"
        px="6"
        py="4"
        borderRadius="xl"
      >
        <GridItem colSpan={8}>Farm</GridItem>
        <GridItem colSpan={8}>Pending Reward</GridItem>
        <GridItem colSpan={4}>Total APR</GridItem>
        <GridItem colSpan={4}>TVL</GridItem>
      </Grid>
      {new Array(poolLength).fill("").map((_, pid) => (
        <Pool key={pid} pid={pid} />
      ))}
    </Stack>
  );
};

export default Farm;
