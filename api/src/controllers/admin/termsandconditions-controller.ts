import { TermsAndConditionsModel } from "@/models/termsandconditions";
import { Elysia, t } from "elysia";

export const termsAndConditionsController = new Elysia({
  prefix: "/termsandconditions",
  detail: {
    tags: ["Admin - Terms and Conditions"],
  },
})
  .post(
    "/update",
    async ({ body }) => {
      const { content, delta } = body;

      const terms = await TermsAndConditionsModel.findOne();

      if (!terms) {
        await TermsAndConditionsModel.create({ content, delta });
      } else {
        terms.content = content;
        terms.delta = delta;
        await terms.save();
      }

      return {
        message: "Terms updated successfully",
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
        summary: "Update Terms and Conditions",
        description: "Update Terms and Conditions",
      },
    }
  )
  .get(
    "/",
    async () => {
      const terms = await TermsAndConditionsModel.findOne();

      return {
        message: "Terms and Conditions fetched successfully",
        data: terms,
        status: true,
      };
    },
    {
      detail: {
        summary: "Get Terms and Conditions",
        description: "Get Terms and Conditions",
      },
    }
  );
