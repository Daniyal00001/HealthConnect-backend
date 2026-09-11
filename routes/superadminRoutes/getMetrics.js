import express from "express";
import * as superadminControllers from "../../controllers/superadminControllers/addclinic.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: SuperAdmin
 *   description: Super Admin system overview metrics
 */

/**
 * @swagger
 * /api/superadmin/metrics:
 *   get:
 *     summary: Fetch overall clinic, doctor, and patient statistics
 *     tags: [SuperAdmin]
 *     responses:
 *       200:
 *         description: Metrics fetched successfully
 */

router.get("/metrics", superadminControllers.getMetrics);
// In your superadmin routes file (e.g., superadminRoutes.js)
router.get("/dashboard/revenue-chart", getRevenueChart);
router.get('/revenue', superadminControllers.getRevenue);
export default router;
