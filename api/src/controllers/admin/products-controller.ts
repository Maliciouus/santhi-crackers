import { Timings } from "@/models/timings";
import { format } from "date-fns";
import dayjs from "dayjs";
import Elysia, { t } from "elysia";
import * as xlsx from "xlsx";
import { Product } from "../../models/product";
import { ProductCategory } from "../../models/product-category";
import { Brand } from "@/models/brand-model";
import { deleteFile, saveFile } from "@/lib/file";
import { UnitModel } from "@/models/unit-model";
import { Group } from "@/models/group";

export const productsController = new Elysia({
  prefix: "/product",
  detail: {
    tags: ["Admin - Products"],
  },
})
.post(
  "/create",
  async ({ body }) => {
    try {
      const {
        productName,
        description,
        category,
        brand,
        price,
        ytLink,
        stock,
        unit,
        discount,
        ageGroup,
        occations,
        active,
        images,
        productCode,
        ratings,
        topSeller,
        gst,
        groups,
        specifications,
      } = body;

      const _unit = await UnitModel.findById(unit);
      if (!_unit) return { message: "Unit not found", status: false };

      const _category = await ProductCategory.findById(category);
      if (!_category) return { message: "Category not found", status: false };

      const _brand = await Brand.findById(brand);
      if (!_brand) return { message: "Brand not found", status: false };

      const existing = await Product.findOne({
        $or: [{ productName }, { productCode }],
      });

      if (existing) {
        return { message: "Product already exists", status: false };
      }

      let _images = [];
      for (let i of images) {
        const { filename, ok } = await saveFile(i, "product");
        if (ok) _images.push(filename);
      }

      let _specifications = JSON.parse(specifications);

      // Ensure groups, ageGroup, and occations are arrays
      const _groups = Array.isArray(groups) ? groups : [groups].filter(Boolean);
      const _ageGroup = Array.isArray(ageGroup) ? ageGroup : [ageGroup].filter(Boolean);
      const _occations = Array.isArray(occations) ? occations : [occations].filter(Boolean);

      const product = await Product.create({
        productName,
        description,
        price: +price,
        stock: +stock,
        unit: _unit._id,
        discount: +discount,
        ageGroup: _ageGroup,
        ytLink: ytLink || '', // Ensure ytLink is handled correctly
        occations: _occations,
        images: _images,
        active,
        category: _category._id,
        brand: _brand._id,
        productCode: productCode.toUpperCase(),
        ratings: +ratings,
        topSeller: topSeller === "true",
        gst: +gst,
        groups: _groups,
        specifications: _specifications,
      });

      await product.save();

      if (_groups && _groups.length > 0) {
        await Group.updateMany(
          { _id: { $in: _groups } },
          { $addToSet: { products: product._id } }
        );
      }

      return {
        message: "Product Created Successfully",
        data: { name: product.productName },
        status: true,
      };
    } catch (error:any) {
      console.error(error);
      return { status: false, message: "Error: " + error.message, error };
    }
  },
  {
    body: t.Object({
      productName: t.String({ default: "Product", examples: ["baby pants"] }),
      category: t.String({}),
      unit: t.String({}),
      brand: t.String({}),
      ytLink: t.Optional(t.String()),
      ratings: t.Number({ default: 5, examples: [5] }),
      images: t.Files(),
      productCode: t.String({ default: "123456", examples: ["123456"] }),
      price: t.String({ default: 100 }),
      discount: t.String({ default: 10 }),
      occations: t.Union([t.Array(t.String()), t.String()]),
      ageGroup: t.Union([t.Array(t.String()), t.String()]),
      description: t.String({ default: "Product" }),
      topSeller: t.String({ default: false }),
      stock: t.String({ default: 0 }),
      gst: t.String({ default: 0 }),
      active: t.Boolean({ default: true }),
      specifications: t.String(),
      groups: t.Union([t.Array(t.String()), t.String()]),
    }),
    detail: { summary: "Create a new product" },
  }
)

  .post(
    "/bulk-create",
    async ({ body }) => {
      try {
        const file = body.file?.[0]; 
        if (!file) {
          return { status: false, message: "No file uploaded" };
        }

        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: "buffer" });

        if (!workbook.SheetNames.length) {
          return { status: false, message: "Excel file has no sheets" };
        }

        const sheetName = workbook.SheetNames[0];
        // @ts-ignore
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet) as Record<string, any>[];

        if (data.length === 0) {
          return { status: false, message: "Excel file is empty" };
        }

        const products = [];
        const errors: string[] = [];
  
        const existingProducts = await Product.find({
          $or: [
            { productName: { $in: data.map((row) => row.productName) } },
            { productCode: { $in: data.map((row) => row.productCode) } },
          ],
        });
  
        const existingNames = new Set(existingProducts.map(p => p.productName));
        const existingCodes = new Set(existingProducts.map(p => p.productCode));
  
        const seenProducts = new Set();
        const seenCodes = new Set();
  
        for (const [index, row] of data.entries()) {
          try {
            const productCode = String(row.productCode || "").trim().toUpperCase();
            const productName = String(row.productName || "").trim();
            const categoryNumber = Number(row.category) || null;
            const timetoCook = String(row.timetoCook || "").trim();
            const servings = Number(row.servings) || 0;
            const price = Number(row.price) || 0;
            const timingNames = row.timing ? String(row.timing).split(',').map(t => t.trim()) : [];
            const ratings = Number(row.ratings) || 0;
            const description = String(row.description || "").trim();
            const topSeller = String(row.topSeller || "").toLowerCase() === "true";
            const gst = Number(row.gst) || 0;
            const type = String(row.type || "").trim();
  
            if (!productCode || !productName || !categoryNumber) {
              errors.push(`Row ${index + 1}: Missing required fields`);
              continue;
            }

            if (seenProducts.has(productName) || seenCodes.has(productCode)) {
              errors.push(`Row ${index + 1}: Duplicate in uploaded file - productCode "${productCode}" or productName "${productName}"`);
              continue;
            }
            seenProducts.add(productName);
            seenCodes.add(productCode);
  
            if (existingNames.has(productName) || existingCodes.has(productCode)) {
              errors.push(`Row ${index + 1}: Product already exists with name "${productName}" or code "${productCode}"`);
              continue;
            }

            const _category = await ProductCategory.findOne({ categoryNumber });
            if (!_category) {
              errors.push(
                `Row ${index + 1}: Category not found for category number: ${categoryNumber}`
              );
              continue;
            }

            const timingIds = [];
            for (const timingName of timingNames) {
              const timing = await Timings.findOne({ name: timingName });
              if (timing) {
                timingIds.push(timing._id);
              } else {
                errors.push(
                  `Row ${index + 1}: Timing not found: ${timingName}`
                );
              }
            }

            const newProduct = {
              productName,
              description,
              price,
              active: false,
              category: _category._id,
              productCode,
              ratings,
              timetoCook,
              servings,
              topSeller,
              gst,
              suggestions: [],
              foodSuggestions: [],
              dippings: [],
              timing: timingIds,
              type,
              
              images: []
            };

            products.push(newProduct);
          } catch (error) {
            errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        if (products.length > 0) {
          await Product.insertMany(products);
        }

        let errorFile = null;
        if (errors.length > 0) {
          const errorWorkbook = xlsx.utils.book_new();
          const errorRows = data.map((row, index) => ({
            ...row,
            Error: errors.filter(err => err.startsWith(`Row ${index + 1}`)).join("; ")
          })).filter(row => row.Error);
  
          if (errorRows.length > 0) {
            const errorSheet = xlsx.utils.json_to_sheet(errorRows);
            xlsx.utils.book_append_sheet(errorWorkbook, errorSheet, "Error Products");
            const errorBuffer = xlsx.write(errorWorkbook, { type: "base64", bookType: "xlsx" });
            errorFile = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${errorBuffer}`;
          }
        }

        return {
          status: errors.length === 0,
          message: `Successfully created ${products.length} products. ${errors.length} product(s) had errors.`,
          successCount: products.length,
          errorCount: errors.length,
          errors: errors.length > 0 ? errors : undefined,
          file: errorFile,
        };
      } catch (error) {
        console.error("Bulk create error:", error);
        return {
          status: false,
          message: "Error processing file",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({ file: t.Files() }),
      detail: {
        summary: "Bulk create products from an Excel sheet",
        tags: ["Products"],
      },
    }
  )

  .get(
    "/all",
    async ({ query }) => {
      const { page, limit, q, categoryId,brandId } = query;
      let _limit = limit || 10;
      let _page = page || 1;

      const searchQuery: Partial<Record<string, unknown>> = {
        isDeleted: false,
      };

      if (q) {
        searchQuery.$or = [
          { productName: { $regex: q, $options: "i" } },
          { productCode: { $regex: q, $options: "i" } },
        ];
      }

      if (categoryId) {
        searchQuery.category = categoryId;
      }
      if (brandId) {
        searchQuery.brand = brandId;
      }

      try {
        const products = await Product.find(searchQuery)
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .populate({
            path: "category",
            select: "name categoryNumber",
          })
          .populate({
            path: "unit",
            select: "name",
          })
          .populate({
            path: "brand",
            select: "name",
          })
          .populate({
            path: "groups",
            select: "name",
          })
          .exec();

        const totalProducts = await Product.countDocuments(searchQuery);

        return {
          products,
          status: true,
          total: totalProducts,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
          status: false,
          message: "Something went wrong",
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
        q: t.Optional(t.String()),
        categoryId: t.Optional(t.String()),
        brandId: t.Optional(t.String()),
      }),
      detail: {
        summary: "Get all products for admin panel",
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, query }) => {
      try {
        const { id } = params;
        const { permanent, type } = query;
        const product = await Product.findById(id);

        if (!product) {
          return { message: "Product not found" };
        }

        if (permanent) {
          product.active = false;
          product.isDeleted = true;

          await product.save();

          return {
            message: "Product permanently deleted",
            status: true,
          };
        }
        else{
          product.active=!product.active;
        }
        // if (reEnable != 0) {
        //   let reEnableIn;

        //   if (type === "time") {
        //     let currentServerTime = format(new Date(), "HH:mm");

        //     //@ts-ignore
        //     const [hours, minutes] = reEnable.split(":").map(Number);
        //     if (process.env.ENV === "PROD") {
        //       reEnableIn = dayjs()
        //         .set("hour", hours)
        //         .set("minute", minutes)
        //         .set("second", 0)
        //         .subtract(5, "hour")
        //         .subtract(30, "minute")
        //         .toDate();
        //     } else {
        //       reEnableIn = dayjs()
        //         .set("hour", hours)
        //         .set("minute", minutes)
        //         .set("second", 0)
        //         .toDate();
        //     }
        //   } else {
        //     //@ts-ignore
        //     reEnableIn = dayjs().add(reEnable, "day").toDate();
        //   }

        //   product.reEnabledAt = reEnableIn;
        //   product.active = false;
        // } else {
        //   product.reEnabledAt = null;
        //   product.active = true;
        // }

        const category = await ProductCategory.findById(product.category);

        if (!category) {
          return {
            message: "Category not found",
            status: false,
          };
        }

        await category.save();

        await product.save();
        return {
          message: `Product ${
            product.active ? "activated" : "deactivated"
          } successfully `,
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
          status: false,
          message: "Something went wrong",
        };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({
        permanent: t.Boolean({
          default: false,
        }),
        // reEnable: t.Union([t.Number({ default: 1 }), t.String()]),
        type: t.String({
          default: "date",
        }),
      }),
      detail: {
        summary: "Delete a product by id",
      },
    }
  )
  .patch(
    "/topseller/:id",
    async ({ params }) => {
      try {
        const { id } = params;
        const product = await Product.findById(id);
  
        if (!product) {
          return { message: "Product not found", status: false };
        }
  
        product.topSeller = !product.topSeller;
  
        await product.save();
  
        return {
          message: `Product ${product.topSeller ? "marked" : "unmarked"} as Top Seller`,
          status: true,
          topSeller: product.topSeller,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
          status: false,
          message: "Something went wrong",
        };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Toggle the topSeller status of a product",
      },
    }
  )
  
  .get(
    "/:id",
    async ({ params }) => {
      try {
        const { id } = params;
        const product = await Product.findById(id);
        return {
          message: "Product Fetched Successfully",
          data: product,
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
      detail: {
        description: "Get a product by id",
        summary: "Get a product by id",
      },
    }
  )
  .get(
    "/select",
    async (req) => {
      try {
        const { q, id, page, limit } = req.query;
        const _limit = limit || 10;
        const _page = page || 1;

        const searchQuery: Partial<Record<string, unknown>> = {
          isDeleted: false,
          active: true,
        };

        if (q) {
          searchQuery.$or = [
            { productName: { $regex: q, $options: "i" } },
            { productCode: { $regex: q, $options: "i" } },
          ];
        }

        const products = await Product.find(searchQuery)
          .select("productName _id productCode")
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ active: -1 })
          .exec();

        const totalProducts = await Product.countDocuments(searchQuery);

        return {
          products,
          status: true,
          total: totalProducts,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
          status: false,
          message: "Something went wrong",
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
        q: t.String({
          default: "",
        }),
        id: t.String({
          default: "",
        }),
      }),
      detail: {
        summary:
          "Get Products for select field with optional search and pagination",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const { id } = params;
        const {
          productName,
          description,
          category,
          price,
          ytLink,
          discount,
          // negotiateLimit,
          stock,
          // strikePrice,
          active,
          occations,
          ageGroup,
          images, // Can be a single File, an array of Files, or undefined
          existingImages, // Array of existing image filenames (or stringified JSON)
          productCode,
          ratings,
          brand,
          topSeller,
          gst,
          groups, 
          specifications,
        } = body;
  
        // Find the product by ID
        const product = await Product.findById(id);
        if (!product) {
          return { message: "Product not found", status: false };
        }
  
        // Check if the new category exists (if provided)
        if (category) {
          const newCategory = await ProductCategory.findById(category);
          if (!newCategory) {
            return { message: "New category not found", status: false };
          }
        }
        if (brand) {
          const newBrand = await Brand.findById(brand);
          if (!newBrand) {
            return { message: "New brand not found", status: false };
          }
        }
  
        // Check for duplicate product name or code (if provided)
        const existing = await Product.findOne({
          $or: [
            { productName: productName || "" },
            { productCode: productCode || "" },
          ],
          _id: { $ne: id },
        });
  
        if (existing) {
          return {
            message: "Another product exists with the same name or code",
            status: false,
          };
        }
  
        // Handle images
        let _images = product.images ? [...product.images] : [];
        console.log("Existing images in DB before update:", _images);
  
        // Define a maximum limit for total images (e.g., 5)
        const MAX_IMAGES = 5;
  
        // Step 1: Handle existingImages (sync with DB)
        if (existingImages !== undefined) {
          // Parse existingImages: It might be a stringified JSON array or an actual array
          let existingImagesArray: string[] = [];
          if (typeof existingImages === "string") {
            try {
              // Parse the stringified JSON
              const parsed = JSON.parse(existingImages);
              existingImagesArray = Array.isArray(parsed) ? parsed : [parsed];
            } catch (error) {
              console.error("Failed to parse existingImages:", existingImages, error);
              existingImagesArray = [existingImages];
            }
          } else if (Array.isArray(existingImages)) {
            existingImagesArray = existingImages;
          } else {
            existingImagesArray = existingImages ? [existingImages] : [];
          }
  
  
          // Case 1: If existingImages is empty, delete all images from DB
          if (existingImagesArray.length === 0) {
            // console.log("existingImages is empty. Deleting all images from DB.");
            if (_images.length > 0) {
              for (const oldImage of _images) {
                const { ok } = await deleteFile(oldImage,"product");
                if (!ok) {
                  console.warn(`Failed to delete old image: ${oldImage}`);
                } else {
                  console.log(`Deleted old image: ${oldImage}`);
                }
              }
            }
            _images = [];
          } else {
            // Case 2: Check for mismatch between DB images and existingImages
            const imagesToRemove = _images.filter(
              (img) => !existingImagesArray.includes(img)
            );
            console.log("Images to remove from DB:", imagesToRemove);
  
            if (imagesToRemove.length > 0) {
              for (const oldImage of imagesToRemove) {
                const { ok } = await deleteFile(oldImage,'product');
                if (!ok) {
                  console.warn(`Failed to delete old image: ${oldImage}`);
                } else {
                  console.log(`Deleted old image: ${oldImage}`);
                }
              }
            }
  
            // Update _images to match existingImages from payload
            _images = [...existingImagesArray];
            // console.log("Images after syncing with existingImages:", _images);
          }
        } else {
          console.log("No existingImages provided. Retaining DB images.");
        }
  
        // Step 2: Process new images (if any)
        let newImagesToUpload: any[] = [];
        if (images) {
          if (Array.isArray(images)) {
            console.log("Processing new images array from payload:", images.length);
            newImagesToUpload = images.filter(
              (image) => image && typeof image.arrayBuffer === "function"
            );
          } else if (images && typeof images.arrayBuffer === "function") {
            console.log("Processing a single new image from payload");
            newImagesToUpload = [images];
          } else {
            console.error("Invalid images field:", images);
            return { message: "Invalid images field", status: false };
          }
  
          // Check total image count before adding new images
          const totalImagesAfterAdding = _images.length + newImagesToUpload.length;
          if (totalImagesAfterAdding > MAX_IMAGES) {
            console.warn(
              `Total images (${totalImagesAfterAdding}) exceed the maximum limit (${MAX_IMAGES}).`
            );
            return {
              message: `Cannot add new images. Total images would exceed the maximum limit of ${MAX_IMAGES}.`,
              status: false,
            };
          }
  
          // Upload new images
          for (const image of newImagesToUpload) {
            const { filename, ok } = await saveFile(image, "product");
            if (ok && filename) {
              _images.push(filename);
              console.log(`Added new image: ${filename}`);
            } else {
              console.error("Failed to save new image:", image);
            }
          }
        } else {
          console.log("No new images provided in payload.");
        }
  
        // Ensure at least one image exists
        if (_images.length === 0) {
          return {
            message: "Product must have at least one image",
            status: false,
          };
        }
  
        console.log("Final images array before update:", _images);
  
        // Update the product
        const updatedProduct = await Product.findByIdAndUpdate(
          id,
          {
            productName: productName || product.productName,
            description: description || product.description,
            price: price ? +price : product.price,
            discount: discount ? +discount : product.discount,
            stock:stock?+stock:product.stock,
            occations: occations || product.occations,
            ageGroup: ageGroup || product.ageGroup,
            ytLink: ytLink || product.ytLink,
            // negotiateLimit:negotiateLimit?+negotiateLimit:product.negotiateLimit,
            // strikePrice: strikePrice ? +strikePrice : product.strikePrice,
            // HSNCode:HSNCode||product.HSNCode,
            images: _images, // Ensure this is a flat array
            active: active !== undefined ? active : product.active,
            category: category || product.category,
            brand: brand || product.brand,
            productCode: productCode || product.productCode.toUpperCase(),
            ratings: ratings ? +ratings : product.ratings,
            topSeller:
              topSeller !== undefined
                ? topSeller === "true"
                : product.topSeller,
            gst: gst ? +gst : product.gst,
            groups: groups || product.groups,
            // options: options ? JSON.parse(options) : product.options,
            specifications: specifications ? JSON.parse(specifications) : product.specifications,
          },
          { new: true }
        );
        if (groups && groups.length > 0) {
          await Group.updateMany(
            { _id: { $in: groups } },
            { $addToSet: { products: product._id } }
          );
        }
        return {
          message: "Product updated successfully",
          status: true,
          data: updatedProduct,
        };
      } catch (error) {
        console.error("Error updating product:", error);
        return {
          message: "Failed to update product",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        productName: t.Optional(t.String()),
        description: t.Optional(t.String()),
        category: t.Optional(t.String()),
        brand: t.Optional(t.String()),
        price: t.Optional(t.String()),
        discount: t.Optional(t.String()),
        ytLink:t.Optional(t.String()),
        stock:t.Optional(t.String()),
        // negotiateLimit:t.Optional(t.String()),
        // strikePrice: t.Optional(t.String()),
        // HSNCode:t.Optional(t.String()),
occations: t.Optional(t.Array(t.String())),
ageGroup: t.Optional(t.Array(t.String())),
        active: t.Optional(t.Boolean()),
        images: t.Optional(t.Any()),
        existingImages: t.Optional(t.Any()), // Can be a string (JSON) or array
        productCode: t.Optional(t.String()),
        ratings: t.Optional(t.String()),
        topSeller: t.Optional(t.String()),
        gst: t.Optional(t.String()),
        groups: t.Optional(t.Array(t.String())),
        // options: t.Optional(t.String()),
        specifications: t.Optional(t.String()),
      }),
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  .post(
    "/bulk-upload-images",
    async ({ body }) => {
      try {
        const { images } = body;
        if (!images || images.length === 0) {
          return {
            status: false,
            message: "No images provided",
            successCount: 0,
            errorCount: 0,
            updatedProducts: [],
            failedUploads: []
          };
        }
  
        let updatedProducts: string[] = [];
        let failedUploads: Array<{ name: string; reason: string }> = [];
        let successCount = 0;
        let errorCount = 0;
  
        for (let image of images) {
          const originalName = image.name;
          const productName = originalName
            .substring(0, originalName.lastIndexOf("."))
            .trim()
            .toLowerCase();
  
          try {
            const { filename, ok } = await saveFile(image, "product");
  
            if (!ok) {
              errorCount++;
              failedUploads.push({
                name: originalName,
                reason: "File save failed"
              });
              continue;
            }
  
            const product = await Product.findOne({
              productName: new RegExp(`^${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i")
            });
  
            if (!product) {
              errorCount++;
              failedUploads.push({
                name: originalName,
                reason: "No matching product found"
              });
              continue;
            }
  
            // Replace existing image or add if no image exists
            if (product.images.length > 0) {
              product.images[0] = filename; // Replace the first image
            } else {
              product.images.push(filename); // If no image exists, add it
            }
  
            product.active = true; // Ensure product is active
            await product.save();
            updatedProducts.push(productName);
            successCount++;
          } catch (error) {
            errorCount++;
            failedUploads.push({
              name: originalName,
              reason: error instanceof Error ? error.message : 'Unknown error occurred'
            });
          }
        }
  
        const status = errorCount === 0;
        let message = "";
        
        if (successCount > 0 && errorCount > 0) {
          message = `${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully and ${errorCount} image${errorCount > 1 ? 's' : ''} failed`;
        } else if (successCount > 0) {
          message = `${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully`;
        } else {
          message = `Failed to upload ${errorCount} image${errorCount > 1 ? 's' : ''} `;
        }
  
        return {
          status,
          message,
          successCount,
          errorCount,
          updatedProducts,
          failedUploads
        };
  
      } catch (error) {
        console.error(error);
        return {
          status: false,
          message: "Error uploading images: " + (error instanceof Error ? error.message : 'Unknown error occurred'),
          successCount: 0,
           // @ts-ignore
          errorCount: images?.length || 0,
          updatedProducts: [],
           // @ts-ignore
          failedUploads: images?.map((img: { name: any; }) => ({
            name: img.name,
            reason: error instanceof Error ? error.message : 'Unknown error occurred'
          })) || []
        };
      }
    },
    {
      body: t.Object({
        images: t.Files(),
      }),
      detail: {
        summary: "Bulk upload images and replace existing ones for products",
      },
    }
  )
  
  // .post(
  //   "/bulk-upload-images",
  //   async ({ body }) => {
  //     try {
  //       const { images } = body;
  //       if (!images || images.length === 0) {
  //         return {
  //           status: false,
  //           message: "No images provided",
  //           successCount: 0,
  //           errorCount: 0,
  //           updatedProducts: [],
  //           failedUploads: []
  //         };
  //       }
  
  //       let updatedProducts: string[] = [];
  //       let failedUploads: Array<{ name: string; reason: string }> = [];
  //       let successCount = 0;
  //       let errorCount = 0;
  
  //       for (let image of images) {
  //         const originalName = image.name;
  //         const productName = originalName
  //           .substring(0, originalName.lastIndexOf("."))
  //           .trim()
  //           .toLowerCase();
  
  //         try {
  //           const { filename, ok } = await saveFile(image, "product");
  
  //           if (!ok) {
  //             errorCount++;
  //             failedUploads.push({
  //               name: originalName,
  //               reason: "File save failed"
  //             });
  //             continue;
  //           }
  
  //           // const product = await Product.findOne({
  //           //   productName: { $regex: new RegExp(`^${productName}$`, "i") }
  //           // });
  //           const product = await Product.findOne({
  //             productName: new RegExp(`^${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i")
  //           });
  //           if (!product) {
  //             errorCount++;
  //             failedUploads.push({
  //               name: originalName,
  //               reason: "No matching product found"
  //             });
  //             continue;
  //           }
  
  //           product.images.push(filename);
  //           await product.save();
  //           updatedProducts.push(productName);
  //           successCount++;
  //         } catch (error) {
  //           errorCount++;
  //           failedUploads.push({
  //             name: originalName,
  //             reason: error instanceof Error ? error.message : 'Unknown error occurred'
  //           });
  //         }
  //       }
  
  //       const status = errorCount === 0;
  //       let message = "";
        
  //       if (successCount > 0 && errorCount > 0) {
  //         message = `${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully and ${errorCount} image${errorCount > 1 ? 's' : ''} failed`;
  //       } else if (successCount > 0) {
  //         message = `${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully`;
  //       } else {
  //         message = `Failed to upload ${errorCount} image${errorCount > 1 ? 's' : ''} `;
  //       }
  
  //       return {
  //         status,
  //         message,
  //         successCount,
  //         errorCount,
  //         updatedProducts,
  //         failedUploads
  //       };
  
  //     } catch (error) {
  //       console.error(error);
  //       return {
  //         status: false,
  //         message: "Error uploading images: " + (error instanceof Error ? error.message : 'Unknown error occurred'),
  //         successCount: 0,
  //         // @ts-ignore
  //         errorCount: images?.length || 0,
  //         updatedProducts: [],
  //         // @ts-ignore
  //         failedUploads: images?.map((img: { name: any; }) => ({
  //           name: img.name,
  //           reason: error instanceof Error ? error.message : 'Unknown error occurred'
  //         })) || []
  //       };
  //     }
  //   },
  //   {
  //     body: t.Object({
  //       images: t.Files(),
  //     }),
  //     detail: {
  //       summary: "Bulk upload images and map to products by productName",
  //     },
  //   }
  // )
  .get(
    "/prd-img",
    async () => {
      try {
        // Fetch products with images
        const productsWithImages = await Product.find({
          images: { $exists: true, $ne: [] }, // Ensures images exist and are not empty
        }).select("productName productCode");
  
        // Fetch products without images
        const productsWithoutImages = await Product.find({
          $or: [{ images: { $exists: false } }, { images: { $size: 0 } }],
        }).select("productName productCode");
  
        return {
          status: true,
          productsWithImages: {
            count: productsWithImages.length,
            list: productsWithImages.map(
              (product) => `${product.productCode}-${product.productName}`
            ),
          },
          productsWithoutImages: {
            count: productsWithoutImages.length,
            list: productsWithoutImages.map(
              (product) => `${product.productCode}-${product.productName}`
            ),
          },
        };
      } catch (error) {
        console.error(error);
        return {
          status: false,
          message: "Something went wrong",
          error,
        };
      }
    },
    {
      detail: {
        summary:
          "Get all products and separate those with and without images, including count",
      },
    }
  )
  .get(
    "/products-with-image",
    async ({ query }) => {
      try {
        const { imageUrl } = query;
        if (!imageUrl) {
          return {
            status: false,
            message: "Image URL is required",
            count: 0,
            products: [],
          };
        }
  
        // Find all products that have the given image URL in their images array
        const productsWithImage = await Product.find({
          images: imageUrl,
        });
  
        return {
          status: true,
          message: `${productsWithImage.length} products found`,
          count: productsWithImage.length,
          products: productsWithImage,
        };
      } catch (error) {
        console.error(error);
        return {
          status: false,
          message: "Error fetching products: " + (error instanceof Error ? error.message : "Unknown error occurred"),
          count: 0,
          products: [],
        };
      }
    },
    {
      query: t.Object({
        imageUrl: t.String(),
      }),
      detail: {
        summary: "Get all products containing a specific image URL and return the count",
      },
    }
  )
  
  .post(
    "/imgupload",
    async ({ body }) => {
      try {
        const { image } = body; // Expecting only a single image file
        if (!image) {
          return {
            status: false,
            message: "No image provided",
            updatedCount: 0,
            failedCount: 0,
          };
        }
  
        // Save the new image
        const { filename, ok } = await saveFile(image, "product");
        if (!ok) {
          return {
            status: false,
            message: "File save failed",
            updatedCount: 0,
            failedCount: 0,
          };
        }
  
        // Old image URL to replace
        const oldImageUrl = "uploads/product/Frame 1801286006 (1).png.4uhmmh9uxdal4y905mptc.png";
  
        // Find all products that contain the old image URL in their images array
        const productsWithOldImage = await Product.find({
          images: oldImageUrl,
        });
  
        if (productsWithOldImage.length === 0) {
          return {
            status: false,
            message: "No products found with the old image",
            updatedCount: 0,
            failedCount: 0,
          };
        }
  
        let updatedCount = 0;
        let failedCount = 0;
  
        for (let product of productsWithOldImage) {
          try {
            // Replace the old image with the new one
            product.images = product.images.map((img) =>
              img === oldImageUrl ? filename : img
            );
  
            await product.save();
            updatedCount++;
          } catch (error) {
            failedCount++;
            console.error(`Failed to update product ${product.productName}:`, error);
          }
        }
  
        return {
          status: updatedCount > 0,
          message: `${updatedCount} products updated successfully, ${failedCount} failed`,
          updatedCount,
          failedCount,
        };
      } catch (error) {
        console.error(error);
        return {
          status: false,
          message:
            "Error uploading and replacing image: " +
            (error instanceof Error ? error.message : "Unknown error occurred"),
          updatedCount: 0,
          failedCount: 0,
        };
      }
    },
    {
      body: t.Object({
        image: t.File(),
      }),
      detail: {
        summary: "Upload a new image and replace all occurrences of a specific old image in products",
      },
    }
  );
  