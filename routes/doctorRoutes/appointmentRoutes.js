import express from "express";
import * as appointmentController from "../../controllers/doctorControllers/appointmentController.js";
import { getDoctorPayments } from "../../controllers/doctorControllers/doctorPaymentTracking.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DoctorAppointments
 *   description: Doctor appointment management and dashboard APIs
 */

/**
 * @swagger
 * /api/doctor/appointments/all:
 *   get:
 *     summary: Get all appointments for a specific doctor
 *     tags: [DoctorAppointments]
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Filter appointments by doctor ID (optional)
 *     responses:
 *       200:
 *         description: List of all appointments retrieved successfully
 */

/**
 * @swagger
 * /api/doctor/appointments/details/{appointment_id}:
 *   get:
 *     summary: Get details of a specific appointment by ID
 *     tags: [DoctorAppointments]
 *     parameters:
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the appointment
 *     responses:
 *       200:
 *         description: Appointment details retrieved successfully
 *       404:
 *         description: Appointment not found
 */

/**
 * @swagger
 * /api/doctor/appointments/update/{appointment_id}:
 *   put:
 *     summary: Update appointment status, notes, or other details
 *     tags: [DoctorAppointments]
 *     parameters:
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: completed
 *               notes:
 *                 type: string
 *                 example: Follow-up scheduled next week
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       404:
 *         description: Appointment not found
 */

/**
 * @swagger
 * /api/doctor/appointments/patient/{patient_id}/records:
 *   get:
 *     summary: Get a patient's previous appointment records
 *     tags: [DoctorAppointments]
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the patient
 *     responses:
 *       200:
 *         description: Successfully fetched patient records
 *       404:
 *         description: Patient or records not found
 */

/**
 * @swagger
 * /api/doctor/appointments/dashboard:
 *   get:
 *     summary: Get doctor dashboard metrics (appointments summary, stats, etc.)
 *     tags: [DoctorAppointments]
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 */

/**
 * @swagger
 * /api/doctor/appointments/today:
 *   get:
 *     summary: Get today's appointment summary for the doctor
 *     tags: [DoctorAppointments]
 *     responses:
 *       200:
 *         description: Today's appointments retrieved successfully
 */

/**
 * @swagger
 * /api/doctor/appointments/debug:
 *   get:
 *     summary: Debug endpoint to troubleshoot appointment issues
 *     tags: [DoctorAppointments]
 *     responses:
 *       200:
 *         description: Debug info retrieved successfully
 */

/**
 * @swagger
 * /api/doctor/appointments/payments:
 *   get:
 *     summary: Get doctor's payment and earnings tracking information
 *     tags: [DoctorAppointments]
 *     responses:
 *       200:
 *         description: Doctor payments data retrieved successfully
 */

router.get("/all", appointmentController.getAllAppointments);
router.get("/details/:appointment_id", appointmentController.getAppointmentDetails);
router.put("/update/:appointment_id", appointmentController.updateAppointment);
router.delete("/delete/:appointment_id", appointmentController.deleteAppointment);
router.get("/patient/:patient_id/records", appointmentController.getPatientPreviousRecords);
router.get("/dashboard", appointmentController.getDoctorDashboard);
router.get("/today", appointmentController.getTodayAppointments);
router.get("/debug", appointmentController.debugAppointments);
router.get("/payments", getDoctorPayments);

export default router;