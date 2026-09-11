import express from "express";
import * as clinicController from "../../controllers/clinicControllers/appointments.js";
import { verifyToken } from '../../middlewares/auth.js';



const router = express.Router();


// GET all clinic appointments
router.post("/appointments/all", verifyToken, clinicController.getAllAppointments);

// GET single appointment
router.get("/appointments/:id", verifyToken, clinicController.getAppointmentById);

// PUT update appointment
router.put("/appointments/update/:id", verifyToken, clinicController.updateAppointment);

// DELETE appointment
router.delete("/appointments/delete/:id", verifyToken, clinicController.deleteAppointment);

export default router;
