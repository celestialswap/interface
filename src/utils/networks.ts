import { TOKEN_LIST } from "@/configs/networks";

export const getListTokens = (chainId: number | undefined) =>
  chainId ? TOKEN_LIST[chainId] : [];
