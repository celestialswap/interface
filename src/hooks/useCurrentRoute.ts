import { useRouter } from "next/router";
import { useMemo } from "react";
import { APP_ROUTE } from "../configs";

const routes = {
  [APP_ROUTE.SWAP]: "/swap",
  [APP_ROUTE.LIQUIDITY]: "/liquidity",
  [APP_ROUTE.ADD_LIQUIDITY]: "liquidity/add",
};

const useCurrentRoute = (): APP_ROUTE | undefined => {
  const router = useRouter();
  return useMemo(() => {
    if (router.pathname.includes(routes[APP_ROUTE.SWAP])) return APP_ROUTE.SWAP;
    if (router.pathname.includes(routes[APP_ROUTE.ADD_LIQUIDITY]))
      return APP_ROUTE.ADD_LIQUIDITY;
    if (router.pathname.includes(routes[APP_ROUTE.LIQUIDITY]))
      return APP_ROUTE.LIQUIDITY;
    return undefined;
  }, [router]);
};

export default useCurrentRoute;
