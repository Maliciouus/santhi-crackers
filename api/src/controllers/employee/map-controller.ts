import Elysia, { t } from "elysia";

export const mapController = new Elysia({
  prefix: "/map",
  detail: {
    tags: ["Map API"],
  },
}).get(
  "/",
  ({ query }) => {
    return {
      code: 0,
      message: "success",
      data: query,
    };
  },
  {
    query: t.Object({
      lat: t.String(),
      lng: t.String(),
      targetLat: t.String(),
      targetLng: t.String(),
    }),
  }
);
