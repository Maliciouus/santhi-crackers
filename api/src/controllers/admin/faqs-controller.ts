import Elysia, { t } from "elysia";
import { Faqs } from "../../models/faqs-model";

export const faqsController = new Elysia({
  prefix: "/faqs",
  detail: {
    tags: ["Admin - Faqs"],
  },
})
  .post(
    "/create",
    async ({ body, set }) => {
      try {
        const { question, answer } = body;

        const existing = await Faqs.findOne({
          $or: [{ question }, { answer }],
        });

        if (existing) {
          return { message: "FAQ already exists", status: false };
        }

        const faqs = await Faqs.create({
          question,
          answer,
          isActive: true,
        });

        await faqs.save();

        return {
          message: "FAQ Created Successfully",
          status: true,
          data: {
            faqs,
          },
        };
      } catch (error) {
        console.error(error);
        return {
          status: false,
          error,
          message: "Something went wrong!",
        };
      }
    },
    {
      body: t.Object({
        question: t.String({
          default: "question 1",
        }),
        answer: t.String({
          default: "answer 1",
        }),
      }),
      detail: {
        summary: "Create a new faqs",
      },
    }
  )
  .get(
    "/all",
    async ({ query }) => {
      try {
        const { page, limit } = query;
        let _limit = limit || 10;
        let _page = page || 1;

        const faqs = await Faqs.find({
          isActive: true,
        })
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .select("question answer isActive")
          .exec();

        const totalFaqs = await Faqs.countDocuments({
          isActive: true,
        });

        return {
          faqs,
          status: true,
          total: totalFaqs,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
          status: "error",
        };
      }
    },
    {
      query: t.Object({
        page: t.Number({
          default: 1,
        }),
        limit: t.Number({
          default: 10,
        }),
      }),
      detail: {
        summary: "Get all FAQS for admin panel",
      },
    }
  )
  .delete(
    "/:id",
    async ({ params }) => {
      try {
        const faq = await Faqs.findByIdAndDelete(params.id);

        if (!faq) {
          return {
            message: "FAQ not found",
            status: false,
          };
        }

        return {
          message: "FAQ deleted successfully",
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Delete a faq",
      },
    }
  )
  .patch(
    "/:id",
    async ({ params, body }) => {
      try {
        const { id } = params;
        const { question, answer } = body;

        const faq = await Faqs.findById(id);

        if (!faq) {
          return { message: "FAQ not found", status: false, ok: false };
        }

        const existing = await Faqs.findOne({
          _id: { $ne: id },
          $or: [{ question }, { answer }],
        });

        if (existing) {
          return {
            message: "FAQ is Existing",
            status: false,
            ok: false,
          };
        }

        faq.question = question || faq.question;
        faq.answer = answer || faq.answer;

        await faq.save();

        return {
          message: "FAQ updated successfully",
          status: true,
          ok: true,
          data: faq,
        };
      } catch (error) {
        console.error("Error updating FAQ:", error);
        return {
          message: "Something went wrong",
          status: false,
          ok: false,
          error,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Partial(
        t.Object({
          question: t.String(),
          answer: t.String(),
        })
      ),
      detail: {
        summary: "Edit an existing FAQ",
      },
    }
  );
