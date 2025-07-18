import { generateInvoiceId } from "@/lib/util";
import { StoreModel } from "@/models/store-model";
import { OrderModel } from "@/models/user/order-model";
import { StoreType } from "@/types";
import Elysia, { t } from "elysia";
import { unlink } from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";

export const invoiceController = new Elysia({
  prefix: "/invoice",
  detail: {
    tags: ["User - Invoice"],
  },
}).post(
  "/generate",
  async ({ set, query, store }) => {
    if (!query.orderId) {
      set.status = 400;
      return {
        message: "Order Id is required",
        ok: false,
      };
    }

    let browser;
    try {
      const userId = (store as StoreType)["id"];

      const order: any = await OrderModel.findById(query.orderId)
        .populate("user")
        .populate("addressId")
        .populate("deliveryAgent")
        .populate("products.productId");

      if (order.user._id != userId) {
        set.status = 401;
        return {
          message: "You cant generate invoice for other user's order.",
          ok: false,
        };
      }

      const restaurent = await StoreModel.findOne({});

      if (!order || !restaurent) {
        set.status = 404;
        return {
          message: "Order / Restaurant not found",
          ok: false,
        };
      }

      if (!order.invoiceId) {
        order.invoiceId = generateInvoiceId();
        await order.save();
      }

      let invoiceContent = await Bun.file("templates/invoice.html").text();

      const address = `${order.addressId.flatorHouseno}\n${order.addressId.area}\n${order.addressId.landmark}\n${order.addressId.addressType}`;
      const restaurentAddress = `${restaurent.restaurentAddress}\n${restaurent.restaurentPhone}`;

      invoiceContent = invoiceContent
        .replace("{{order_id}}", order.orderId)
        .replace("{{invoice_id}}", order.invoiceId)
        .replace("{{gst}}", restaurent.gstNumber)
        .replace("{{fssai}}", restaurent.fssaiNumber)
        .replace("{{legal_entity_name}}", restaurent.legalEntityName)
        .replace("{{customer_name}}", order.user.username)
        .replace("{{customer_address}}", address)
        .replace("{{order_time}}", order.createdAt.toLocaleString())
        .replace("{{customer_phone}}", order.user.mobile)
        // .replace(
        //   "{{delivery_agent_name}}",
        //   order.deliveryAgent ? order.deliveryAgent.name : "N/A",
        // )
        .replace("{{restaurent_name}}", restaurent.restaurentName)
        .replace("{{restaurent_phone}}", restaurent.restaurentPhone)
        .replace("{{restaurent_email}}", restaurent.restaurentEmail)
        .replace("{{restaurent_address}}", restaurentAddress);

      let tableRows = "";

      let grossTotal = 0;
      let discountTotal = 0;
      let netTotal = 0;
      let grandTotal = 0;

      for (let product of order.products) {
        const { quantity, discount, totalAmount, productId } = product;
        const productName = productId.productName;
        const productPrice = productId.price;

        const netPrice = productPrice * quantity - (discount || 0);

        grossTotal += productPrice * quantity;
        discountTotal += discount || 0;
        netTotal += netPrice;
        grandTotal += totalAmount;

        tableRows += `
          <tr>
            <td>${productName}</td>
            <td>${quantity}</td>
            <td>${discount || 0}</td>
            <td> ₹ ${netPrice.toFixed(2)} </td>
            <td>₹ ${totalAmount.toFixed(2)}</td>
          </tr>`;
      }

      tableRows += `
        <tr>
          <td><b>Items Total</b></td>
          <td>${order.products.length}</td>
          <td>${discountTotal.toFixed(2)}</td>
          <td>${netTotal.toFixed(2)}</td>
          <td>${grossTotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td><b>Total Value</b></td>
          <td></td>
          <td></td>
          <td>${netTotal.toFixed(2)}</td>
          <td>${grandTotal.toFixed(2)}</td>
        </tr>`;

      invoiceContent = invoiceContent.replace("{{table_string}}", tableRows);
      let uniqeInvoiceName =
        "invoice" + Math.round(Math.random() * 1000000) + ".pdf";

      browser = await puppeteer.launch({
        headless: true,
        browser: "chrome",
        executablePath:
          ".cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });
      await page.setContent(invoiceContent);

      const pdfPath = path.join(process.cwd(), uniqeInvoiceName);

      await page.pdf({
        path: pdfPath,
        format: "A4",
        scale: 1,
        printBackground: true,
        waitForFonts: true,
      });

      const file = Bun.file(pdfPath);
      const buffer = await file.arrayBuffer();
      const blob = new Blob([buffer], { type: "application/pdf" });

      set.headers["Content-Type"] = "application/pdf";
      set.headers["Content-Disposition"] = `attachment; filename=invoice.pdf`;

      await unlink(pdfPath);

      if (browser) {
        browser.close();
      }

      return blob;
    } catch (error) {
      set.status = 400;
      console.error(error);
      return {
        message: error instanceof Error ? error.message : "Unknown error",
        ok: false,
      };
    } finally {
      if (browser) {
        // @ts-ignore
        await browser.close();
      }
    }
  },
  {
    query: t.Object({
      orderId: t.String(),
    }),
    detail: {
      summary: "Generate Invoice",
      description: "Generate Invoice as PDF using Puppeteer",
    },
  }
);
