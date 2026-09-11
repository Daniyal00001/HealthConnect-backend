import express from "express";
import * as clinicController from "../../controllers/clinicControllers/getallclinicpatients.js";
import { verifyToken, requireRole } from "../../middlewares/auth.js";


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ClinicPatients
 *   description: Clinic patient management APIs
 */

/**
 * @swagger
 * /api/clinic/patients/all:
 *   get:
 *     summary: Get all patients registered under a clinic
 *     tags: [ClinicPatients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched clinic patients
 *       401:
 *         description: Unauthorized (invalid or missing token)
 */

router.get("/all", verifyToken, clinicController.getClinicPatients);

export default router;

