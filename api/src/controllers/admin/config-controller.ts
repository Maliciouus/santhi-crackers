import { Config } from "@/models/config-model";
import Elysia, { t } from "elysia";

export const configController = new Elysia({
  prefix: "/config",
  detail: {
    tags: ["Admin - Config"],
  },
})
  .post(
    "/",
    async ({ body }) => {
      try {
        const { deliveryCharge } = body;

        const config = await Config.findOne();

        const _deliveryCharge = +deliveryCharge || 0;
        const _platformFee = +body.platformFee || 0;
        const _freeDeliveryMinDistance = +body.freeDeliveryMinDistance || 0;
        const _deliveryFreeAfter = +body.deliveryFreeAfter || 0;

        if (!config) {
          await Config.create({
            deliveryCharge: _deliveryCharge,
            platformFee: _platformFee,
          });
          return {
            message: "Config created successfully",
            status: true,
            data: {
              deliveryCharge: _deliveryCharge,
            },
          };
        }

        await Config.updateOne(
          {},
          {
            deliveryCharge: _deliveryCharge,
            platformFee: _platformFee,
            freeDeliveryMinDistance: _freeDeliveryMinDistance,
            deliveryFreeAfter: _deliveryFreeAfter,
          }
        );

        return {
          message: "Config updated successfully",
          status: true,
          data: {
            deliveryCharge: _deliveryCharge,
          },
        };
      } catch (error) {
        console.error(error);
        return {
          error,
        };
      }
    },
    {
      body: t.Object({
        deliveryCharge: t.String({
          default: 0,
        }),
        platformFee: t.String({
          default: 0,
        }),
        freeDeliveryMinDistance: t.String({
          default: 0,
        }),
        deliveryFreeAfter: t.String({
          default: 0,
        }),
      }),
      detail: {
        summary: "Update Config",
      },
    }
  )
  .get(
    "/",
    async ({}) => {
      const config = await Config.findOne();

      return {
        message: "Config fetched successfully",
        status: true,
        data: config,
      };
    },
    {
      detail: {
        summary: "Get Config",
      },
    }
  );
