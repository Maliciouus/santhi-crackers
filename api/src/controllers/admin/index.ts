import { PasetoUtil } from "@/lib/paseto";
import Elysia from "elysia";
import { authController } from "./adminauth-controller";
import { bannerController } from "./banner-controller";
import { productCategoryController } from "./category-controller";
import { configController } from "./config-controller";
import { couponController } from "./coupon-controller";
import { dashboardController } from "./dashboard-controller";
import { deliveryAgentController } from "./deliveryagent-controller";
import { dippingsController } from "./dippings-controller";
import { faqsController } from "./faqs-controller";
import { managerController } from "./manager-controller";
import { notificationController } from "./notification-controller";
import { adminOrderController } from "./order-controller";
import { privacyPolicyController } from "./privacypolicy-controller";
import { productsController } from "./products-controller";
import { reportController } from "./report-controller";
import { adminStoreController } from "./store-controller";
import { suggetionsController } from "./suggestions-controller";
import { termsAndConditionsController } from "./termsandconditions-controller";
import { specificationController } from "./specification-controller";
import { usersControllerAdmin } from "./user-controller";
import { quoteController } from "./quote-controller";
import { brandsController } from "./brands-controller";
import { employeeController } from "./employee-controller";
import { comboOfferController } from "./combo-controller";
import { offerController } from "./offer-controller";
import { demandController } from "./demand-controller";
import { adminEmpOrderController } from "./empOrder-controller";
import { unitController } from "./unit-controller";
import { groupController } from "./group-controller";

const adminController = new Elysia({
  prefix: "/admin",
})
  .use(authController)
  .onBeforeHandle(async ({ cookie, set }) => {
    let pasetoToken = cookie.admin!.value ?? "";

    if (!pasetoToken) {
      set.status = 401;
      console.log("Unauthorized1");
      return {
        message: "Unauthorized",
      };
    }

    if (!pasetoToken.startsWith("v4.local.")) {
      set.status = 401;
      console.log("Unauthorized2");
      return {
        message: "Unauthorized",
      };
    }

    const payload = await PasetoUtil.decodePaseto(pasetoToken, true);

    if (!payload) {
      set.status = 401;
      console.log("Unauthorized3");
      return {
        message: "Unauthorized",
      };
    }
  })
  .use(demandController)
  .use(bannerController)
  .use(managerController)
  .use(usersControllerAdmin)
  .use(productCategoryController)
  .use(productsController)
  .use(specificationController)
  .use(suggetionsController)
  .use(dippingsController)
  .use(deliveryAgentController)
  .use(faqsController)
  .use(privacyPolicyController)
  .use(adminStoreController)
  .use(couponController)
  .use(notificationController)
  .use(adminOrderController)
  .use(dashboardController)
  .use(reportController)
  .use(configController)
  .use(termsAndConditionsController)
  .use(unitController)
.use(quoteController)
.use(brandsController)
.use(employeeController)
.use(comboOfferController)
.use(offerController)
.use(adminEmpOrderController)
.use(groupController)
export { adminController };
