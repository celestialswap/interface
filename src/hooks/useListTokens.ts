import { getListTokens } from "@/utils/networks";
import { useMemo } from "react";
import { useActiveWeb3React } from "./useActiveWeb3React";

const useListTokens = () => {
  const { chainId } = useActiveWeb3React();

  return useMemo(() => getListTokens(chainId), [chainId]);
};

export default useListTokens;
