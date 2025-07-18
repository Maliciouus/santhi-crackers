import Elysia, { t } from "elysia";
import { Faqs } from "../../models/faqs-model";
import { Quotes } from "@/models/quote-model";

export const quoteController = new Elysia({
  prefix: "/quotes",
  detail: {
    tags: ["user - Quotes"],
  },
})

  .get(
    "/",
    async () => {
      try {
        // Fetch all quotes from the database
        const quotes = await Quotes.find({});
  
        return {
          message: "Quotes retrieved successfully",
          data: quotes,
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          error: "Failed to retrieve quotes",
        };
      }
    },
    {
      detail: {
        summary: "Get all quotes",
      },
    }
  )

