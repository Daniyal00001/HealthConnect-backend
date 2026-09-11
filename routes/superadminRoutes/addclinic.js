import express from "express";
import * as superadminControllers from "../../controllers/superadminControllers/addclinic.js";

const router = express.Router();

/**
 * System metrics
 * @typedef {object} SystemMetrics
 * @property {number} totalClinics - Total number of clinics
 * @property {number} totalDoctors - Total number of doctors
 * @property {number} totalPatients - Total number of patients
 * @property {number} totalAppointments - Total number of appointments
 * @property {number} activeUsers - Number of active users
 * @property {number} monthlyRevenue - Monthly revenue amount
 */

/**
 * Clinic object
 * @typedef {object} Clinic
 * @property {string} id - Clinic ID
 * @property {string} name - Clinic name
 * @property {string} address - Clinic address
 * @property {string} phone - Clinic phone number
 * @property {string} email - Clinic email address
 * @property {string} ownerName - Clinic owner name
 * @property {string} ownerEmail - Clinic owner email
 * @property {string} status - Clinic status (active/inactive)
 * @property {string} createdAt - Creation timestamp
 */

/**
 * Add clinic request
 * @typedef {object} AddClinicRequest
 * @property {string} name.required - Clinic name - eg: City Health Center
 * @property {string} address.required - Clinic address - eg: 123 Main St, Lahore
 * @property {string} phone.required - Clinic phone - eg: +92-300-1234567
 * @property {string} email - Clinic email - eg: info@clinic.com
 * @property {string} ownerName - Owner name - eg: Dr. Ahmed Khan
 * @property {string} ownerEmail - Owner email - eg: ahmed@clinic.com
 */

/**
 * Revenue data
 * @typedef {object} RevenueData
 * @property {number} totalRevenue - Total revenue
 * @property {number} monthlyRevenue - Monthly revenue
 * @property {array<object>} revenueByClinic - Revenue breakdown by clinic
 */

/**
 * Clinic list response
 * @typedef {object} ClinicListResponse
 * @property {array<Clinic>} clinics - List of clinics
 * @property {object} pagination - Pagination information
 * @property {number} pagination.currentPage - Current page number
 * @property {number} pagination.totalPages - Total number of pages
 * @property {number} pagination.totalClinics - Total number of clinics
 */

/**
 * Success response
 * @typedef {object} SuccessResponse
 * @property {boolean} success - Operation success status
 * @property {string} message - Success message
 */

/**
 * Error response
 * @typedef {object} ErrorResponse
 * @property {boolean} success - Always false
 * @property {string} error - Error message
 * @property {string} code - Error code
 */

/**
 * GET /api/superadmin/metrics
 * @summary Get system-wide metrics
 * @tags Super Admin
 * @security bearerAuth
 * @return {SystemMetrics} 200 - System metrics retrieved successfully
 * @return {ErrorResponse} 401 - Unauthorized - Super admin access required
 * @return {ErrorResponse} 500 - Internal server error
 * @example response - 200 - Success response
 * {
 *   "totalClinics": 45,
 *   "totalDoctors": 230,
 *   "totalPatients": 15600,
 *   "totalAppointments": 45200,
 *   "activeUsers": 312,
 *   "monthlyRevenue": 456000
 * }
 */
router.get("/metrics", superadminControllers.getMetrics);

/**
 * GET /api/superadmin/revenue
 * @summary Get system revenue analytics
 * @tags Super Admin
 * @security bearerAuth
 * @return {RevenueData} 200 - Revenue data retrieved successfully
 * @return {ErrorResponse} 401 - Unauthorized
 * @example response - 200 - Success response
 * {
 *   "totalRevenue": 5600000,
 *   "monthlyRevenue": 456000,
 *   "revenueByClinic": [
 *     {
 *       "clinicId": "clinic_1",
 *       "clinicName": "City Health Center",
 *       "revenue": 125000
 *     },
 *     {
 *       "clinicId": "clinic_2",
 *       "clinicName": "Downtown Medical",
 *       "revenue": 98000
 *     }
 *   ]
 * }
 */
router.get('/revenue', superadminControllers.getRevenue);

/**
 * POST /api/superadmin/add
 * @summary Add new clinic
 * @tags Super Admin
 * @security bearerAuth
 * @param {AddClinicRequest} request.body.required - Clinic information
 * @return {object} 201 - Clinic created successfully
 * @return {ErrorResponse} 400 - Validation error
 * @return {ErrorResponse} 401 - Unauthorized
 * @return {ErrorResponse} 409 - Clinic already exists
 * @example request - Add clinic request
 * {
 *   "name": "Downtown Medical Center",
 *   "address": "123 Main Street, Lahore",
 *   "phone": "+92-300-1234567",
 *   "email": "contact@downtownmedical.com",
 *   "ownerName": "Dr. Ahmed Khan",
 *   "ownerEmail": "ahmed@downtownmedical.com"
 * }
 * @example response - 201 - Success response
 * {
 *   "success": true,
 *   "clinic": {
 *     "id": "clinic_456",
 *     "name": "Downtown Medical Center",
 *     "address": "123 Main Street, Lahore",
 *     "phone": "+92-300-1234567",
 *     "status": "active",
 *     "createdAt": "2025-11-08T10:30:00Z"
 *   }
 * }
 */
router.post("/add", superadminControllers.addClinic);

/**
 * GET /api/superadmin/all
 * @summary Get all clinics
 * @tags Super Admin
 * @security bearerAuth
 * @param {number} page.query - Page number - eg: 1
 * @param {number} limit.query - Items per page - eg: 10
 * @param {string} status.query - Filter by status - eg: active - enum:active,inactive
 * @return {ClinicListResponse} 200 - Clinics retrieved successfully
 * @return {ErrorResponse} 401 - Unauthorized
 * @example response - 200 - Success response
 * {
 *   "clinics": [
 *     {
 *       "id": "clinic_1",
 *       "name": "City Health Center",
 *       "address": "456 Oak Avenue",
 *       "phone": "+92-321-9876543",
 *       "status": "active",
 *       "totalDoctors": 12,
 *       "totalPatients": 850
 *     },
 *     {
 *       "id": "clinic_2",
 *       "name": "Downtown Medical",
 *       "address": "789 Pine Street",
 *       "phone": "+92-300-5551234",
 *       "status": "active",
 *       "totalDoctors": 8,
 *       "totalPatients": 620
 *     }
 *   ],
 *   "pagination": {
 *     "currentPage": 1,
 *     "totalPages": 5,
 *     "totalClinics": 45
 *   }
 * }
 */
router.get("/all", superadminControllers.getAllClinics);

/**
 * GET /api/superadmin/{id}
 * @summary Get clinic details by ID
 * @tags Super Admin
 * @security bearerAuth
 * @param {string} id.path.required - Clinic ID - eg: clinic_123
 * @return {Clinic} 200 - Clinic details retrieved successfully
 * @return {ErrorResponse} 401 - Unauthorized
 * @return {ErrorResponse} 404 - Clinic not found
 * @example response - 200 - Success response
 * {
 *   "id": "clinic_1",
 *   "name": "City Health Center",
 *   "address": "456 Oak Avenue",
 *   "phone": "+92-321-9876543",
 *   "email": "info@cityhealthcenter.com",
 *   "status": "active",
 *   "owner": {
 *     "name": "Dr. Sarah Ahmed",
 *     "email": "sarah@cityhealthcenter.com"
 *   },
 *   "stats": {
 *     "totalDoctors": 12,
 *     "totalStaff": 8,
 *     "totalPatients": 850,
 *     "monthlyAppointments": 450
 *   }
 * }
 */
router.get("/clinics/:id/details", superadminControllers.getClinicDetails);
router.get("/:id", superadminControllers.getClinic);

/**
 * PUT /api/superadmin/update/{id}
 * @summary Update clinic information
 * @tags Super Admin
 * @security bearerAuth
 * @param {string} id.path.required - Clinic ID - eg: clinic_123
 * @param {AddClinicRequest} request.body.required - Updated clinic information
 * @return {object} 200 - Clinic updated successfully
 * @return {ErrorResponse} 400 - Validation error
 * @return {ErrorResponse} 401 - Unauthorized
 * @return {ErrorResponse} 404 - Clinic not found
 * @example request - Update clinic request
 * {
 *   "name": "City Health Center - Updated",
 *   "address": "456 Oak Avenue, Suite 200",
 *   "phone": "+92-321-9876543"
 * }
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "message": "Clinic updated successfully",
 *   "clinic": {
 *     "id": "clinic_1",
 *     "name": "City Health Center - Updated",
 *     "address": "456 Oak Avenue, Suite 200",
 *     "phone": "+92-321-9876543",
 *     "status": "active"
 *   }
 * }
 */
router.put("/update/:id", superadminControllers.updateClinic);

/**
 * DELETE /api/superadmin/delete/{id}
 * @summary Delete clinic permanently
 * @tags Super Admin
 * @security bearerAuth
 * @param {string} id.path.required - Clinic ID - eg: clinic_123
 * @return {SuccessResponse} 200 - Clinic deleted successfully
 * @return {ErrorResponse} 401 - Unauthorized
 * @return {ErrorResponse} 404 - Clinic not found
 * @return {ErrorResponse} 409 - Cannot delete clinic with active data
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "message": "Clinic deleted successfully"
 * }
 */
router.delete("/delete/:id", superadminControllers.deleteClinic);

/**
 * PUT /api/superadmin/toggle-status/{id}
 * @summary Toggle clinic status (active/inactive)
 * @tags Super Admin
 * @security bearerAuth
 * @param {string} id.path.required - Clinic ID - eg: clinic_123
 * @return {object} 200 - Status toggled successfully
 * @return {ErrorResponse} 401 - Unauthorized
 * @return {ErrorResponse} 404 - Clinic not found
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "message": "Clinic status updated",
 *   "clinic": {
 *     "id": "clinic_1",
 *     "name": "City Health Center",
 *     "status": "inactive"
 *   }
 * }
 */
router.patch("/toggle-status/:id", superadminControllers.toggleClinicStatus);

// Dashboard & Analytics endpoints
router.get("/metrics", superadminControllers.getMetrics);
router.get("/dashboard/metrics", superadminControllers.getMetrics);
router.get("/dashboard/revenue-chart", superadminControllers.getRevenueChart);
router.get("/dashboard/bookings", superadminControllers.getBookingsChart);
router.get("/dashboard/revenue", superadminControllers.getRevenue);

export default router;
