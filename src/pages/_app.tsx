import Web3Layout from "@/components/Web3Layout";
import { ChakraProvider } from "@chakra-ui/react";
import { Web3Provider } from "@ethersproject/providers";
import { Web3ReactProvider } from "@web3-react/core";
import type { AppProps } from "next/app";
import { ApolloProvider } from "@apollo/client";
import LocalStorageContextProvider, {
  Updater as LocalStorageContextUpdater,
} from "@/contexts/LocalStorage";
import TokenDataContextProvider, {
  Updater as TokenDataContextUpdater,
} from "@/contexts/TokenData";
import GlobalDataContextProvider from "@/contexts/GlobalData";
import PairDataContextProvider, {
  Updater as PairDataContextUpdater,
} from "@/contexts/PairData";
import ApplicationContextProvider from "@/contexts/Application";
import UserContextProvider from "@/contexts/User";
import { client } from "@/apollo/client";

import "../styles/index.css";

const getLibrary = (provider: any) => {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
};

function ContextProviders({ children }: { children: any }) {
  return (
    <LocalStorageContextProvider>
      <ApplicationContextProvider>
        <TokenDataContextProvider>
          <GlobalDataContextProvider>
            <PairDataContextProvider>
              <UserContextProvider>{children}</UserContextProvider>
            </PairDataContextProvider>
          </GlobalDataContextProvider>
        </TokenDataContextProvider>
      </ApplicationContextProvider>
    </LocalStorageContextProvider>
  );
}

function Updaters() {
  return (
    <>
      <LocalStorageContextUpdater />
      <PairDataContextUpdater />
      <TokenDataContextUpdater />
    </>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ContextProviders>
      <Updaters />
      <ApolloProvider client={client}>
        <ChakraProvider>
          <Web3ReactProvider getLibrary={getLibrary}>
            <Web3Layout>
              <Component {...pageProps} />
            </Web3Layout>
          </Web3ReactProvider>
        </ChakraProvider>
      </ApolloProvider>
    </ContextProviders>
  );
}

export default MyApp;
