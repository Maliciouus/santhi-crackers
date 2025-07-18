import { PasetoUtil } from "@/lib/paseto";
import { Admin } from "@/models/admin-model";
import { Manager } from "@/models/manager-model";
import { OtpCountModel } from "@/models/otpCount-model";
import {StoreModel } from "@/models/store-model";
import Elysia, { t } from "elysia";

const authController = new Elysia({
  prefix: "/auth",
  tags: ["Admin Panel"],
})
  .post(
    "/create",
    async ({ body }) => {
      try {
        const { email, password } = body;

        const existing = await Admin.findOne({ email });

        if (existing) {
          return { message: "Email already exists" };
        }

        const admin = await Admin.create({
          email,
          password,
          role: "admin",
          active: true,
        });

        await admin.save();

        return {
          message: "Admin Created Successfully",
          data: {
            email: admin.email,
          },
        };
      } catch (error) {
        console.error(error);
        return {
          error,
        };
      }
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          default: "admin@gmail.com",
        }),
        password: t.String({
          default: "admin",
        }),
      }),
      detail: {
        summary: "Create a new admin if you want",
      },
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const { email, password } = body;

        let admin = await Admin.findOne({ email });
        let isManager = false;

        if (!admin) {
          let managerAdmin = await Manager.findOne({ email });

          if (!managerAdmin) {
            return { message: "Invalid Credentials", ok: false };
          }

          isManager = true;
          admin = managerAdmin;
        }

        if (await Bun.password.verify(password, admin.password)) {
          let token = await PasetoUtil.encodePaseto(
            {
              email: admin.email,
              role: "admin",
            },
            true
          );

          console.log(token);

          // const restaurent = await StoreModel.findOne();

          // const restaurentWithBase64 = {
          //   restaurentName: restaurent!.restaurentName,
          //   restaurentImage: restaurent!.restaurentImage,
          // };

          set.status = 200;
          set.cookie = {
            admin: {
              value: token,
              httpOnly: true,
              secure: true,
              sameSite: "none",
              path: "/",
              maxAge: 1000 * 60 * 60 * 24,
              expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
            },
          };
          return {
            message: "Login Successful",
            data: {
              id:admin._id,
              email: admin.email,
              token,
              isManager,
              // restaurent: restaurentWithBase64,
            },
            ok: true,
          };
        }

        return { message: "Invalid Credentials" };
      } catch (error) {
        set.status = 400;
        console.error(error);
        return {
          error,
        };
      }
    },
    {
      detail: {
        summary: "Admin panel login",
      },
      body: t.Object({
        email: t.String({
          format: "email",
          default: "admin@kingschic.com",
        }),
        password: t.String({
          default: "admin",
        }),
      }),
    }
  )
  .post(
    "/logout",
    async ({ set }) => {
      set.status = 200;
      set.cookie = {
        admin: {
          value: "",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          expires: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day
        },
      };
      return { message: "Logout Successful" };
    },
    {
      detail: {
        summary: "Admin panel logout",
      },
    }
  )
  .get(
    "/otp-count",
    async ({ query }) => {
      const { month, year } = query;
  
      try {
        // Validate month and year
        if (!month || !year) {
          return {
            message: "Month and year are required",
            status: false,
          };
        }
  
        // Find the OTP count document for the specified month and year
        const otpCount = await OtpCountModel.findOne({ month, year });
  
        if (!otpCount) {
          return {
            message: "No OTP count found for the specified month and year",
            status: false,
          };
        }
  
        return {
          message: "OTP count retrieved successfully",
          status: true,
          data: {
            month: otpCount.month,
            year: otpCount.year,
            count: otpCount.count,
          },
        };
      } catch (error:any) {
        console.error(error);
        return {
          error: error.message,
          status: false,
        };
      }
    },
    {
      query: t.Object({
        month: t.Number({ minimum: 1, maximum: 12 }),
        year: t.Number(),
      }),
      detail: {
        summary: "Get OTP count for a specific month and year",
        description: "Retrieve the count of OTPs sent for a specific month and year",
      },
    }
  )

export { authController };
