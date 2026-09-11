import express from "express";
import {
  addPatientWithAppointment,
  getAllDoctors,
  getAllPatients,
  updatePatient,
  deletePatient
} from "../../controllers/frontdeskControllers/addpatient.js";

import { verifyToken, requireRole } from "../../middlewares/auth.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Front desk patient management and appointment creation APIs
 */

/**
 * @swagger
 * /api/patient/add:
 *   post:
 *     summary: Add a new patient and create their appointment
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ali Khan"
 *               age:
 *                 type: number
 *                 example: 32
 *               phone:
 *                 type: string
 *                 example: "+92-300-1234567"
 *               doctorId:
 *                 type: string
 *                 example: "doctor_65a2b345"
 *               appointmentDate:
 *                 type: string
 *                 example: "2025-11-08T10:30:00Z"
 *     responses:
 *       201:
 *         description: Patient and appointment created successfully
 *       400:
 *         description: Invalid input data
 */

/**
 * @swagger
 * /api/patient/doctors:
 *   get:
 *     summary: Get list of all active doctors for dropdown selection
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: List of active doctors retrieved successfully
 */

/**
 * @swagger
 * /api/patient/all:
 *   get:
 *     summary: Get all registered patients
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: List of patients retrieved successfully
 */

/**
 * @swagger
 * /api/patient/update/{id}:
 *   put:
 *     summary: Update patient details
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: number
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       404:
 *         description: Patient not found
 */

/**
 * @swagger
 * /api/patient/delete/{id}:
 *   delete:
 *     summary: Delete a patient
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID to delete
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *       404:
 *         description: Patient not found
 */

router.post("/add", verifyToken, addPatientWithAppointment);
router.get("/doctors", verifyToken, getAllDoctors);
router.post("/doctors", verifyToken, getAllDoctors); // Also support POST with body
router.get("/all", getAllPatients);
router.put("/update/:id", updatePatient);
router.delete("/delete/:id", deletePatient);

export default router;
