const wsConnections = new Set();

export const addWebSocket = (ws: any) => wsConnections.add(ws);
export const removeWebSocket = (ws: any) => wsConnections.delete(ws);
export const broadcastMessage = (message: unknown) => {
  wsConnections.forEach((ws: any) => {
    ws.send({ type: "order", message: message });
    console.log("Message Sented", message);
  });
};
