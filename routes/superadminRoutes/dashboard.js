import express from "express";
import * as superadminControllers from "../../controllers/superadminControllers/dashboard.js";

const router = express.Router();

// ✅ Use the controller from the imported object
router.get("/bookings", superadminControllers.getBookingsData);
router.get("/revenue", superadminControllers.getRevenueOverview);
export default router;
``