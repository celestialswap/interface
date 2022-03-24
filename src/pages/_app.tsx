import Web3Layout from "@/components/Web3Layout";
import { Web3Provider } from "@ethersproject/providers";
import { Web3ReactProvider } from "@web3-react/core";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";

const getLibrary = (provider: any) => {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Web3Layout>
          <Component {...pageProps} />
        </Web3Layout>
      </Web3ReactProvider>
    </ChakraProvider>
  );
}

export default MyApp;
