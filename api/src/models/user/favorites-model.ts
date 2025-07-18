import { model, Schema } from "mongoose";

interface Favorites {
  user: String;
  products: String[];
}

const FavoritesSchema = new Schema<Favorites>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Favorites = model<Favorites>("Favorites", FavoritesSchema);
