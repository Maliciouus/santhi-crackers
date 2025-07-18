import Elysia, { t } from "elysia";
import { Faqs } from "../../models/faqs-model";
import { Quotes } from "@/models/quote-model";

export const quoteController = new Elysia({
  prefix: "/quotes",
  detail: {
    tags: ["Admin - Quotes"],
  },
})
.post(
    "/create",
    async ({ body }) => {
      try {
        const { quote } = body;
  
        // Create a new quote
        const newQuote = await Quotes.create({ quote });
  
        return {
          message: "Quote created successfully",
          data: newQuote,
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          error: "Failed to create quote",
        };
      }
    },
    {
      body: t.Object({
        quote: t.String(),
      }),
      detail: {
        summary: "Create a new quote",
      },
    }
  )
  .get(
    "/all",
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
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const { id } = params;
        const { quote, isActive } = body;
  
        // Find the quote by ID
        const existingQuote = await Quotes.findById(id);
  
        if (!existingQuote) {
          return {
            message: "Quote not found",
            status: false,
          };
        }
  
        // Update the quote fields
        if (quote) existingQuote.quote = quote;
        if (isActive !== undefined) existingQuote.isActive = isActive;
  
        // Save the updated quote
        await existingQuote.save();
  
        return {
          message: "Quote updated successfully",
          data: existingQuote,
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          error: "Failed to update quote",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        quote: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        summary: "Update an existing quote",
      },
    }
  )

