import { model, Schema } from "mongoose";

interface Searches {
  user: String;
  query: String;
  createdAt: Date;
}

const SearchesSchema = new Schema<Searches>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

SearchesSchema.index(
  { user: 1, createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

export const SearchesModel = model<Searches>("Searches", SearchesSchema);
