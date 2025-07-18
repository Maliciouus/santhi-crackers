import { sendNotification } from "@/lib/firebase";
import { User } from "@/models/user-model";
import Elysia, { t } from "elysia";
import { NotificationModel } from "../../models/notification-model";

const notificationController = new Elysia({
  prefix: "/notification",
  detail: {
    tags: ["Admin - Notifications"],
  },
})
.post(
  "/create",
  async ({ body }) => {
    try {
      const { title, description, type, userId,demand } = body;
      const user = await User.findById(userId);
      if (!user) {
        return {
          message: "User not found",
          status: "error",
        };
      }

 await sendNotification(user.fcmToken, title, description, { type });
      const notification = await NotificationModel.create({
        title,
        description,
        type,
        userId,
        demand
      });

      return {
        message: "Notification Created Successfully",
        data: notification,
        status: "success",
      };
    } catch (error) {
      console.error(error);
      return {
        error,
        status: "error",
      };
    }
  },
  {
    body: t.Object({
      title: t.String(),
      description: t.String(),
      type: t.String(),
      userId: t.String(), 
      demand: t.String(), 
    }),
    detail: {
      summary: "Create a new notification",
    },
  }
)
  .get(
    "/all",
    async ({ query }) => {
      try {
        const { page, limit } = query;
        let _limit = Number(limit) || 4;
        let _page = Number(page) || 1;

        const notifications = await NotificationModel.find()
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .lean();

        const totalNotifications = await NotificationModel.countDocuments();
        const totalPages = Math.ceil(totalNotifications / _limit);
        const hasMore = notifications.length === _limit && _page < totalPages;

        return {
          notifications,
          currentPage: _page,
          totalPages,
          total: totalNotifications,
          hasMore,
          status: "success",
        };
      } catch (error: any) {
        console.log(error);
        return {
          error: error.message,
          status: "error",
        };
      }
    },
    {
      query: t.Object({
        page: t.Number({
          default: 1,
        }),
        limit: t.Number({
          default: 4,
        }),
      }),
      detail: {
        summary: "Get all notifications for the user",
      },
    }
  )
  .post(
    '/massnotifications',
    async ({ set, body }) => {
      try {
        let { title, message, users, type, mode } = body;
  
        if (mode === 'all') {
          const _users = await User.find({ active: true });
          users = _users.map((user) => user._id.toString());
        }
  
        const userPromises = users.map(async (userId) => {
          try {
            const _user = await User.findById(userId);
            if (!_user || !_user.fcmToken) {
              console.warn(`No FCM token for user ${userId}`);
              return null;
            }
  
            const sent = await sendNotification(_user.fcmToken, title, message, { type });
            if (sent) {
              await NotificationModel.create({
                title,
                description: message,
                type,
                userId: _user._id,
              });
              return { ok: true, userId };
            } else {
              // Token invalid; update user to remove token
              await User.updateOne({ _id: userId }, { $unset: { fcmToken: '' } });
              console.log(`Removed invalid FCM token for user ${userId}`);
              return null;
            }
          } catch (error: any) {
            console.error(`Error processing user ${userId}:`, error);
            return null;
          }
        });
  
        const results = await Promise.all(userPromises);
        const successfulUsers = results.filter((result) => result?.ok).length;
  
        if (successfulUsers === 0) {
          set.status = 400;
          return {
            message: 'No notifications sent; all tokens invalid or users not found',
          };
        }
  
        return {
          message: `Notification sent to ${successfulUsers} users`,
          status: 200,
        };
      } catch (error: any) {
        console.error('Mass notification error:', error);
        set.status = 500;
        return {
          message: error.message ?? 'Can’t send notification',
        };
      }
    },
    {
      body: t.Object({
        users: t.Array(t.String()),
        title: t.String(),
        message: t.String(),
        type: t.String({ default: 'promotion' }),
        mode: t.String({ default: 'selected' }),
      }),
    },
  )

export { notificationController };
