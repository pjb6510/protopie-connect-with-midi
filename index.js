const easymidi = require("easymidi");
const io = require("socket.io-client");
const { go, filter } = require("fxjs");

const connectSocket = (io, address) =>
  go(
    io(address, {
      reconnectionAttempts: 5,
      timeout: 1000 * 10,
    }),
    (socket) =>
      socket
        .on("connect_error", (err) => {
          console.error("[SOCKETIO] disconnected, error", err.toString());
        })
        .on("connect_timeout", () => {
          console.error("[SOCKETIO] disconnected by timeout");
        })
        .on("reconnect_failed", () => {
          console.error("[SOCKETIO] disconnected by retry_timeout");
        })
        .on("reconnect_attempt", (count) => {
          console.error(
            `[SOCKETIO] Retry to connect #${count}, Please make sure ProtoPie Connect is running on ${address}`
          );
        })
        .on("connect", async () => {
          console.log("[SOCKETIO] connected to", address);
        })
        .on("disconnect", () => {
          console.log("[SOCKETIO] disconnected");
        })
        .on("ppMessage", (data) => {
          console.log("[SOCKETIO] Receive a message from Connect", data);
        })
  );

const socket = connectSocket(io, "http://localhost:9981");

const input = go(
  easymidi.getInputs(),
  filter((instrument) => instrument === "Digital Piano"),
  (pianos) => pianos[0] ?? null,
  (piano) => (piano ? new easymidi.Input(piano) : null)
);

const handleNoteon = (message) => {
  console.log("noteon", message);

  const { note, velocity } = message;
  const isPress = velocity !== 0 ? "p" : "u";

  socket.emit("ppMessage", {
    messageId: "noteon",
    value: `${isPress}${note}`,
  });
};

if (input) {
  console.log("connected to piano");
  input.on("noteon", handleNoteon);
} else {
  console.log("there is no connected piano");
  process.exit();
}
