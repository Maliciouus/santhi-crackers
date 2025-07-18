import { sendNotification } from "@/lib/firebase";
import { User } from "@/models/user-model";
import { StoreType } from "@/types";
import Elysia, { t } from "elysia";

export const notificationController = new Elysia({
  prefix: "/notification",
  detail: {
    tags: ["User - Notifications"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
}).post(
  "/",
  async ({ set, body, store }) => {
    try {
      const userId = (store as StoreType)["id"];

      const { title, content } = body;

      const user = await User.findById(userId);
      if (!user) {
        set.status = 404;
        return { message: "User not found" };
      }

      await sendNotification(user.fcmToken, title, content);

      return {
        message: "Notification sent successfully",
      };
    } catch (error: any) {
      set.status = 400;
      return {
        message: error.message ?? "Can't send notification",
      };
    }
  },
  {
    body: t.Object({
      title: t.String(),
      content: t.String(),
    }),
    detail: {
      summary: "Send a notification to the user",

      responses: {
        200: {
          description: "Notifications fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Something went wrong",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    },
  }
);
