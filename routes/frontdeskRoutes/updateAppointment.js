// routes/frontdeskRoutes/updateAppointment.js
import express from 'express';
import { verifyToken } from "../../middlewares/auth.js";
import { updateAppointment } from '../../controllers/frontdeskControllers/updateAppointment.js';

const router = express.Router();

// PUT /api/frontdesk/appointment/:appointmentId - Update appointment details
router.put('/:appointmentId', verifyToken, updateAppointment);

export default router;