import { PasetoUtil } from "@/lib/paseto";
import { Address } from "@/models/user/address-model";
import { OrderModel } from "@/models/user/order-model";
// @ts-ignore
import polyline from "@mapbox/polyline";
import Elysia, { t } from "elysia";
import { adminController } from "./admin";
import { employeeBaseController } from "./employee";
import { userBaseController } from "./user";
import { sendNotification } from "@/lib/firebase";

const baseRouter = new Elysia({
  prefix: "/api",
});

baseRouter.use(adminController);
baseRouter.use(userBaseController);
baseRouter.use(employeeBaseController);

baseRouter
  .ws("/deliveryagent/ws", {
    query: t.Object({
      orderId: t.String(),
      token: t.String(),
    }),
    open: async (ws) => {
      let { orderId, token } = ws.data.query;

      if (!orderId || !token) {
        ws.send("Unauthorized");
        ws.close();
        return;
      }
      try {
        if (!token.startsWith("v4.local.")) {
          throw new Error("Unauthorized");
        }

        let payload = await PasetoUtil.decodePaseto(token);

        if (!payload || !payload.payload) {
          throw new Error("You are not authorized to access this resource");
        }

        if (payload.payload["role"] !== "deliveryAgent") {
          throw new Error(
            "Unauthorized! You are not authorized to access this resource"
          );
        }

        ws.send("Authorized");
      } catch (error) {
        ws.send("Unauthorized");
        ws.close();
        return;
      }
    },

    message: async (ws, message) => {
      let payload: any = message;

      if (!["cords", "end"].includes(payload.type)) {
        ws.send(
          JSON.stringify({
            type: "error",
            data: "Invalid type",
          })
        );
        return;
      }

      if (payload.type === "end") {
        ws.close();
        return;
      }

      if (payload.type === "cords") {
        const { orderId, data } = payload;

        if (!orderId || !data || !data.lat || !data.lng) {
          ws.send(
            JSON.stringify({
              type: "error",
              data: "Invalid data! Please provide lat and lng",
            })
          );
          return;
        }

        const order = await OrderModel.findOne({ _id: orderId });

        if (!order) {
          ws.send(
            JSON.stringify({
              type: "error",
              data: "Order not found",
            })
          );
          return;
        }

        order.deliveryAgentCords = payload.data;

        let cords = { lat: data.lat, lng: data.lng };
        const { lat: agentLat, lng: agentLng } = cords;

        if (!order.mapPloygonResponse) {
          const address = await Address.findById(order.addressId);

          if (!address) {
            throw new Error("Address not found");
          }

          order.mapPloygonResponse = address.mapPloygonResponse ?? "{}";
        }

        const mapPolygonResponse = JSON.parse(order.mapPloygonResponse);
        const overviewPolyline =
          mapPolygonResponse.routes[0].overview_polyline.points;
        const polylinePoints = polyline.decode(overviewPolyline);

        const closestIndex = getClosestPoint(
          agentLat,
          agentLng,
          polylinePoints
        );
        const updatedPolylinePoints = polylinePoints.slice(closestIndex);
        const updatedEncodedPolyline = polyline.encode(updatedPolylinePoints);

        order.mapPloygonResponse = JSON.stringify({
          ...mapPolygonResponse,
          routes: [
            {
              ...mapPolygonResponse.routes[0],
              overview_polyline: { points: updatedEncodedPolyline },
            },
          ],
        });
        await order.save();

        ws.send(
          JSON.stringify({
            type: "success",
            data: payload.data,
            mapPolygonResponse: order.mapPloygonResponse,
          })
        );
      }
    },
    close: async (ws) => {
      console.log("Connection closed");
      ws.close();
    },
  })
  .ws("/user/ws", {
    query: t.Object({
      orderId: t.String(),
      token: t.String(),
    }),
    open: async (ws) => {
      let { orderId, token } = ws.data.query;

      if (!orderId || !token) {
        ws.send("Unauthorized");
        ws.close();
        return;
      }
      try {
        if (!token.startsWith("v4.local.")) {
          throw new Error("Unauthorized");
        }

        let payload = await PasetoUtil.decodePaseto(token);

        if (!payload || !payload.payload) {
          throw new Error("You are not authorized to access this resource");
        }

        if (payload.payload["role"] !== "user") {
          throw new Error(
            "Unauthorized! You are not authorized to access this resource"
          );
        }

        console.log("A new user connected!");
        ws.send("Authorized");
      } catch (error) {
        console.error("Error When Connecting as a user");
        ws.send("Unauthorized");
        ws.close();
        return;
      }
    },

    message: async (ws, message) => {
      let payload: any = message;

      if (!["cords", "end"].includes(payload.type)) {
        ws.send(
          JSON.stringify({
            type: "error",
            data: "Invalid type",
          })
        );
        return;
      }

      if (payload.type === "end") {
        ws.close();
        return;
      }

      if (payload.type === "cords") {
        const { orderId } = payload;

        const order = await OrderModel.findOne({ _id: orderId });

        if (!order) {
          ws.send(
            JSON.stringify({
              type: "error",
              data: "Order not found",
            })
          );
          return;
        }

        ws.send(
          JSON.stringify({
            type: "success",
            data: order.deliveryAgentCords,
            mapPolygonResponse: order.mapPloygonResponse,
          })
        );
      }
    },
    close: async (ws) => {
      console.log("Connection closed");
      ws.close();
    },
  });

export { baseRouter };



function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371e3;
  const toRad = (value: any) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getClosestPoint(agentLat: number, agentLng: number, points: any) {
  let minDist = Infinity;
  let closestIndex = 0;

  points.forEach(([lat, lng]: any, index: number) => {
    const dist = getDistance(agentLat, agentLng, lat, lng);
    if (dist < minDist) {
      minDist = dist;
      closestIndex = index;
    }
  });

  return closestIndex;
}
