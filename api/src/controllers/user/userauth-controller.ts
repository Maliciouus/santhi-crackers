import { generateReferCode } from "@/lib/util";
import Elysia, { t } from "elysia";
import { PasetoUtil } from "../../lib/paseto";
import { User } from "../../models/user-model";
import axios from "axios";
import { OtpCountModel } from "@/models/otpCount-model";

export const usersAuthController = new Elysia({
  prefix: "/userauth",
  detail: {
    tags: ["User - Auth"],
  },
})
.post(
  "/login",
  async ({ body }) => {
    const { mobile, referCode } = body;

    try {
      let newUser = false;
      let user = await User.findOne({ mobile });

      if (!user) {
        let refCode = generateReferCode();

        newUser = true;
        user = await User.create({
          mobile,
          active: true,
          username: "",
          favorites: null,
          email: "",
          profileImage: "",
          role: "user",
          refCode,
        });

        if (referCode) {
          const refree = await User.findOne({
            refCode: referCode,
          });

          if (refree) {
            user.referedBy = refree._id;
            await user.save();
          }
        }
      }

      const token = await PasetoUtil.encodePaseto({
        mobile: user.mobile.toString(),
        id: user._id.toString(),
        role: "user",
      });

      return {
        message: "User processed successfully",
        data: {
          token,
          userDetails: {
            profileImage: user.profileImage,
            email: user.email,
            mobile: user.mobile,
            username: user.username,
            userId: user._id.toString(),
            refCode: user.refCode,
          },
          newUser,
        },
        status: true,
      };
    } catch (error) {
      console.error(error);
      return {
        error,
        status: false,
      };
    }
  },
  {
    body: t.Object({
      mobile: t.String({
        minLength: 10,
        maxLength: 10,
      }),
      referCode: t.Optional(
        t.String({
          default: "",
        })
      ),
    }),
    detail: {
      summary: "Login the user to get token",
      description: "Login the user to get token",
    },
  }
)
.post(
  "/send-otp",
  async ({ body }) => {
    const { mobile } = body;

    try {
      const response = await axios.post('https://www.xopay.in/api/v2/otp/otp', {
        phone: mobile,
        company_name: "Fire Crackers",
      });

      if (response.data.status) {
        const now = new Date();
        const month = now.getMonth() + 1; 
        const year = now.getFullYear();

        // Find or create the OTP count document for the current month and year
        let otpCount = await OtpCountModel.findOne({ month, year });

        if (!otpCount) {
          otpCount = new OtpCountModel({
            month,
            year,
            count: 0
          });
        }

        otpCount.count += 1;

        await otpCount.save();
        return {
          message: "OTP sent successfully",
          status: true,
          otpId: response.data.id,
        };
      } else {
        return {
          message: "Failed to send OTP",
          status: false,
        };
      }
    } catch (error:any) {
      console.error(error);
      return {
        error: error.message,
        status: false,
      };
    }
  },
  {
    body: t.Object({
      mobile: t.String({ minLength: 10, maxLength: 10 }),
    }),
    detail: {
      summary: "Send OTP to the user's mobile number",
      description: "Send OTP to the user's mobile number for verification",
    },
  }
)

.post(
  "/verify-otp",
  async ({ body }) => {
    const { otpId, otpNo } = body;

    try {
      const response = await axios.post('https://www.xopay.in/api/v2/otp/otpverify', {
        id: otpId,
        otp_no: otpNo,
      });

      if (response.data.status) {
        return {
          message: "OTP verified successfully",
          status: true,
        };
      } else {
        return {
          message: "Failed to verify OTP",
          status: false,
        };
      }
    } catch (error:any) {
      console.error(error);
      return {
        error: error.message,
        status: false,
      };
    }
  },
  {
    body: t.Object({
      otpId: t.String(),
      otpNo: t.String({ minLength: 4, maxLength: 6 }),
    }),
    detail: {
      summary: "Verify OTP provided by the user",
      description: "Verify the OTP provided by the user for login",
    },
  }
)
  // .post(
  //   "/login",
  //   async ({ body }) => {
  //     const { mobile} = body;

  //     try {
  //       let newUser = false;
  //       let user = await User.findOne({ mobile });

  //       if (!user) {
  //         // let refCode = generateReferCode();

  //         newUser = true;
  //         user = await User.create({
  //           mobile,
  //           active: true,
  //           username: "",
  //           favorites: null,
  //           email: "",
  //           profileImage: "",
  //           role: "user",
  //           // refCode,
  //         });

  //         // if (referCode) {
  //         //   const refree = await User.findOne({
  //         //     refCode: referCode,
  //         //   });

  //         //   if (refree) {
  //         //     user.referedBy = refree._id;
  //         //     await user.save();
  //         //   }
  //         // }
  //       }

  //       const token = await PasetoUtil.encodePaseto({
  //         mobile: user.mobile.toString(),
  //         id: user._id.toString(),
  //         role: "user",
  //       });

  //       return {
  //         message: "User processed successfully",
  //         data: {
  //           token,
  //           userDetails: {
  //             profileImage: user.profileImage,
  //             email: user.email,
  //             mobile: user.mobile,
  //             username: user.username,
  //             userId: user._id.toString(),
  //             // refCode: user.refCode,
  //           },
  //           newUser,
  //         },
  //         status: true,
  //       };
  //     } catch (error) {
  //       console.error(error);
  //       return {
  //         error,
  //         status: false,
  //       };
  //     }
  //   },
  //   {
  //     body: t.Object({
  //       mobile: t.String({
  //         minLength: 10,
  //         maxLength: 10,
  //       }),
  //       // referCode: t.Optional(
  //       //   t.String({
  //       //     default: "",
  //       //   })
  //       // ),
  //     }),
  //     detail: {
  //       summary: "Login the user to get token",
  //       description: "Login the user to get token",
  //     },
  //   }
  // )
  .post(
    "/decrypt-token",
    async ({ body }) => {
      const { token } = body;

      try {
        const payload = await PasetoUtil.decodePaseto(token);

        return {
          message: "User processed successfully",
          data: { ...payload?.payload },
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
          status: false,
        };
      }
    },
    {
      body: t.Object({
        token: t.String(),
      }),
      detail: {
        summary: "Decrypt the token",
        description: "Decrypt the token",
      },
    }
  )

