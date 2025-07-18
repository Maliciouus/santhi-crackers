import { User } from "@/models/user-model";
import cors from "@elysiajs/cors";
import { cron } from "@elysiajs/cron";
import { logger } from "@rasla/logify";
import dayjs from "dayjs";
import { Elysia } from "elysia";
import { connect } from "mongoose";
import { baseRouter } from "./src/controllers";
import { swagger } from "@elysiajs/swagger";
import { sendNotification } from "@/lib/firebase";

const app = new Elysia();

app.use(cors());

try {
  await connect(process.env.DB_URL as string, {
    dbName: "ecommerce",
  });
  console.log("Connected to MongoDB");
} catch (e) {
  console.log(e);
}

app.use(
  swagger({
    path: "/api/docs",
    exclude: ["/docs", "/docs/json"],
    theme: "dark",
    documentation: {
      servers: [
        {
          url: "/",
        },
      ],
      info: {
        title: "Ecommerce API",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            scheme: "bearer",
            type: "http",
            bearerFormat: "JWT",
          },
        },
      },
    },
  })
);

// @ts-ignore
app.use(logger({ console: true, skip: ["/docs", "/docs/json"] }));

app.use(baseRouter);

await sendNotification(
  "cMLkjEdGemzcSRInGrNU2l:APA91bGvhPZmSH1zHXBd_26TVxg9-eIExItGFzB1BpjNwzjlAqV9oPwc_JNkVaT2D7clfHmCHLhNnvMf1XGFiTnUSNha-dqw_NPRMMw3Ga2u79NpPDHJxR0",
  "Gopal",
  "This is a test notification"
)

app.use(
  cron({
    name: "clear-attempts-daily",
    // Run at 12:00 AM every day
    pattern: "0 0 * * *",
    async run() {
      try {
        const result = await User.updateMany({}, { $set: { attempts: [] } });

        console.log(
          `✅ Cleared attempts for ${result.modifiedCount
          } users at ${dayjs().format()}`
        );
      } catch (error) {
        console.error("❌ Error clearing attempts:", error);
      }
    },
  })
);

app.onError(({ code, error, set }) => {
  set.status = "Internal Server Error";
  return {
    message: error,
    ok: false,
  };
});

// setInterval(() => {
//   broadcastMessage("New Order Received");
// }, 2000);

export { app };
