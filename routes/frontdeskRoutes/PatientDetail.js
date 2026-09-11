import express from "express";
import patientController from "../../controllers/frontdeskControllers/patientdetail.js";
import { verifyToken } from "../../middlewares/auth.js";

const router = express.Router();

// GET or POST all patients (filtered by clinic_id)
router.get("/", verifyToken, patientController.getAllPatients);
router.post("/all", verifyToken, patientController.getAllPatients); // Also support POST with body

// GET single patient by ID
router.get("/:id", patientController.getPatientById);

// GET appointments for a specific patient
router.get("/:id/appointments", patientController.getPatientAppointments);

export default router;
