import { Schema, model } from "mongoose";

interface Manager {
  email: string;
  name: string;
  password: string;
  role: string;
  active: boolean;
  isDeleted: boolean;
}

const managerScheam = new Schema<Manager>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "manager",
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    autoIndex: true,
  }
);

managerScheam.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await Bun.password.hash(this.password);

  next();
});

export const Manager = model<Manager>("Manager", managerScheam);
