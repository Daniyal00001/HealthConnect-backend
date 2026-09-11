import express from "express";
import * as clinicController from "../../controllers/clinicControllers/clinicDashboardController.js";

const router = express.Router();

// GET /clinic/admin/dashboard?clinic_id=<clinicId>
router.get('/dashboard', clinicController.getDashboardData);

export default router;