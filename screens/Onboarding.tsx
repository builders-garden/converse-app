import { configure, handleResponse } from "@coinbase/wallet-mobile-sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WalletConnectProvider, {
  QrcodeModal,
  RenderQrcodeModalProps,
} from "@walletconnect/react-native-dapp";
import { useEffect, useState } from "react";
import { Linking } from "react-native";

import OnboardingComponent from "../components/OnboardingComponent";
import config from "../config";

const canOpenURL = Linking.canOpenURL.bind(Linking);

configure({
  callbackURL: new URL(`${config.scheme}://`),
  hostURL: new URL("https://wallet.coinbase.com/wsegue"),
  hostPackageName: "org.toshi",
});

export default function OnboardingScreen() {
  const [walletConnectProps, setWalletConnectProps] = useState<
    RenderQrcodeModalProps | undefined
  >(undefined);
  const [hideModal, setHideModal] = useState(false);
  // Your app's deeplink handling code
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      handleResponse(new URL(url));
    });
    // Overwriting canOpenURL to be sure we can open everything
    Linking.canOpenURL = async () => {
      return true;
    };
    return () => {
      sub.remove();
      Linking.canOpenURL = canOpenURL;
    };
  }, []);
  return (
    <WalletConnectProvider
      redirectUrl={`${config.scheme}://"`}
      storageOptions={{
        // @ts-expect-error: Internal
        asyncStorage: AsyncStorage,
      }}
      clientMeta={{
        description:
          "Converse connects web3 identities with each other via messaging.",
        url: "https://getconverse.app",
        icons: ["https://i.postimg.cc/qvfXMMDT/icon.png"],
        name: "Converse",
      }}
      renderQrcodeModal={(props) => {
        if (walletConnectProps?.uri !== props.uri) {
          setWalletConnectProps(props);
        }
        const newProps = {
          ...props,
          visible: props.visible && !hideModal,
        };
        return <QrcodeModal division={4} {...newProps} />;
      }}
    >
      <OnboardingComponent
        walletConnectProps={walletConnectProps}
        setHideModal={setHideModal}
      />
    </WalletConnectProvider>
  );
}
