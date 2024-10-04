import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { memo } from "react";
import { Platform, useColorScheme } from "react-native";

import ConversationBlockedListNav from "./ConversationBlockedListNav";
import ConversationListNav from "./ConversationListNav";
import ConversationNav, { ConversationNavParams } from "./ConversationNav";
import ConversationRequestsListNav from "./ConversationRequestsListNav";
import ConverseMatchMakerNav from "./ConverseMatchMakerNav";
import EnableTransactionsNav from "./EnableTransactionsNav";
import GroupInviteNav, { GroupInviteNavParams } from "./GroupInviteNav";
import GroupLinkNav, { GroupLinkNavParams } from "./GroupLinkNav";
import GroupNav, { GroupNavParams } from "./GroupNav";
import NewConversationNav, {
  NewConversationNavParams,
} from "./NewConversationNav";
import UserProfile from "../../components/Onboarding/UserProfile";
import { ScreenHeaderModalCloseButton } from "../../components/Screen/ScreenHeaderModalCloseButton";
import {
  TEMPORARY_ACCOUNT_NAME,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import { useRouter } from "../../navigation/use-navigation";
import { isDesktop } from "../../utils/device";
import Accounts from "../Accounts/Accounts";
import { NewAccountConnectWalletScreen } from "../NewAccount/NewAccountConnectWalletScreen";
import { NewAccountEphemeraLoginScreen } from "../NewAccount/NewAccountEphemeraLoginScreen";
import { NewAccountPrivateKeyScreen } from "../NewAccount/NewAccountPrivateKeyScreen";
import { NewAccountPrivyScreen } from "../NewAccount/NewAccountPrivyScreen";
import { NewAccountScreen } from "../NewAccount/NewAccountScreen";
import { NewAccountUserProfileScreen } from "../NewAccount/NewAccountUserProfileScreen";
import { ConnectWalletScreen } from "../Onboarding/OnboardingConnectWalletScreen";
import { OnboardingEphemeraLoginScreen } from "../Onboarding/OnboardingEphemeraLoginScreen";
import { OnboardingGetStartedScreen } from "../Onboarding/OnboardingGetStartedScreen";
import { OnboardingNotificationsScreen } from "../Onboarding/OnboardingNotificationsScreen";
import { OnboardingPrivateKeyScreen } from "../Onboarding/OnboardingPrivateKeyScreen";
import { OnboardingPrivyScreen } from "../Onboarding/OnboardingPrivyScreen";
import ProfileNav, { ProfileNavParams } from "./ProfileNav";
import ShareFrameNav, { ShareFrameNavParams } from "./ShareFrameNav";
import ShareProfileNav from "./ShareProfileNav";
import TopUpNav from "./TopUpNav";
import WebviewPreviewNav, {
  WebviewPreviewNavParams,
} from "./WebviewPreviewNav";
import { screenListeners, stackGroupScreenOptions } from "./navHelpers";

export type NavigationParamList = {
  // Auth / Onboarding
  // Onboarding
  OnboardingGetStarted: undefined;
  OnboardingPrivyConnect: undefined;
  OnboardingConnectWallet: undefined;
  OnboardingPrivateKey: undefined;
  OnboardingNotifications: undefined;
  OnboardingEphemeralLogin: undefined;
  OnboardingUserProfile: undefined;

  // Nwe account
  NewAccountNavigator: undefined;
  NewAccountUserProfile: undefined;
  NewAccountConnectWallet: undefined;
  NewAccountPrivyConnect: undefined;
  NewAccountPrivateKey: undefined;
  NewAccountEphemeralLogin: undefined;

  // Main
  Accounts: undefined;
  Blocked: undefined;
  Chats: undefined;
  ChatsRequests: undefined;
  Conversation: ConversationNavParams;
  NewConversation: NewConversationNavParams;
  NewGroupSummary: undefined;
  EnableTransactions: undefined;
  ConverseMatchMaker: undefined;
  ShareProfile: undefined;
  ShareFrame: ShareFrameNavParams;
  TopUp: undefined;
  Profile: ProfileNavParams;
  Group: GroupNavParams;
  GroupLink: GroupLinkNavParams;
  GroupInvite: GroupInviteNavParams;
  UserProfile: undefined;
  WebviewPreview: WebviewPreviewNavParams;
  NewAccount: undefined;
};

export const authScreensSharedScreenOptions: NativeStackNavigationOptions = {
  headerTitle: "",
  headerBackTitle: "Back",
  headerBackTitleVisible: false,
  headerShadowVisible: false,
};

export const NativeStack = createNativeStackNavigator<NavigationParamList>();

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";

export default function MainNavigation() {
  const currentAccount = useCurrentAccount();

  if (!!currentAccount && currentAccount !== TEMPORARY_ACCOUNT_NAME) {
    return <SignedInNavigator />;
  }

  return <AuthNavigator />;
}

const AuthNavigator = memo(function AuthNavigator() {
  const colorScheme = useColorScheme();

  return (
    <NativeStack.Navigator
      screenOptions={{ gestureEnabled: !isDesktop }}
      // TODO: Do we still need this?
      screenListeners={screenListeners("fullStackNavigation")}
    >
      <NativeStack.Group
        screenOptions={{
          ...stackGroupScreenOptions(colorScheme),
          ...authScreensSharedScreenOptions,
        }}
      >
        <NativeStack.Screen
          options={{
            headerShown: false,
          }}
          name="OnboardingGetStarted"
          component={OnboardingGetStartedScreen}
        />
        <NativeStack.Screen
          name="OnboardingPrivyConnect"
          component={OnboardingPrivyScreen}
        />
        <NativeStack.Screen
          name="OnboardingConnectWallet"
          component={ConnectWalletScreen}
        />
        <NativeStack.Screen
          name="OnboardingNotifications"
          component={OnboardingNotificationsScreen}
        />
        <NativeStack.Screen
          name="OnboardingUserProfile"
          component={UserProfile}
        />
        <NativeStack.Screen
          name="OnboardingPrivateKey"
          component={OnboardingPrivateKeyScreen}
        />
        <NativeStack.Screen
          name="OnboardingEphemeralLogin"
          component={OnboardingEphemeraLoginScreen}
        />
      </NativeStack.Group>
    </NativeStack.Navigator>
  );
});

const SignedInNavigator = memo(function SignedInNavigator() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <NativeStack.Navigator
      screenOptions={{ gestureEnabled: !isDesktop }}
      // TODO: Do we still need this?
      screenListeners={screenListeners("fullStackNavigation")}
    >
      <NativeStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
        {ConversationListNav()}
        {ConversationRequestsListNav()}
        {ConversationBlockedListNav()}
        {ConversationNav()}
        {NewConversationNav()}
        {ConverseMatchMakerNav()}
        {ShareProfileNav()}
        {ShareFrameNav()}
        {WebviewPreviewNav()}
        {ProfileNav()}
        {GroupNav()}
        {GroupLinkNav()}
        {GroupInviteNav()}
        {TopUpNav()}
        {EnableTransactionsNav()}
      </NativeStack.Group>

      {/* Modals */}
      <NativeStack.Group
        screenOptions={{
          presentation: "modal",
          ...stackGroupScreenOptions(colorScheme),
        }}
      >
        <NativeStack.Screen
          name="Accounts"
          component={Accounts}
          options={{
            headerLargeTitle: true,
            headerShadowVisible: false,
            headerLeft: () => (
              <ScreenHeaderModalCloseButton onPress={router.goBack} />
            ),
          }}
        />
        <NativeStack.Screen name="UserProfile" component={UserProfile} />
        <NativeStack.Screen
          name="NewAccountNavigator"
          component={NewAccountNavigator}
          options={{
            headerShown: false,
          }}
        />
      </NativeStack.Group>
    </NativeStack.Navigator>
  );
});

const NewAccountStack = createNativeStackNavigator<NavigationParamList>();

const NewAccountNavigator = memo(function NewAccountNavigator() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <NewAccountStack.Navigator>
      <NewAccountStack.Group
        screenOptions={{
          headerTitle: "",
          headerBackTitle: "Back",
          ...stackGroupScreenOptions(colorScheme),
        }}
      >
        <NativeStack.Screen
          name="NewAccount"
          component={NewAccountScreen}
          options={{
            headerTitle: "New account",
            headerLeft: () => (
              <ScreenHeaderModalCloseButton
                title="Cancel"
                onPress={router.goBack}
              />
            ),
          }}
        />
        <NewAccountStack.Screen
          name="NewAccountPrivyConnect"
          component={NewAccountPrivyScreen}
        />
        <NewAccountStack.Screen
          name="NewAccountConnectWallet"
          component={NewAccountConnectWalletScreen}
        />
        <NewAccountStack.Screen
          name="NewAccountPrivateKey"
          component={NewAccountPrivateKeyScreen}
        />
        <NewAccountStack.Screen
          name="NewAccountUserProfile"
          component={NewAccountUserProfileScreen}
        />
        <NewAccountStack.Screen
          name="NewAccountEphemeralLogin"
          component={NewAccountEphemeraLoginScreen}
        />
      </NewAccountStack.Group>
    </NewAccountStack.Navigator>
  );
});
