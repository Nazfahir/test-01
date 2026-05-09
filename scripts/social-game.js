const MODULE_ID = "test-01";
const SOCKET_EVENT = `module.${MODULE_ID}`;

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "rooms", {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });
});

Hooks.once("ready", () => {
  game.socket.on(SOCKET_EVENT, handleSocketEvent);

  game.settings.registerMenu(MODULE_ID, "socialGame", {
    name: "Social Game",
    label: "Open Social Game",
    icon: "fas fa-users",
    type: SocialGameApp,
    restricted: false
  });
});

class SocialGameApp extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "social-game-app",
      title: "Social Game MVP",
      template: "modules/test-01/templates/social-game.hbs",
      width: 500,
      height: "auto",
      resizable: true
    });
  }

  async getData() {
    const rooms = game.settings.get(MODULE_ID, "rooms") ?? {};
    return {
      userName: game.user.name,
      roomId: game.user.getFlag(MODULE_ID, "roomId") ?? "",
      rooms: Object.entries(rooms).map(([id, room]) => ({
        id,
        hostName: room.hostName,
        participantCount: (room.participants ?? []).length,
        activePoll: room.activePoll ?? null
      }))
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='create-room']").on("click", this._onCreateRoom.bind(this));
    html.find("[data-action='join-room']").on("click", this._onJoinRoom.bind(this));
    html.find("[data-action='start-poll']").on("click", this._onStartPoll.bind(this));
    html.find("[data-action='vote']").on("click", this._onVote.bind(this));
    html.find("[data-action='close-poll']").on("click", this._onClosePoll.bind(this));
  }

  async _onCreateRoom() {
    const roomId = randomRoomId();
    const rooms = duplicate(game.settings.get(MODULE_ID, "rooms") ?? {});
    rooms[roomId] = {
      hostId: game.user.id,
      hostName: game.user.name,
      participants: [game.user.id],
      activePoll: null
    };
    await game.settings.set(MODULE_ID, "rooms", rooms);
    await game.user.setFlag(MODULE_ID, "roomId", roomId);
    broadcastRefresh();
  }

  async _onJoinRoom(event) {
    const root = event.currentTarget.closest(".social-game");
    const input = root?.querySelector("input[name='room-id']");
    const roomId = input?.value?.trim().toUpperCase();
    if (!roomId) return ui.notifications.warn("Room ID required");

    const rooms = duplicate(game.settings.get(MODULE_ID, "rooms") ?? {});
    const room = rooms[roomId];
    if (!room) return ui.notifications.error("Room not found");

    room.participants = Array.from(new Set([...(room.participants ?? []), game.user.id]));
    await game.settings.set(MODULE_ID, "rooms", rooms);
    await game.user.setFlag(MODULE_ID, "roomId", roomId);
    broadcastRefresh();
  }

  async _onStartPoll(event) {
    const roomId = game.user.getFlag(MODULE_ID, "roomId");
    const rooms = duplicate(game.settings.get(MODULE_ID, "rooms") ?? {});
    const room = rooms[roomId];
    if (!room || room.hostId !== game.user.id) return;

    const root = event.currentTarget.closest(".social-game");
    const question = root?.querySelector("input[name='question']")?.value?.trim();
    const optionA = root?.querySelector("input[name='option-a']")?.value?.trim();
    const optionB = root?.querySelector("input[name='option-b']")?.value?.trim();
    if (!question || !optionA || !optionB) return ui.notifications.warn("Question and options are required");

    room.activePoll = {
      question,
      options: [optionA, optionB],
      votes: {},
      open: true
    };
    await game.settings.set(MODULE_ID, "rooms", rooms);
    broadcastRefresh();
  }

  async _onVote(event) {
    const optionIndex = Number(event.currentTarget.dataset.option);
    const roomId = game.user.getFlag(MODULE_ID, "roomId");
    const rooms = duplicate(game.settings.get(MODULE_ID, "rooms") ?? {});
    const room = rooms[roomId];
    const poll = room?.activePoll;
    if (!poll?.open) return;

    poll.votes[game.user.id] = optionIndex;
    await game.settings.set(MODULE_ID, "rooms", rooms);
    broadcastRefresh();
  }

  async _onClosePoll() {
    const roomId = game.user.getFlag(MODULE_ID, "roomId");
    const rooms = duplicate(game.settings.get(MODULE_ID, "rooms") ?? {});
    const room = rooms[roomId];
    if (!room || room.hostId !== game.user.id || !room.activePoll) return;

    room.activePoll.open = false;
    await game.settings.set(MODULE_ID, "rooms", rooms);
    broadcastRefresh();
  }
}

function randomRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function handleSocketEvent(payload) {
  if (payload?.action !== "refresh") return;
  const app = Object.values(ui.windows).find((w) => w.id === "social-game-app");
  if (app) app.render(true);
}

function broadcastRefresh() {
  game.socket.emit(SOCKET_EVENT, { action: "refresh" });
  handleSocketEvent({ action: "refresh" });
}
