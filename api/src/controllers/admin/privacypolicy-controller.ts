import { PrivacyPolicyModel } from "@/models/privacypolicy-model";
import { Elysia, t } from "elysia";

export const privacyPolicyController = new Elysia({
  prefix: "/ppolicy",
  detail: {
    tags: ["Admin - Privacy Policy"],
  },
})
  .post(
    "/update",
    async ({ body }) => {
      const { content, delta } = body;

      const privacyPolicy = await PrivacyPolicyModel.findOne();

      if (!privacyPolicy) {
        await PrivacyPolicyModel.create({ content, delta });
      } else {
        privacyPolicy.content = content;
        privacyPolicy.delta = delta;
        await privacyPolicy.save();
      }

      return {
        message: "Privacy Policy updated successfully",
        data: content,
        status: true,
      };
    },
    {
      body: t.Object({
        content: t.String(),
        delta: t.String(),
      }),
      detail: {
        summary: "Update Privacy Policy",
        description: "Update Privacy Policy",
      },
    }
  )
  .get(
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
