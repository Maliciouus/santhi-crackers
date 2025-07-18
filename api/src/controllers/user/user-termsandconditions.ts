import { TermsAndConditionsModel } from "@/models/termsandconditions";
import { Elysia } from "elysia";

export const termsandconditionsController = new Elysia({
  prefix: "/termsandconditions",
  detail: {
    tags: ["User - Terms and Conditions"],
  },
}).get(
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
