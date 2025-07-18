import { config } from "@/lib/config";
import { calculateRoadDistance } from "@/lib/util";
import { StoreModel } from "@/models/store-model";
import { OrderModel } from "@/models/user/order-model";
import { StoreType } from "@/types";
import axios from "axios";
import Elysia, { t } from "elysia";
import { Address } from "../../models/user/address-model";

interface DistanceResult {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
}

export const addressController = new Elysia({
  prefix: "/address",
  detail: {
    tags: ["User - Address"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
  .get(
    "/:id",
    async ({ params }) => {
      try {
        const { id } = params;

        const address = await Address.findById(id);

        if (!address) {
          return { message: "Address not found" };
        }

        return {
          address,
          status: "success",
        };
      } catch (error) {
        console.log(error);
        return {
          error,
          status: "error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get a address by id",
      },
    }
  )
  .get(
    "/all",
    async ({ query, store }) => {
      try {
        const userId = (store as StoreType)["id"];

        const { page, limit } = query;
        let _limit = limit || 10;
        let _page = page || 1;

        _limit = Number(_limit);
        _page = Number(_page);

        const addresses = await Address.find(
          { userId, active: true },
          "-mapPloygonResponse"
        )
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .exec();

        const totalAddresses = await Address.countDocuments({
          userId,
          active: true,
        });

        return {
          addresses,
          status: "success",
          total: totalAddresses,
        };
      } catch (error) {
        console.log(error);
        return {
          error,
          status: "error",
        };
      }
    },
    {
      detail: {
        summary: "Get all addresses",
      },
    }
  )
  .post(
    "/create",
    async ({ body, store, set }) => {
      try {
        const userId = (store as any)["id"]; // Type assertion
  
        if (!userId) {
          return {
            message: "User not found",
            status: false,
          };
        }
  
        // Check if the user has existing addresses
        const existingAddresses = await Address.find({ userId });
  
        // Set isPrimary based on whether it's the first address
        const isPrimary = existingAddresses.length === 0;
  
        const address = new Address({
          ...body,
          userId,
          isPrimary, // Set isPrimary here
        });
  
        let EStore = await StoreModel.findOne({});
        if (!EStore) {
          return {
            message: "EStore not found",
            status: false,
          };
        }
  
        let EStoreCords = {
          lat: EStore?.latitude || config.lat,
          long: EStore?.longitude || config.long,
        };
  
        // let calculatedDistance: number;
        // let calculatedDuration: number;
        try {
          // const distanceResult: DistanceResult = await calculateRoadDistance(
          //   Number(EStoreCords.lat),
          //   Number(EStoreCords.long),
          //   Number(address.latitude),
          //   Number(address.longitude),
          //   []
          // );
          // calculatedDistance = distanceResult.distance.value;
          // calculatedDuration = distanceResult.duration.value;
        } catch (error) {
          console.error("Distance calculation error:", error);
          return {
            message: "Failed to calculate distance and duration",
            status: false,
          };
        }
  
        // let distanceInKm = calculatedDistance / 1000;
        let limit = 12;
  
        // if (distanceInKm > limit) {
        //   return {
        //     message: "Address must be within 12 km of the restaurant.",
        //     subMessage: "You can Place Order through Call.",
        //     buttonText: "Call",
        //     EStoreNumber: EStore.storePhone,
        //     status: false,
        //   };
        // }
  
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${EStoreCords.lat},${EStoreCords.long}&destination=${address.latitude},${address.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
  
        // address.deliveryFee = Math.ceil((calculatedDistance / 1000) * 5);
        // address.totalDistance = calculatedDistance;
        // address.deliverySeconds = calculatedDuration;
        address.mapPloygonResponse = JSON.stringify(response.data);
  
        const ordersForUser = await OrderModel.find({
          user: userId,
          addressId: address._id,
          status: {
            $nin: ["cancelled", "delivered"],
          },
        });
  
        for (const order of ordersForUser) {
          order.mapPloygonResponse = JSON.stringify(response.data);
          await order.save();
        }
  
        await address.save();
  
        return {
          message: "Address created successfully",
          data: address,
          status: true,
        };
      } catch (error) {
        console.error("Address creation error:", error);
        return {
          error: JSON.stringify(error),
          status: "error",
        };
      }
    },
    {
      body: t.Object({
        receiverName: t.String({ minLength: 3, default: "" }),
        receiverMobile: t.String({ minLength: 10, default: "" }),
        flatorHouseno: t.String({}),
        area: t.String({}),
        landmark: t.String({}),
        addressString: t.Optional(t.String({})),
        latitude: t.String({}),
        longitude: t.String({}),
        addressType: t.String({ default: "Home" }),
      }),
      detail: {
        summary: "Create a new address",
      },
    }
  )
  
  .delete(
    "/:id",
    async ({ params, store }) => {
      try {
        const { id } = params;
        const userId = (store as any)["id"]; // Ensure user is authenticated
  
        if (!userId) {
          return {
            message: "User not found",
            status: false,
          };
        }
  
        const address = await Address.findOne({ _id: id, userId });
  
        if (!address) {
          return { message: "Address not found", status: false };
        }
  
        if (address.isPrimary) {
          // Find the next active address to make primary
          const nextPrimaryAddress = await Address.findOne({
            userId,
            active: true,
            _id: { $ne: id }, // Exclude the deleting address
          }).sort({ createdAt: 1 }); // Pick the oldest available address
  
          if (nextPrimaryAddress) {
            nextPrimaryAddress.isPrimary = true;
            await nextPrimaryAddress.save();
          }
        }
  
        // Mark the address as inactive and not primary
        await Address.findByIdAndUpdate(id, {
          $set: { isPrimary: false, active: false },
        });
  
        return {
          message: "Address deleted successfully",
          status: true,
        };
      } catch (error) {
        console.error("Error deleting address:", error);
        return {
          error: JSON.stringify(error),
          status: "error",
        };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Delete an address by ID",
      },
    }
  )
  
  .put(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const { id } = params;
        const address = await Address.findById(id);

        if (!address) {
          return { message: "Address not found" };
        }

        const EStore = await StoreModel.findOne({});

        if (!EStore) {
          set.status = 404;
          return { message: "EStore not found", status: false };
        }

        if (body.latitude || body.longitude) {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${EStore?.latitude},${EStore?.longitude}&destination=${body.latitude},${body.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
          );

          address.mapPloygonResponse = JSON.stringify(response.data);

          console.log("New Location saved!");

          await address.save();
        }

        address.receiverName = body.receiverName || address.receiverName;
        address.receiverMobile = body.receiverMobile || address.receiverMobile;
        address.flatorHouseno = body.flatorHouseno || address.flatorHouseno;
        address.area = body.area || address.area;
        address.landmark = body.landmark || address.landmark;
        address.addressString = body.addressString || address.addressString;
        address.latitude = body.latitude || address.latitude;
        address.longitude = body.longitude || address.longitude;
        address.addressType = body.addressType || address.addressType;

        if (body.isPrimary) {
          // Set other addresses as non-primary
          await Address.updateMany({ userId: address.userId, isPrimary: true }, { $set: { isPrimary: false } });
        }

        address.isPrimary = body.isPrimary || address.isPrimary;

        await address.save();

        return {
          message: "Address updated successfully",
          data: address,
          status: true,
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
      params: t.Object({ id: t.String() }),
      body: t.Object({
        receiverName: t.String(),
        receiverMobile: t.String({
          minLength: 10,
          maxLength: 10,
        }),
        flatorHouseno: t.String(),
        area: t.String(),
        landmark: t.String(),
        addressString: t.Optional(t.String()),
        latitude: t.String(),
        longitude: t.String(),
        addressType: t.String(),
        isPrimary: t.Optional(t.Boolean()),
      }),
      detail: {
        summary: "Update a address by id",
      },
    }
  )
  .post(
    "/set-primary/:id",
    async ({ params, store }) => {
      try {
        const { id } = params;
        const userId = (store as any)["id"]; // Ensure user is authenticated
  
        if (!userId) {
          return {
            message: "User not found",
            status: false,
          };
        }
  
        // Set all other addresses as non-primary for this user
        await Address.updateMany(
          { userId, isPrimary: true }, 
          { $set: { isPrimary: false } }
        );
  
        // Set the selected address as primary
        const address = await Address.findOneAndUpdate(
          { _id: id, userId }, // Ensure the address belongs to the user
          { $set: { isPrimary: true } },
          { new: true }
        );
  
        if (!address) {
          return {
            message: "Address not found or doesn't belong to the user",
            status: false,
          };
        }
  
        return {
          message: "Primary address updated successfully",
          data: address,
          status: true,
        };
      } catch (error) {
        console.error("Error updating primary address:", error);
        return {
          error: JSON.stringify(error),
          status: "error",
        };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Set an address as primary",
      },
    }
  );
  
