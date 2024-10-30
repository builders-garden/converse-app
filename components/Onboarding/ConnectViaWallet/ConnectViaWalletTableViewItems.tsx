import AsyncStorage from "@react-native-async-storage/async-storage";
// TODO: move out of ConnectViaWallet
import { memo, useState } from "react";
import { ActivityIndicator } from "react-native";
import { ethereum } from "thirdweb/chains";
import {
  useDisconnect as useThirdwebDisconnect,
  useSetActiveWallet as useSetThirdwebActiveWallet,
  useConnect as useThirdwebConnect,
  useActiveWallet as useThirdwebActiveWallet,
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

import {
  InstalledWallet,
  useInstalledWallets,
} from "./ConnectViaWalletSupportedWallets";
import config from "../../../config";
import { getAccountsList } from "../../../data/store/accountsStore";
import { useAppStateHandlers } from "../../../hooks/useAppStateHandlers";
import { translate } from "../../../i18n";
import { getEthOSSigner } from "../../../utils/ethos";
import logger from "../../../utils/logger";
import { thirdwebClient } from "../../../utils/thirdweb";
import TableView, { TableViewItemType } from "../../TableView/TableView";
import { TableViewEmoji, TableViewImage } from "../../TableView/TableViewImage";
import { RightViewChevron } from "../../TableView/TableViewRightChevron";

export function getConnectViaWalletTableViewPrivateKeyItem(
  args: Partial<TableViewItemType>
): TableViewItemType {
  return {
    id: "privateKey",
    leftView: <TableViewEmoji emoji="🔑" />,
    title: translate("walletSelector.connectionOptions.connectViaKey"),
    rightView: <RightViewChevron />,
    ...args,
  };
}

export function getConnectViaWalletTableViewPhoneItem(
  args: Partial<TableViewItemType>
): TableViewItemType {
  return {
    id: "phone",
    leftView: <TableViewEmoji emoji="📞" />,
    title: translate("walletSelector.converseAccount.connectViaPhone"),
    rightView: <RightViewChevron />,
    ...args,
  };
}

export function getConnectViaWalletTableViewEphemeralItem(
  args: Partial<TableViewItemType>
): TableViewItemType {
  return {
    id: "ephemeral",
    leftView: <TableViewEmoji emoji="☁️" />,
    title: translate("walletSelector.converseAccount.createEphemeral"),
    rightView: <RightViewChevron />,
    ...args,
  };
}

export function getConnectViaWalletInstalledWalletTableViewItem(args: {
  wallet: InstalledWallet;
  tableViewItemArgs: Partial<TableViewItemType>;
}): TableViewItemType {
  const { wallet, tableViewItemArgs } = args;
  return {
    id: wallet.name,
    leftView: <TableViewImage imageURI={wallet.iconURL} />,
    title: translate("walletSelector.installedApps.connectWallet", {
      walletName: wallet.name,
    }),
    rightView: <RightViewChevron />,
    ...tableViewItemArgs,
  };
}

export const InstalledWalletsTableView = memo(
  function InstalledWalletsTableView(props: {
    onAccountExists: (arg: { address: string }) => void;
    onAccountDoesNotExist: (arg: { address: string; isSCW: boolean }) => void;
  }) {
    const { onAccountExists, onAccountDoesNotExist } = props;

    const walletsInstalled = useInstalledWallets();

    const { connect: thirdwebConnect } = useThirdwebConnect();
    const { disconnect: disconnectThirdweb } = useThirdwebDisconnect();
    const thirdwebActiveWallet = useThirdwebActiveWallet();
    const setThirdwebActiveWallet = useSetThirdwebActiveWallet();

    const [isProcessingWalletId, setIsProcessingWalletId] = useState<
      string | null
    >(null);

    // In case the user came back to the app themselves
    useAppStateHandlers({
      onForeground: () => {
        setIsProcessingWalletId(null);
      },
    });

    return (
      <TableView
        title={translate("walletSelector.installedApps.title")}
        items={walletsInstalled.map((wallet) => ({
          id: wallet.name,
          leftView: <TableViewImage imageURI={wallet.iconURL} />,
          rightView:
            isProcessingWalletId === wallet.name ? (
              <ActivityIndicator />
            ) : (
              <RightViewChevron />
            ),
          title: translate("walletSelector.installedApps.connectWallet", {
            walletName: wallet.name,
          }),
          action: async () => {
            const isSCW = !!wallet?.isSmartContractWallet;
            logger.debug(
              `[Onboarding] Clicked on wallet ${wallet.name} - ${
                isSCW ? "Opening web page" : "opening external app"
              }`
            );

            setIsProcessingWalletId(wallet.name);

            if (thirdwebActiveWallet) {
              disconnectThirdweb(thirdwebActiveWallet);
            }

            try {
              let walletAddress: string = "";

              // Specific flow for Coinbase Wallet
              if (wallet.thirdwebId === "com.coinbase.wallet") {
                // @todo => this is a hack to remove the smart wallet key from AsyncStorage
                // because it's not being removed by the wallet itself
                const storageKeys = await AsyncStorage.getAllKeys();
                const wcKeys = storageKeys.filter((k) =>
                  k.startsWith("-Coinbase Smart Wallet:")
                );
                await AsyncStorage.multiRemove(wcKeys);
                const wallet = await thirdwebConnect(async () => {
                  const coinbaseWallet = createWallet("com.coinbase.wallet", {
                    appMetadata: config.walletConnectConfig.appMetadata,
                    // Important to match the chain id of our ethersSignerToXmtpSigner when using SCWs
                    chains: [ethereum],
                    mobileConfig: {
                      callbackURL: isSCW
                        ? `converse-dev://mobile-wallet-protocol`
                        : `https://${config.websiteDomain}/coinbase`,
                    },
                    walletConfig: {
                      options: isSCW ? "smartWalletOnly" : "eoaOnly",
                    },
                  });
                  await coinbaseWallet.connect({ client: thirdwebClient });
                  setThirdwebActiveWallet(coinbaseWallet);
                  return coinbaseWallet;
                });

                if (!wallet) {
                  throw new Error("No coinbase wallet");
                }

                const account = wallet.getAccount();

                if (!account) {
                  throw new Error("No coinbase account found");
                }

                walletAddress = account.address;
              }
              // EthOS Wallet
              else if (wallet.name === "EthOS Wallet") {
                const signer = getEthOSSigner();
                if (!signer) {
                  throw new Error("No EthOS signer found");
                }
                walletAddress = await signer.getAddress();
              }
              // Generic flow for all other wallets
              else if (wallet.thirdwebId) {
                const walletConnectWallet = createWallet(wallet.thirdwebId);
                const account = await walletConnectWallet.connect({
                  client: thirdwebClient,
                  walletConnect: config.walletConnectConfig,
                });
                walletConnectWallet.getAccount();
                setThirdwebActiveWallet(walletConnectWallet);
                walletAddress = account.address;
              }

              if (getAccountsList().includes(walletAddress)) {
                onAccountExists({ address: walletAddress });
              } else {
                onAccountDoesNotExist({
                  address: walletAddress,
                  isSCW,
                });
              }
            } catch (e: any) {
              logger.error("Error connecting to wallet:", e);
            } finally {
              setIsProcessingWalletId(null);
            }
          },
        }))}
      />
    );
  }
);
