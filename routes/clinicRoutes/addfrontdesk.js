import express from "express";
import * as clinicController from "../../controllers/clinicControllers/addfrontdesk.js";
import { verifyToken, enforceClinicScope } from "../../middlewares/auth.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: FrontDesk
 *   description: Clinic owner - Front Desk Staff Management APIs
 */

/**
 * @swagger
 * /api/frontdesk/add:
 *   post:
 *     summary: Add a new front desk staff member
 *     tags: [FrontDesk]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ali Khan
 *               email:
 *                 type: string
 *                 example: ali.khan@example.com
 *               phone:
 *                 type: string
 *                 example: +923001234567
 *     responses:
 *       201:
 *         description: Front desk staff added successfully
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /api/frontdesk/all:
 *   get:
 *     summary: Get all front desk staff members
 *     tags: [FrontDesk]
 *     responses:
 *       200:
 *         description: Successfully fetched all front desk staff
 */

/**
 * @swagger
 * /api/frontdesk/update/{id}:
 *   put:
 *     summary: Update a front desk staff member
 *     tags: [FrontDesk]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ahmed Raza
 *               phone:
 *                 type: string
 *                 example: +923004567890
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *       404:
 *         description: Staff not found
 */

/**
 * @swagger
 * /api/frontdesk/delete/{id}:
 *   delete:
 *     summary: Delete a front desk staff member
 *     tags: [FrontDesk]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 *       404:
 *         description: Staff not found
 */

/**
 * @swagger
 * /api/frontdesk/toggle/{id}:
 *   put:
 *     summary: Toggle front desk staff active/inactive status
 *     tags: [FrontDesk]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff status toggled successfully
 *       404:
 *         description: Staff not found
 */

router.post("/add", verifyToken, clinicController.addFrontDesk);
router.get("/all", verifyToken, clinicController.fetchFrontDesks);
router.put("/update/:id", verifyToken, enforceClinicScope, clinicController.updateFrontDesk);
router.delete("/delete/:id", verifyToken, enforceClinicScope, clinicController.deleteFrontDesk);
router.put("/toggle/:id", verifyToken, enforceClinicScope, clinicController.toggleFrontDeskStatus);

export default router;
