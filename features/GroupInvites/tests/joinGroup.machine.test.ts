import { createActor, waitFor } from "xstate";

import { Controlled } from "../../../dependencies/Environment/Environment";
import { JoinGroupClient } from "../GroupInvites.client";
import { joinGroupMachineLogic } from "../joinGroup.machine";

jest.setTimeout(1);

describe.only("Joining a Group from an Invite", () => {
  let OriginalCurrent: typeof Controlled;
  beforeEach(() => {
    OriginalCurrent = { ...Controlled };
  });

  afterEach(() => {
    Object.entries(OriginalCurrent).forEach(([key, value]) => {
      // todo fix this any crap
      Controlled[key as keyof typeof Controlled] = value as any;
    });
  });

  it.only("Should Successfully allow an Invited user to join with a valid group invite", async () => {
    let navigateToGroupPayload: any = null;
    const navigateToGroupScreenSpy = jest.fn((payload) => {
      navigateToGroupPayload = payload;
    });
    Controlled.joinGroupClient = JoinGroupClient.userAlreadyAMemberFixture();

    const input = { groupInviteId: "valid-invite-id", account: "0x123" };
    const joinGroupActor = createActor(
      joinGroupMachineLogic.provide({
        actions: {
          navigateToGroupScreen: navigateToGroupScreenSpy,
        },
      }),
      {
        input,
      }
    ).start();

    // Initial state
    expect(joinGroupActor.getSnapshot().value).toBe(
      "Loading Group Invite Metadata"
    );

    // Wait for metadata to load
    await waitFor(joinGroupActor, (state) =>
      state.matches("Waiting For User Action")
    );
    expect(false).toBe(true);
    expect(
      joinGroupActor.getSnapshot().context.groupInviteMetadata
    ).toBeDefined();

    // User taps join group
    joinGroupActor.send({ type: "user.didTapJoinGroup" });
    expect(joinGroupActor.getSnapshot().value).toBe("Attempting to Join Group");

    // Wait for join attempt to complete
    await waitFor(joinGroupActor, (state) =>
      state.matches("Determining Newly Joined Group")
    );

    // Wait for user consent
    await waitFor(joinGroupActor, (state) =>
      state.matches("Providing User Consent to Join Group")
    );

    // Wait for group refresh
    await waitFor(joinGroupActor, (state) => state.matches("Refreshing Group"));

    // Final state: User Joined Group
    await waitFor(joinGroupActor, (state) =>
      state.matches("User Joined Group")
    );

    expect(navigateToGroupScreenSpy).toHaveBeenCalledTimes(1);
    expect(navigateToGroupPayload.context.groupInviteMetadata.groupId).toBe(
      "groupId123"
    );
  });

  it("Should transition to 'User Was a Member Prior of Group Link Already' if the user has already joined the group before user action", async () => {
    let navigateToGroupPayload: any = null;
    const navigateToGroupScreenSpy = jest.fn((payload) => {
      navigateToGroupPayload = payload;
    });
    Controlled.joinGroupClient = JoinGroupClient.userAlreadyAMemberFixture();

    const input = { groupInviteId: "valid-invite-id", account: "0x123" };
    const joinGroupActor = createActor(
      joinGroupMachineLogic.provide({
        actions: {
          navigateToGroupScreen: navigateToGroupScreenSpy,
        },
      }),
      {
        input,
      }
    ).start();

    // Initial state
    expect(joinGroupActor.getSnapshot().value).toBe(
      "Loading Group Invite Metadata"
    );

    await waitFor(joinGroupActor, (state) =>
      state.matches("Loading Initially Joined Groups")
    );

    console.log("hi");
    console.log(joinGroupActor.getSnapshot().value);

    // Wait for metadata to load
    await waitFor(joinGroupActor, (state) =>
      state.matches("User Was a Member Prior of Group Link Already")
    );

    expect(navigateToGroupScreenSpy).toHaveBeenCalledTimes(1);
    expect(navigateToGroupPayload.context.groupInviteMetadata.groupId).toBe(
      "groupId123"
    );
  });
});
