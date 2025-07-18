import { getAsBlob } from "@/lib/file-s3";
import Elysia, { t } from "elysia";
// @ts-ignore
import mime from "mime-types";

export const fileController = new Elysia({
  prefix: "/file",
  detail: {
    tags: ["User - File"],
  },
})
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const { key } = query;

        

        const { data, ok } = await getAsBlob(key);

    
        const mimeType = mime.lookup(key) || "application/octet-stream";

        set.headers = {
          "content-type": mimeType,
          "content-disposition": `attachment; filename=${key}`,
        };

        // @ts-ignore
        return Buffer.from(data);
      } catch (error) {
        console.error(error);
        return {
          error,
          status: false,
        };
      }
    },
    {
      query: t.Object({
        key: t.String(),
      }),
      detail: {
        summary: "Get a file from s3 bucket",
      },
    }
  )
  .get(
    "/local",
    async ({ set, query }) => {
      try {
        const { key } = query;

        if (!key) {
          set.status = 400;
          return {
            message: "Key Not Found",
          };
        }

        const file = Bun.file(key);

        if (!file) {
          set.status = 400;
          return {
            message: "File not found",
          };
        }
        set.headers["Content-Type"] = file.type || "image/png";
        return file;
      } catch (error: any) {
        console.log(error);
        set.status = 400;
        return {
          message: error,
        };
      }
    },
    {
      query: t.Object({
        key: t.String(),
      }),
      detail: {
        description: "View a file from local",
        summary: "View a file from local",
      },
    }
  );
