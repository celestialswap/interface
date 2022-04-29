import { getToken } from "@/state/erc20";
import { Token } from "@uniswap/sdk";
import { useEffect, useState } from "react";
import { useActiveWeb3React } from "./useActiveWeb3React";

const useToken = (address: string) => {
  const { library } = useActiveWeb3React();

  const [token, setToken] = useState<Token | undefined>();

  useEffect(() => {
    (async () => {
      try {
        if (address) {
          const token = await getToken(address, library);
          console.log(token);
          setToken(token);
        }
        setToken(undefined);
      } catch (error) {}
    })();
  }, [address, library]);

  return token;
};

export default useToken;
