import express from "express";
import {
  addDoctor,
  fetchDoctors,
  updateDoctor,
  deleteDoctor,
  toggleDoctorStatus,
  getDoctorDetails,
  getDoctorAppointments,
  getDoctorEarnings,
} from "../../controllers/clinicControllers/adddoctor.js";
import { getDoctorSchedule } from "../../controllers/doctorControllers/scheduleController.js";

import { verifyToken, enforceClinicScope } from '../../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Clinic doctor management APIs
 */

/**
 * @swagger
 * /api/clinic/add:
 *   post:
 *     summary: Add a new doctor
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dr. John Doe
 *               specialization:
 *                 type: string
 *                 example: Cardiologist
 *               phone:
 *                 type: string
 *                 example: +923001234567
 *               email:
 *                 type: string
 *                 example: johndoe@gmail.com
 *     responses:
 *       201:
 *         description: Doctor added successfully
 *       400:
 *         description: Invalid input or duplicate record
 */

/**
 * @swagger
 * /api/clinic/all:
 *   get:
 *     summary: Fetch all doctors of a clinic
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: Successfully fetched all doctors
 */

/**
 * @swagger
 * /api/clinic/update/{id}:
 *   put:
 *     summary: Update a doctor's information
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dr. Jane Doe
 *               specialization:
 *                 type: string
 *                 example: Neurologist
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       404:
 *         description: Doctor not found
 */

/**
 * @swagger
 * /api/clinic/delete/{id}:
 *   delete:
 *     summary: Delete a doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 *       404:
 *         description: Doctor not found
 */

/**
 * @swagger
 * /api/clinic/toggle/{id}:
 *   put:
 *     summary: Toggle doctor’s active/inactive status
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor status toggled successfully
 *       404:
 *         description: Doctor not found
 */

router.post("/add", verifyToken, addDoctor);
router.get("/all", verifyToken, fetchDoctors);
router.put("/update/:id", verifyToken, enforceClinicScope, updateDoctor);
router.delete("/delete/:id", verifyToken, enforceClinicScope, deleteDoctor);
router.put("/toggle/:id", verifyToken, enforceClinicScope, toggleDoctorStatus);
router.get("/details/:id", verifyToken, enforceClinicScope, getDoctorDetails); // /api/clinic/details/:id
router.get("/appointments/:id", verifyToken, enforceClinicScope, getDoctorAppointments); // /api/clinic/appointments/:id
router.get("/earnings/:id", verifyToken, enforceClinicScope, getDoctorEarnings); // /api/clinic/earnings/:id
router.get("/schedule/:id", verifyToken, enforceClinicScope, getDoctorSchedule); // /api/clinic/schedule/:id
export default router;
