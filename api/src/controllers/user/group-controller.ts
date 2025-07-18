import { Group } from "@/models/group"; // Adjust the import path as necessary
import { Elysia, t } from "elysia";

export const groupController = new Elysia({
  prefix: "/group",
  detail: {
    tags: ["User - Group"],
  },
})

// Get all groups
.get(
  "/all",
  async ({ query }) => {
    try {
      const { page = 1, limit = 10, q } = query;

      const searchQuery = { isDeleted: false, isActive: true };

      if (q && q.trim() !== "") {
        searchQuery.name = { $regex: q, $options: "i" };
      }

      const groups = await Group.find(searchQuery)
        .populate("products", "productName")
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .exec();

      const totalGroups = await Group.countDocuments(searchQuery);

      return {
        message: "Groups fetched successfully",
        groups,
        status: true,
        total: totalGroups,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalGroups / Number(limit)),
      };
    } catch (error) {
      console.error("Error fetching groups:", error);
      return {
        status: false,
        message: "Failed to fetch groups",
        error: error instanceof Error ? error.message : error,
      };
    }
  },
  {
    query: t.Object({
      page: t.String({ default: "1" }),
      limit: t.String({ default: "10" }),
      q: t.String({ default: "" }),
    }),
    detail: {
      summary: "Get all groups",
    },
  }
)

