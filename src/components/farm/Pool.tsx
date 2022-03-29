import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { FarmPool, getPool } from "@/state/farm";
import { Box, Skeleton, Stack } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

const Pool = ({ pid }: { pid: number }) => {
  const { account, library } = useActiveWeb3React();

  const [loading, setLoading] = useState<boolean>(true);
  const [pool, setPool] = useState<FarmPool>();

  useEffect(() => {
    (async () => {
      try {
        if (!library) return;
        setLoading(true);
        const pool = await getPool(pid, library, account);
        setPool(pool);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [pid, account, library]);

  return loading ? (
    <Skeleton h="16" />
  ) : pool ? (
    <Box>
      {pool.tokens.token0.symbol} - {pool.tokens.token1.symbol}
    </Box>
  ) : null;
};

export default Pool;
