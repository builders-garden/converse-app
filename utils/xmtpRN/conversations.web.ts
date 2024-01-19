import { Client, ConsentListEntry, Conversation, Stream } from "@xmtp/xmtp-js";

import { saveConversations } from "../../data/helpers/conversations/upsertConversations";
import { getChatStore, getSettingsStore } from "../../data/store/accountsStore";
import { XmtpConversation } from "../../data/store/chatStore";
import { SettingsStoreType } from "../../data/store/settingsStore";
import { getCleanAddress } from "../eth";
import { syncConversationsMessages } from "./messages";
import { getXmtpClient } from "./sync";

const protocolConversationToStateConversation = (
  conversation: Conversation
): XmtpConversation => ({
  topic: conversation.topic,
  peerAddress: conversation.peerAddress,
  createdAt: conversation.createdAt.getTime(),
  context: conversation.context || undefined,
  messages: new Map(),
  messagesIds: [],
  conversationTitle: undefined,
  messageDraft: undefined,
  readUntil: 0,
  pending: false,
  version: conversation.conversationVersion,
});

const openedConversations: {
  [account: string]: { [topic: string]: Conversation };
} = {};

const setOpenedConversation = (account: string, conversation: Conversation) => {
  openedConversations[account] = openedConversations[account] || {};
  openedConversations[account][conversation.topic] = conversation;
};

export const deleteOpenedConversations = (account: string) => {
  if (account in openedConversations) {
    delete openedConversations[account];
  }
};

const handleNewConversation = async (
  client: Client,
  conversation: Conversation
) => {
  setOpenedConversation(client.address, conversation);
  saveConversations(client.address, [
    protocolConversationToStateConversation(conversation),
  ]);
  // New conversations are not streamed immediatly
  // by the streamAllMessages method so we add this
  // trick to try and be all synced
  syncConversationsMessages(client.address, { [conversation.topic]: 0 });
  setTimeout(() => {
    syncConversationsMessages(client.address, { [conversation.topic]: 0 });
  }, 3000);
  updateConsentStatus(client.address);
};

const conversationsStreams: {
  [account: string]: Stream<Conversation<any>, any>;
} = {};

export const streamConversations = async (account: string) => {
  await stopStreamingConversations(account);
  const client = (await getXmtpClient(account)) as Client;
  conversationsStreams[account] = await client.conversations.stream();
  for await (const conversation of conversationsStreams[account]) {
    handleNewConversation(client, conversation);
  }
};

export const stopStreamingConversations = async (account: string) => {
  if (conversationsStreams[account]) {
    await conversationsStreams[account].return();
    delete conversationsStreams[account];
  }
};

const listConversations = async (client: Client) => {
  const conversations = await client.conversations.list();
  conversations.forEach((c) => {
    setOpenedConversation(client.address, c);
  });
  return conversations;
};

export const loadConversations = async (
  account: string,
  knownTopics: string[]
) => {
  try {
    const client = (await getXmtpClient(account)) as Client;
    const now = new Date().getTime();
    const conversations = await listConversations(client);
    const newConversations: Conversation[] = [];
    const knownConversations: Conversation[] = [];
    conversations.forEach((c) => {
      if (!knownTopics.includes(c.topic)) {
        newConversations.push(c);
      } else {
        knownConversations.push(c);
      }
    });
    console.log(
      `[XmtpJS] Listing ${conversations.length} conversations for ${
        client.address
      } took ${(new Date().getTime() - now) / 1000} seconds`
    );
    // @todo => Maybe just save to mmkv no need to
    // re-save all convos?
    const conversationsToSave = conversations.map(
      protocolConversationToStateConversation
    );
    saveConversations(client.address, conversationsToSave);

    return { newConversations, knownConversations };
  } catch (e) {
    const error = new Error();
    error.name = "LOAD_CONVERSATIONS_FAILED";
    error.message = `${e}`;
    throw error;
  }
};

export const updateConsentStatus = async (account: string) => {
  try {
    const client = (await getXmtpClient(account)) as Client;
    const consentList = await client.contacts.refreshConsentList();
    await saveConsentState(consentList, client.address);
  } catch (error) {
    console.error("Failed to update consent status:", error);
  }
};

const saveConsentState = async (
  consentList: ConsentListEntry[],
  account: string
) => {
  const peersStatus: SettingsStoreType["peersStatus"] = {};

  consentList.forEach((entry) => {
    if (entry.entryType === "address") {
      if (entry.permissionType === "allowed") {
        peersStatus[entry.value] = "consented";
      } else if (entry.permissionType === "denied") {
        peersStatus[entry.value] = "blocked";
      }
    }
  });

  if (Object.keys(peersStatus).length > 0) {
    getSettingsStore(account).getState().setPeersStatus(peersStatus);
  }
};

export const consentToPeersOnProtocol = async (
  account: string,
  peers: string[],
  consent: "allow" | "deny"
) => {
  try {
    const cleanPeers = peers.map((peer) => getCleanAddress(peer));
    const client = (await getXmtpClient(account)) as Client;

    if (consent === "allow") {
      await client.contacts.allow(cleanPeers);
    } else if (consent === "deny") {
      await client.contacts.deny(cleanPeers);
    } else {
      throw new Error(`Invalid consent type: ${consent}`);
    }
  } catch (error) {
    console.error("Error updating consent:", error);
  }
};

export const getConversationWithTopic = async (
  account: string,
  topic: string
): Promise<Conversation | undefined> => {
  const alreadyConversation = openedConversations[account]?.[topic];
  return alreadyConversation;
};

const createConversation = async (
  account: string,
  conversation: XmtpConversation
) => {
  if (!conversation.pending) {
    throw new Error("Can only create a conversation that is pending");
  }
  console.log(
    `[XMTP] Creating a conversation with peer ${conversation.peerAddress} and id ${conversation.context?.conversationId}`
  );
  const client = (await getXmtpClient(account)) as Client;

  const newConversation = await client.conversations.newConversation(
    conversation.peerAddress,
    conversation.context
  );
  handleNewConversation(client, newConversation);
  return newConversation.topic;
};

export const createPendingConversations = async (account: string) => {
  const pendingConvos = Object.values(
    getChatStore(account).getState().conversations
  ).filter((c) => c.pending && c.messages?.size > 0);
  if (pendingConvos.length === 0) return;
  console.log(
    `Trying to create ${pendingConvos.length} pending conversations...`
  );
  await Promise.all(pendingConvos.map((c) => createConversation(account, c)));
};