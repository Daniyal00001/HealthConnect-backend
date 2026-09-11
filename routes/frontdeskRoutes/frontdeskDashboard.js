// ============================================
// FILE 2: routes/frontdeskRoutes/frontdeskDashboard.js
// ============================================

import express from "express";
import {
   getFrontDeskDashboard
} from "../../controllers/frontdeskControllers/frontdeskDashboard.js";

import { verifyToken, requireRole } from "../../middlewares/auth.js";

const router = express.Router();

/**
 * Front desk dashboard metrics
 * @typedef {object} FrontDeskDashboard
 * @property {number} todayAppointments - Total appointments today
 * @property {number} pendingAppointments - Pending appointments
 * @property {number} completedToday - Completed appointments today
 * @property {number} newPatientsToday - New patients registered today
 * @property {number} availableDoctors - Number of available doctors
 * @property {array<object>} upcomingAppointments - Upcoming appointments list
 * @property {object} statistics - Additional statistics
 */

/**
 * Error response
 * @typedef {object} ErrorResponse
 * @property {boolean} success - Always false
 * @property {string} error - Error message
 */

/**
 * GET /api/frontdesk/dashboard
 * @summary Get front desk dashboard metrics and statistics
 * @tags Front Desk - Dashboard
 * @security bearerAuth
 * @return {FrontDeskDashboard} 200 - Dashboard metrics retrieved successfully
 * @return {ErrorResponse} 401 - Unauthorized
 * @return {ErrorResponse} 403 - Forbidden - Front desk role required
 * @example response - 200 - Success response
 * {
 *   "todayAppointments": 25,
 *   "pendingAppointments": 8,
 *   "completedToday": 17,
 *   "newPatientsToday": 5,
 *   "availableDoctors": 10,
 *   "upcomingAppointments": [
 *     {
 *       "id": "appt_1",
 *       "time": "14:00",
 *       "patientName": "Hassan Ali",
 *       "doctorName": "Dr. Ahmed Khan",
 *       "reason": "Follow-up",
 *       "status": "scheduled"
 *     },
 *     {
 *       "id": "appt_2",
 *       "time": "14:30",
 *       "patientName": "Sara Ahmed",
 *       "doctorName": "Dr. Fatima Ali",
 *       "reason": "Regular checkup",
 *       "status": "scheduled"
 *     }
 *   ],
 *   "statistics": {
 *     "totalPatients": 850,
 *     "weeklyAppointments": 145,
 *     "monthlyAppointments": 620,
 *     "appointmentsByStatus": {
 *       "scheduled": 45,
 *       "completed": 520,
 *       "cancelled": 40,
 *       "no_show": 15
 *     }
 *   },
 *   "recentActivity": [
 *     {
 *       "type": "new_patient",
 *       "patientName": "Ali Raza",
 *       "time": "13:45",
 *       "description": "New patient registered"
 *     },
 *     {
 *       "type": "appointment_completed",
 *       "patientName": "Fatima Khan",
 *       "time": "13:30",
 *       "description": "Appointment completed with Dr. Ahmed"
 *     }
 *   ]
 * }
 */
router.get("/dashboard", verifyToken, requireRole("front_desk"), getFrontDeskDashboard);

/**
 * @swagger
 * /api/frontdesk/dashboard:
 *   get:
 *     summary: Get dashboard statistics for front desk (appointments, patients, etc.)
 *     tags: [FrontDesk]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Front desk dashboard data retrieved successfully
 *       403:
 *         description: Unauthorized or invalid role
 */

router.get("/dashboard", verifyToken, requireRole("front_desk"), getFrontDeskDashboard);

export default router;
