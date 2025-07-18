import { deleteFile, saveFile } from "@/lib/file";
import Elysia, { t } from "elysia";
import { User } from "../../models/user-model";
import { StoreType } from "@/types";

export const userController = new Elysia({
  prefix: "/user",
  detail: {
    tags: ["User - Profile"],
  },
})
.put(
  "/",
  async ({ body, store, set }) => {
    try {
      const _store: any = store;
      const id = _store?.id ?? "";

      const { username, profileImage } = body;

      const user = await User.findById(id);

      if (!user) {
        return {
          message: "User not found",
          status: false,
        };
      }

      let updated = false;

      if (profileImage) {
        const { filename, ok } = await saveFile(profileImage, "profile-images");

        if (!ok) {
          set.status = 400;
          return {
            status: false,
            message: "Unable to upload profile image",
          };
        }

        // Delete old image only if it's being replaced
        if (user.profileImage) {
          deleteFile(user.profileImage, "profile-images");
        }

        user.profileImage = filename;
        updated = true;
      }

      if (username && username !== user.username) {
        user.username = username;
        updated = true;
      }

      if (!updated) {
        set.status = 400;
        return {
          status: false,
          message: "Nothing to update",
        };
      }

      await user.save();

      return {
        message: "User updated successfully",
        status: true,
        user,
      };
    } catch (error) {
      console.error(error);
      return {
        status: false,
        message: "Something went wrong",
        error,
      };
    }
  },
  {
    body: t.Object({
      username: t.Optional(t.String({ default: "" })),
      profileImage: t.Optional(t.Any()),
    }),
    detail: {
      summary: "Update a user by id",
    },
  }
)
.post(
  "/updateFcm",
  async ({ body, store }) => {
    const { fcmToken } = body;

    const userId = (store as StoreType)?.id;

    try {
      const user = await User.findById(userId);

      if (!user) {
        return {
          message: "User not found",
          ok: false,
        };
      }

      user.fcmToken = fcmToken;
      await user.save();

      return {
        message: "FCM token updated successfully",
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return {
        message: "Failed to update FCM token",
        ok: false,
      };
    }
  },
  {
    body: t.Object({
      fcmToken: t.String(),
    }),
  },
)