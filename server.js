import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import prisma from './prisma/prisma.js';
import fs from 'fs';
import { verifyToken } from './middlewares/auth.js';
import { requestLogger, errorLogger, notFoundLogger } from './middlewares/logger.js';
 
// Import routes
import setupSwagger from './config/swaggerAutoConfig.js';
//import setupSwagger from './config/swaggerConfig.js';
import authRoutes from './routes/authRoutes.js';
import addDoctorbyClinic from './routes/clinicRoutes/adddoctor.js';
import addFrontDeskbyClinic from './routes/clinicRoutes/addfrontdesk.js';
import addPatientbyFrontDesk from './routes/frontdeskRoutes/addpatient.js';
import getFrontDeskDashboard from './routes/frontdeskRoutes/frontdeskDashboard.js';
import addClinic from './routes/superadminRoutes/addclinic.js';
import getallclinicpatients from './routes/clinicRoutes/getallclinicpatients.js';
import { getMetrics } from './controllers/superadminControllers/getMatricsController.js';
import doctorAppointmentRoutes from './routes/doctorRoutes/appointmentRoutes.js';
import doctorScheduleRoutes from './routes/doctorRoutes/scheduleRoutes.js';
import { getDoctorPayments } from './controllers/doctorControllers/doctorPaymentTracking.js';
import clinicDashboardRoutes from './routes/clinicRoutes/clinicDashboardRoutes.js';
import superadmindashboard from './routes/superadminRoutes/dashboard.js';
import swaggerDocs from "./swagger/swagger.js";
import appointments from './routes/clinicRoutes/appointments.js';
import patientdetailatfrontdesk from './routes/frontdeskRoutes/PatientDetail.js';
import updateAppointmentRoutes from './routes/frontdeskRoutes/updateAppointment.js'; // ← ADD THIS LINE

import { getClinicDetails } from './controllers/superadminControllers/addclinic.js';

const app = express();
const PORT = process.env.PORT || 5000;
dotenv.config();


setupSwagger(app);
// CORS and body parsing middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
// ============================================
// API ROUTES (Mounted for both /api/path and /path)
// ============================================

// Auth
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Superadmin
app.use('/api/superadmin', addClinic);
app.use('/superadmin', addClinic);
app.get('/api/superadmin/clinics/:id/details', getClinicDetails);
app.get('/superadmin/clinics/:id/details', getClinicDetails);

// Clinic
app.use('/api/clinic/admin', clinicDashboardRoutes);
app.use('/clinic/admin', clinicDashboardRoutes);
app.use('/api/clinic/patients', getallclinicpatients);
app.use('/clinic/patients', getallclinicpatients);
app.use('/api/clinic', addDoctorbyClinic);
app.use('/clinic', addDoctorbyClinic);
app.use('/api/clinic', appointments);
app.use('/clinic', appointments);

// Frontdesk
app.use('/api/frontdesk/appointment', updateAppointmentRoutes);
app.use('/frontdesk/appointment', updateAppointmentRoutes);
app.use('/api/frontdesk', addFrontDeskbyClinic);
app.use('/frontdesk', addFrontDeskbyClinic);
app.use('/api/frontdesk', getFrontDeskDashboard);
app.use('/frontdesk', getFrontDeskDashboard);

// Patient
app.use('/api/patient', addPatientbyFrontDesk);
app.use('/patient', addPatientbyFrontDesk);
app.use('/api/patient', patientdetailatfrontdesk);
app.use('/patient', patientdetailatfrontdesk);

// Doctor
app.use('/api/doctor/appointments', doctorAppointmentRoutes);
app.use('/doctor/appointments', doctorAppointmentRoutes);
app.use('/api/doctor/schedule', doctorScheduleRoutes);
app.use('/doctor/schedule', doctorScheduleRoutes);
app.get('/api/doctor/payments', getDoctorPayments);
app.get('/doctor/payments', getDoctorPayments);




// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use(notFoundLogger);

// Global Error Handler
app.use(errorLogger);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on("SIGINT", async () => {
  try {
    await prisma.$disconnect();
    console.log("👋 Prisma disconnected");
  } catch (err) {
    console.error("Error during Prisma disconnect:", err);
  } finally {
    process.exit(0);
  }
});

// Swagger Documentation
swaggerDocs(app);

// ============================================
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(80));
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('='.repeat(80));
    console.log('\n📚 DOCUMENTATION:');
    console.log(`   • Swagger UI:    http://localhost:${PORT}/api-docs`);
    console.log('\n🔗 API ENDPOINTS:');
    console.log(`   • Auth:          /api/auth/*`);
    console.log(`     - POST /api/auth/login`);
    console.log(`     - POST /api/auth/select-profile`);
    console.log(`   • Super Admin:   /api/superadmin/*`);
    console.log(`   • Clinic:        /api/clinic/*`);
    console.log(`   • Front Desk:    /api/frontdesk/*`);
    console.log(`   • Patient:       /api/patient/*`);
    console.log(`   • Doctor:        /api/doctor/*`);
    console.log('='.repeat(80) + '\n');
  });
}

export default app;