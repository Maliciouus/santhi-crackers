import { model, Schema } from "mongoose";

interface Admin {
  email: string;
  password: string;
  role: string;
  active: boolean;
}

const adminSchema = new Schema<Admin>(
  {
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
      default: "admin",
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
    autoIndex: true,
  }
);

adminSchema.pre("save", async function (next) {
  const admin = this;

  if (!admin.isModified("password")) {
    return next();
  }

  admin.password = await Bun.password.hash(admin.password);

  next();
});

adminSchema.methods.comparePassword = async function (password: string) {
  return await Bun.password.verify(password, this.password);
};

const Admin = model<Admin>("Admin", adminSchema);

export { Admin };
