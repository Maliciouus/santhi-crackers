import { FirmUser, IndividualUser, PreUser } from "@/models/emp/preUser-model"; // Make sure PreUser is imported
import Elysia, { t } from "elysia";

export const userController = new Elysia({
  prefix: "/user",
  detail: {
    tags: ["User - Profile"],
  },
})
.post(
  "/create",
  async ({ body, set }) => {
    try {
      const {
        mobile,
        username,
        role = "preuser",
        active,
        address,
        userType,
        HospitalMedicalName,
        GSTIN,
      } = body;

      // 🔍 Check if user already exists
      const existingUser = await PreUser.findOne({ mobile });
      if (existingUser) {
        set.status = 400;
        return {
          status: false,
          message: "User already exists with this mobile number",
        };
      }

      let createdUser;

      // 👤 Create user based on type
      if (userType === "individual") {
        createdUser = await IndividualUser.create({
          mobile,
          username,
          role,
          active,
          address,
          HospitalMedicalName,
        });
      } else if (userType === "firm") {
        createdUser = await FirmUser.create({
          mobile,
          username,
          role,
          active,
          address,
          HospitalMedicalName,
          GSTIN,
        });
      } else {
        set.status = 400;
        return {
          status: false,
          message: "Invalid user type. Must be 'individual' or 'firm'",
        };
      }

      return {
        status: true,
        message: "User created successfully",
        user: createdUser,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      set.status = 500;
      return {
        status: false,
        message: "Internal Server Error",
        error,
      };
    }
  },
  {
    body: t.Object({
      mobile: t.Number(),
      username: t.Optional(t.String()),
      role: t.Optional(t.String()),
      active: t.Boolean(),
      address: t.Object({
        flatNo: t.String(),
        area: t.String(),
        nearbyPlaces: t.String(),
      }),
      userType: t.String({ enum: ["individual", "firm"] }),

      HospitalMedicalName: t.Optional(t.String()),

      // For firm
      GSTIN: t.Optional(t.String()),
    }),
    detail: {
      summary: "Create a user based on type",
    },
  }
)
.get(
  "/",
  async ({ query, set }) => {
    try {
      const { mobile, userType, username, page = 1, limit = 10 } = query;

      const filter: any = {};
      if (mobile) filter.mobile = mobile;
      if (userType) filter.type = userType;
      if (username) filter.username = { $regex: username, $options: "i" }; // case-insensitive

      const skip = (page - 1) * limit;

      const users = await PreUser.find(filter).skip(skip).limit(limit);
      const totalCount = await PreUser.countDocuments(filter);

      if (!users.length) {
        set.status = 404;
        return {
          status: false,
          message: "No users found",
        };
      }

      return {
        status: true,
        message: "Users fetched successfully",
        users,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        },
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      set.status = 500;
      return {
        status: false,
        message: "Internal Server Error",
        error,
      };
    }
  },
  {
    query: t.Object({
      mobile: t.Optional(t.Number()),
      userType: t.Optional(t.String({ enum: ["individual", "firm"] })),
      username: t.Optional(t.String()),
      page: t.Optional(t.Number()),   // New
      limit: t.Optional(t.Number()),  // New
    }),
    detail: {
      summary: "Get users by filters (with pagination)",
    },
  }
)
.patch(
  "/updateAddress",
  async ({ set, body }: { set: any; body: { address: { flatNo: string; area: string; nearbyPlaces?: string }; userId: string } }) => {
    const { address, userId } = body;
    
    try {
    
      const user = await PreUser.findById(userId);
      if (!user) {
        set.status = 404;
        return {
          message: 'User not found',
          status: false,
        };
      }
      
      user.address = {
        flatNo: address.flatNo,
        area: address.area,
        nearbyPlaces: address.nearbyPlaces || '',
      };
      
      await user.save();
      
      return {
        message: 'Address updated successfully',
        status: true,
        user: {
          _id: user._id,
          username: user.username,
          mobile: user.mobile,
          address: user.address,
        },
      };
    } catch (error) {
      set.status = 500;
      return {
        message: 'Failed to update address',
        status: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  {
    body: t.Object({
      address: t.Object({
        flatNo: t.String({ minLength: 1, error: 'Flat number is required' }),
        area: t.String({ minLength: 1, error: 'Area is required' }),
        nearbyPlaces: t.Optional(t.String()),
      }),
      userId: t.String(),
    }),
    detail: {
      summary: 'Patch PreUser address by Employee',
      description:
        'Partially update the address (flatNo, area, nearbyPlaces) for a PreUser identified by userId, initiated by an employee.',
    },
  },
)