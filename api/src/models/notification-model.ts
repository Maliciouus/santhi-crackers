import { Schema, model, Document } from "mongoose";

interface INotification extends Document {
  title: string;
  description: string;
  type: string;
  userId: Schema.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    response:{
      type:String
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const NotificationModel = model<INotification>("Notification", notificationSchema);
export { NotificationModel, INotification };