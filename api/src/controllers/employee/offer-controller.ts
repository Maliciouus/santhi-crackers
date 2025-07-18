import comboModel from "@/models/combo-model";
import { DiscountOffer, FlatOffer, MRPOffer, NegotiateOffer } from "@/models/offer-model";
import { User } from "@/models/user-model";
import { Favorites } from "@/models/user/favorites-model";
import { StoreType } from "@/types";
import Elysia, { t } from "elysia";

export const userOfferController = new Elysia({
  prefix: "/offers",
  detail: {
    tags: ["User - Offers"],
    security: [{ bearerAuth: [] }],
  },
})
.get(
  "/",
  async ({ set, store }) => {
    const userId = (store as StoreType)["id"];

    try {
      // Fetch user favorites if userId exists
      let userFavorites: string[] = [];
      if (userId) {
        const favorites = await Favorites.findOne({ user: userId });
        userFavorites = favorites?.products?.map((p: any) => p.toString()) || [];
      }

      // Fetch all offers with populated items.productId for relevant types
      const [flatOffers, negotiateOffers, discountOffers, mrpOffers] = await Promise.all([
        FlatOffer.find().populate('products').lean(),
        NegotiateOffer.find().populate('items.productId').lean(),
        DiscountOffer.find().populate('items.productId').lean(),
        MRPOffer.find().populate('items.productId').lean(),
      ]);

      const offers = [...flatOffers, ...negotiateOffers, ...discountOffers, ...mrpOffers];

      // Add favorite status to items
      const processedOffers = offers.map((offer) => {
          //@ts-ignore
        const processedOffer = { ...offer, _id: offer._id.toString() };
          //@ts-ignore
        if (offer.items && offer.items.length > 0) {
            //@ts-ignore
          processedOffer.items = offer.items.map((item) => {
            const processedItem = { ...item, _id: item._id.toString() };
            if (item.productId) {
              processedItem.productId = {
                ...item.productId,
                _id: item.productId._id.toString(),
                favorite: userFavorites.includes(item.productId._id.toString()),
              };
            }
            return processedItem;
          });
        }
        return processedOffer;
      });

      if (!processedOffers.length) {
        set.status = 404;
        return {
          data: [],
          total: 0,
          status: false,
          message: "No offers found",
        };
      }

      return {
        data: processedOffers,
        total: processedOffers.length,
        status: true,
        message: "Offers fetched successfully",
      };
    } catch (error) {
      console.error("Error fetching offers:", error);
      return {
        error,
        status: false,
        message: "Something went wrong",
        data: [],
        total: 0,
      };
    }
  },
  {
    detail: {
      summary: "Get all offers with favorite status",
      description: "Fetches all offers (flat, negotiate, discount, mrp) with populated product details and favorite status based on user ID.",
    },
  },
)
.get(
  "/combo",
  async ({ query }) => {
    try {
      const { page = 1, limit = 10 } = query;
      const comboOffers = await comboModel.find({ isDeleted: false })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({path:'productsIncluded.productId',select:"productName images price strikePrice description options specifications"})
        .sort({ createdAt: -1 });
      
        const totalOffers = await comboModel.countDocuments({ isDeleted: false });

      
      return { comboOffers, total: totalOffers, status: true };
    } catch (error: any) {
      return { error: error.message, status: "error" };
    }
  },
  {
    query: t.Object({
      page: t.Number({ default: 1 }),
      limit: t.Number({ default: 10 }),
    }),
  }
)
.get(
  "/combo/:id",
  async ({ params }) => {
    try {
      const { id } = params;

      const comboOffer = await comboModel.findOne({
        _id: id,
        isDeleted: false,
      }).populate({
        path: 'productsIncluded.productId',
        select: "productName images price strikePrice description options specifications"
      });

      if (!comboOffer) {
        return { status: false, message: "Combo offer not found" };
      }

      return { comboOffer, status: true };
    } catch (error: any) {
      return { error: error.message, status: false };
    }
  },
  {
    params: t.Object({
      id: t.String(),
    }),
  }
)

