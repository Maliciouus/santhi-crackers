import { Group } from "@/models/group"; // Adjust the import path as necessary
import { Product } from "@/models/product"; // Adjust the import path as necessary
import { Elysia, t } from "elysia";
import { deleteFile, saveFile } from "@/lib/file"; // Adjust the import path as necessary
import { Types } from "mongoose";

export const groupController = new Elysia({
  prefix: "/group",
  detail: {
    tags: ["Admin - Group"],
  },
})

// Create a new group
.post(
  "/create",
  async ({ body, set }) => {
    try {
      const { name, image, productIds = [] } = body;

      // Check if the group already exists
      const existingGroup = await Group.findOne({ name, isDeleted: false });
      if (existingGroup) {
        return { message: "Group already exists", status: false };
      }

      // Create the group
      const group = await Group.create({
        name,
        image: "",
      });

      if (image) {
        const { ok, filename } = await saveFile(image, "group");
        if (!ok) {
          set.status = 400;
          return { message: "Error uploading image", status: false };
        }
        group.image = filename;
      }

      // Add products to the group if provided
      if (productIds.length > 0) {
        group.products = productIds.map((id) => new Types.ObjectId(id));
        await Product.updateMany(
          { _id: { $in: productIds } },
          { $addToSet: { groups: group._id } }
        );
      }

      await group.save();

      return {
        message: "Group created successfully",
        status: true,
        data: group,
      };
    } catch (error) {
      console.error(error);
      return {
        status: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  {
    body: t.Object({
      name: t.String(),
      image: t.Optional(t.File({})),
      productIds: t.Optional(t.Array(t.String())),
    }),
    detail: {
      summary: "Create a new group",
    },
  }
)

// Get all groups
.get(
  "/all",
  async ({ query }) => {
    try {
      const { page = 1, limit = 10, q } = query;

      const searchQuery = { isDeleted: false };

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

// Add products to a group
.post(
  "/:groupId/add-products",
  async ({ params, body }) => {
    try {
      const { productIds } = body;

      const group = await Group.findById(params.groupId);
      if (!group) {
        return { message: "Group not found", status: false };
      }

      group.products = [...new Set([...group.products, ...productIds.map((id) => new Types.ObjectId(id))])];
      await group.save();

      await Product.updateMany(
        { _id: { $in: productIds } },
        { $addToSet: { groups: group._id } }
      );

      return {
        message: "Products added to group successfully",
        status: true,
      };
    } catch (error) {
      console.error(error);
      return {
        status: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  {
    params: t.Object({
      groupId: t.String(),
    }),
    body: t.Object({
      productIds: t.Array(t.String()),
    }),
    detail: {
      summary: "Add products to a group",
    },
  }
)

// Remove products from a group
.post(
  "/:groupId/remove-products",
  async ({ params, body }) => {
    try {
      const { productIds } = body;

      const group = await Group.findById(params.groupId);
      if (!group) {
        return { message: "Group not found", status: false };
      }

      group.products = group.products.filter(
        (productId) => !productIds.includes(productId.toString())
      );
      await group.save();

      await Product.updateMany(
        { _id: { $in: productIds } },
        { $pull: { groups: group._id } }
      );

      return {
        message: "Products removed from group successfully",
        status: true,
      };
    } catch (error) {
      console.error(error);
      return {
        status: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  {
    params: t.Object({
      groupId: t.String(),
    }),
    body: t.Object({
      productIds: t.Array(t.String()),
    }),
    detail: {
      summary: "Remove products from a group",
    },
  }
)

// Update a group
.put(
  "/:id",
  async ({ params, body }) => {
    try {
      const { name, image } = body;

      const group = await Group.findById(params.id);
      if (!group) {
        return { message: "Group not found", status: false };
      }

      if (image) {
        const { ok, filename } = await saveFile(image, "group");
        if (!ok) {
          return { message: "Failed to upload image", status: false };
        }
        if (group.image) {
          deleteFile(group.image, "group");
        }
        group.image = filename;
      }

      group.name = name;
      await group.save();

      return {
        message: "Group updated successfully",
        status: true,
      };
    } catch (error) {
      console.error(error);
      return {
        status: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      name: t.String(),
      image: t.Optional(t.File({})),
    }),
    detail: {
      summary: "Update a group",
    },
  }
)

// Delete a group
.delete(
  "/:id",
  async ({ params }) => {
    try {
      const group = await Group.findById(params.id);
      if (!group) {
        return { message: "Group not found", status: false };
      }

      group.isDeleted = true;
      await group.save();

      return {
        message: "Group deleted successfully",
        status: true,
      };
    } catch (error) {
      console.error(error);
      return {
        status: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete a group",
    },
  }
);
