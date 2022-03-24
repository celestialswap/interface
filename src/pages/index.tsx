import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import type { NextPage } from "next";

const Home: NextPage = () => {
  const { chainId, account } = useActiveWeb3React();

  return (
    <div>
      <div>chainId {chainId}</div>
      <div>account {account}</div>
    </div>
  );
};

export default Home;
