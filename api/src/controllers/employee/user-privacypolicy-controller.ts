import { PrivacyPolicyModel } from "@/models/privacypolicy-model";
import { Elysia } from "elysia";

export const privacyPolicyController = new Elysia({
  prefix: "/ppolicy",
  detail: {
    tags: ["User - Privacy Policy"],
  },
}).get(
  "/",
  async () => {
    const privacyPolicy = await PrivacyPolicyModel.findOne();

    return {
      message: "Privacy Policy fetched successfully",
      data: privacyPolicy,
      status: true,
    };
  },
  {
    detail: {
      summary: "Get Privacy Policy",
      description: "Get Privacy Policy",
    },
  }
);
