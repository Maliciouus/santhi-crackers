import { validateToken } from "@/lib/util";
import Elysia from "elysia";
import { addressController } from "./address-controller";
import { bannerController } from "./banner-controller";
import { userCartController } from "./cart-controller";
import { categoriesController } from "./categories-controller";
import { couponController } from "./coupons-controller";
import { deliveryAgentReviewController } from "./deliveryA-controller";
import { userfaqsController } from "./faq-controller";
import { favoritesController } from "./favorites-controller";
import { fileController } from "./file-controller";
import { foodReviewController } from "./foodreview-controller";
import { invoiceController } from "./invoice-controller";
import { newuserCartController } from "./newcart/newcart";
import { newuserOrderController } from "./newcart/neworder";
import { notificationController } from "./notification-controller";
import { userOrderController } from "./order-controller";
import { productController } from "./product-controller";
import { userController } from "./user-controller";
import { privacyPolicyController } from "./user-privacypolicy-controller";
import { termsandconditionsController } from "./user-termsandconditions";
import { brandController } from "./brand-controller";
import { quoteController } from "./quote-controller";
import { demandController } from "./demand-controller";
import { userOfferController } from "./offer-controller";
import { employeeController } from "./employee-controller";
import { employeeAuthController } from "./employeeAuth-controller";

const employeeBaseController = new Elysia({
  prefix: "/employee",
})
  .use(employeeAuthController)
  .use(bannerController)
  .use(brandController)
  .use(productController)
  .use(categoriesController)
  .use(fileController)
  .use(quoteController)
  .use(userOfferController)
  .state("id", "")
  .state("mobile", "")
  .state("role", "")
  .onBeforeHandle(async ({ headers, set, store }) => {
    const token = headers["authorization"];

    try {
      const payload = await validateToken(token ?? "");
      store["id"] = payload.id;
      store["mobile"] = payload.mobile;
      store["role"] = payload.role;
      
      if (payload.role !== "employee") {
        set.status = 401;
        return { message: "Unauthorized" };
      }
    } catch (error) {
      set.status = 401;
      return { message: "Unauthorized" };
    }
  })
  .use(addressController)
  .use(userController)
  .use(userfaqsController)
  .use(favoritesController)
  .use(userOrderController)
  .use(newuserCartController) // new user
  .use(userCartController)
  .use(newuserOrderController) // new user
  .use(privacyPolicyController)
  .use(invoiceController)
  .use(foodReviewController)
  .use(deliveryAgentReviewController)
  .use(notificationController)
  .use(couponController)
  .use(termsandconditionsController)
.use(demandController)
.use(employeeController)

export { employeeBaseController };
