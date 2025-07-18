import { addWebSocket, removeWebSocket } from "@/lib/ws-store";
import { app } from "./setup";
import { sendNotification } from "@/lib/firebase";

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "localhost";

let intervel: any;

app.ws("/api/admin/ws", {
  open: async (ws: { send: (arg0: string) => void; close: () => void; }) => {
    try {
      addWebSocket(ws);
      console.log("An Admin connected");
      ws.send(JSON.stringify({ type: "connected" }));

      intervel = setInterval(() => {
        ws.send(JSON.stringify({ type: "ping" }));
      }, 20000); // 20 seconds
    } catch (error) {
      ws.send(JSON.stringify({ type: "not connected" }));
      console.log("Admin closed!");
      clearInterval(intervel);
      ws.close();
    }
  },
  message(ws: any, message: any) {
    console.log("Message received", message);
  },
  close(ws: any) {
    removeWebSocket(ws);
    console.log("Admin closed!");
    clearInterval(intervel);
  },
  sendPings: true,
  ping(message: any) {
    return message;
  },
  idleTimeout: 600,
  pong(message: any) {
    return message;
  },
});

app.listen(
  {
    port: Number(process.env.PORT) || 4000,
    hostname:"0.0.0.0"
  },
  ({ hostname, port }) => {
    console.log(`🚀 Server running at http://${hostname}:${port}`);
  }
);
