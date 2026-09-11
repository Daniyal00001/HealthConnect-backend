import express from "express";
import {
  getSchedule,
  createOrUpdateSchedule,
  deleteSchedule,
  getAvailableSlots
} from "../../controllers/doctorControllers/scheduleController.js";
import { verifyToken } from "../../middlewares/auth.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DoctorSchedule
 *   description: Doctor schedule management APIs
 */

/**
 * @swagger
 * /api/doctor/schedule:
 *   get:
 *     summary: Get doctor's schedule
 *     tags: [DoctorSchedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedule retrieved successfully
 *       400:
 *         description: Invalid request
 */
router.get("/", verifyToken, getSchedule);

/**
 * @swagger
 * /api/doctor/schedule:
 *   post:
 *     summary: Create or update doctor's schedule
 *     tags: [DoctorSchedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monday
 *               - tuesday
 *               - wednesday
 *               - thursday
 *               - friday
 *               - saturday
 *               - sunday
 *             properties:
 *               monday:
 *                 type: object
 *                 example: {"available": true, "startTime": "09:00", "endTime": "17:00"}
 *               tuesday:
 *                 type: object
 *                 example: {"available": true, "startTime": "09:00", "endTime": "17:00"}
 *     responses:
 *       201:
 *         description: Schedule created/updated successfully
 *       400:
 *         description: Invalid input
 */
router.post("/", verifyToken, createOrUpdateSchedule);

/**
 * @swagger
 * /api/doctor/schedule:
 *   delete:
 *     summary: Delete doctor's schedule
 *     tags: [DoctorSchedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       404:
 *         description: Schedule not found
 */
router.delete("/", verifyToken, deleteSchedule);

/**
 * @swagger
 * /api/doctor/schedule/available-slots:
 *   get:
 *     summary: Get available time slots for a doctor on a specific date
 *     tags: [DoctorSchedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: clinic_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: day
 *         required: true
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 */
router.get("/available-slots", verifyToken, getAvailableSlots);

export default router;

