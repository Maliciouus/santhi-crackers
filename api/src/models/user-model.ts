import { model, Schema, Types } from "mongoose";

interface User {
  mobile: number;
  role: string;
  active: boolean;
  username: string;
  profileImage: string;
  favorites: Types.ObjectId | null;
  email: string;
  fcmToken: string;
  attempts: Attempt[];
    refCode: string;
  referedBy: Types.ObjectId | null;
}

interface Attempt {
  productId: string;
  attempts: {
    amount: number;
    attemptNumber: number;
  }[];
}

const userSchema = new Schema<User>(
  {
    mobile: {
      type: Number,
      required: true,
      index: true,
    },
    username: {
      type: String,
      default: "",
    },
    fcmToken: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "user",
      required: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    refCode: {
      type: String,
      unique: true,
    },
    referedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      required: true,
    },
    favorites: {
      type: Schema.Types.ObjectId,
      ref: "Favorites",
      default: null,
    },
    attempts: [
      {
        productId: { type: String, required: true },
        attempts: [
          {
            amount: { type: Number, required: true },
            attemptNumber: { type: Number, required: true },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = model("User", userSchema);

export { User };
