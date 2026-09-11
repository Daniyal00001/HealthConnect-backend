import express, { Router } from "express";
import * as authController from "../controllers/authController.js";
import * as authMiddleware from "../middlewares/auth.js";
const router = Router();
/**
 * User credentials for login
 * @typedef {object} LoginRequest
 * @property {string} email.required - User email address - eg: user@example.com
 * @property {string} password.required - User password - eg: password123
 */

/**
 * User object
 * @typedef {object} User
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} name - User full name
 * @property {string} role - User role (super_admin, clinic_owner, doctor, front_desk)
 * @property {string} status - Account status (active, inactive)
 */

/**
 * Login success response
 * @typedef {object} LoginResponse
 * @property {boolean} success - Operation success status
 * @property {string} token - JWT authentication token
 * @property {User} user - User information
 */

/**
 * Clinic information
 * @typedef {object} Clinic
 * @property {string} id - Clinic ID
 * @property {string} name - Clinic name
 * @property {string} address - Clinic address
 * @property {string} status - Clinic status (active, inactive)
 */

/**
 * User clinics response
 * @typedef {object} UserClinicsResponse
 * @property {boolean} success - Operation success status
 * @property {array<Clinic>} clinics - List of clinics user has access to
 */

/**
 * Role information
 * @typedef {object} Role
 * @property {string} roleId - Role ID
 * @property {string} roleName - Role name
 * @property {string} clinicId - Associated clinic ID
 * @property {string} clinicName - Associated clinic name
 */

/**
 * User roles response
 * @typedef {object} UserRolesResponse
 * @property {boolean} success - Operation success status
 * @property {array<Role>} roles - List of user roles
 */

/**
 * Error response
 * @typedef {object} ErrorResponse
 * @property {boolean} success - Always false for errors
 * @property {string} error - Error message
 * @property {string} code - Error code
 */

/**
 * POST /api/auth/user-clinics
 * @summary Get user's accessible clinics
 * @tags Authentication
 * @param {object} request.body.required - User identification
 * @property {string} request.body.userId - User ID
 * @property {string} request.body.email - User email
 * @return {UserClinicsResponse} 200 - List of user clinics
 * @return {ErrorResponse} 401 - Unauthorized
 * @return {ErrorResponse} 404 - User not found
 * @example request - Get user clinics
 * {
 *   "userId": "user_123",
 *   "email": "doctor@clinic.com"
 * }
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "clinics": [
 *     {
 *       "id": "clinic_1",
 *       "name": "City Health Center",
 *       "address": "123 Main Street, Lahore",
 *       "status": "active"
 *     },
 *     {
 *       "id": "clinic_2",
 *       "name": "Downtown Medical",
 *       "address": "456 Oak Avenue, Karachi",
 *       "status": "active"
 *     }
 *   ]
 * }
 */
router.route("/user-clinics").post(authController.getUserClinics);

/**
 * POST /api/auth/user-roles
 * @summary Get user's roles across clinics
 * @tags Authentication
 * @param {object} request.body.required - User identification
 * @property {string} request.body.userId - User ID
 * @property {string} request.body.email - User email
 * @return {UserRolesResponse} 200 - List of user roles
 * @return {ErrorResponse} 401 - Unauthorized
 * @return {ErrorResponse} 404 - User not found
 * @example request - Get user roles
 * {
 *   "userId": "user_123",
 *   "email": "doctor@clinic.com"
 * }
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "roles": [
 *     {
 *       "roleId": "role_1",
 *       "roleName": "doctor",
 *       "clinicId": "clinic_1",
 *       "clinicName": "City Health Center"
 *     },
 *     {
 *       "roleId": "role_2",
 *       "roleName": "clinic_owner",
 *       "clinicId": "clinic_2",
 *       "clinicName": "Downtown Medical"
 *     }
 *   ]
 * }
 */
router.route("/user-roles").post(authController.getUserRoles);

/**
 * POST /api/auth/login
 * @summary User login
 * @tags Authentication
 * @param {LoginRequest} request.body.required - Login credentials
 * @return {LoginResponse} 200 - Login successful
 * @return {ErrorResponse} 401 - Invalid credentials
 * @return {ErrorResponse} 400 - Validation error
 * @example request - Login request
 * {
 *   "email": "doctor@clinic.com",
 *   "password": "securePassword123"
 * }
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzEyMyIsInJvbGUiOiJkb2N0b3IifQ...",
 *   "user": {
 *     "id": "user_123",
 *     "email": "doctor@clinic.com",
 *     "name": "Dr. Ahmed Khan",
 *     "role": "doctor",
 *     "status": "active"
 *   }
 * }
 * @example response - 401 - Invalid credentials
 * {
 *   "success": false,
 *   "error": "Invalid email or password",
 *   "code": "AUTH_FAILED"
 * }
 */
router.route("/login").post(authController.login);

/**
 * POST /api/auth/select-profile
 * @summary Select a profile after login (when multiple profiles exist)
 * @tags Authentication
 * @param {object} request.body.required - Profile selection request
 * @property {string} request.body.email - User email
 * @property {string} request.body.password - User password
 * @property {number} request.body.clinic_id - Target clinic ID
 * @property {number} request.body.role_id - Target role ID
 * @return {object} 200 - Token and user info
 * @return {ErrorResponse} 401 - Invalid credentials
 * @return {ErrorResponse} 403 - Access denied
 */
router.route("/select-profile").post(authController.selectProfile);

/**
 * GET /api/auth/my-profiles
 * @summary Get all clinic profiles for authenticated user
 * @tags Authentication
 * @security BearerAuth
 * @return {object} 200 - List of user's clinic profiles
 * @return {ErrorResponse} 401 - Unauthorized
 * @example response - 200 - Success response
 * {
 *   "message": "Profiles retrieved successfully",
 *   "profiles": [
 *     {
 *       "profile_id": 1,
 *       "clinic": {
 *         "id": 1,
 *         "name": "City Health Center",
 *         "code": "CHC001",
 *         "address": "123 Main Street",
 *         "phone": "123-456-7890",
 *         "is_active": true
 *       },
 *       "role": {
 *         "id": 3,
 *         "name": "doctor",
 *         "description": "Medical doctor"
 *       },
 *       "assigned_at": "2024-01-15T10:00:00Z",
 *       "is_current": true
 *     }
 *   ],
 *   "current_profile": { ... }
 * }
 */
router.route("/my-profiles").get(
    authMiddleware.verifyToken,
    authController.getMyProfiles
);

/**
 * POST /api/auth/switch-profile
 * @summary Switch to a different clinic profile
 * @tags Authentication
 * @security BearerAuth
 * @param {object} request.body.required - Profile switch request
 * @property {number} request.body.clinic_id - Target clinic ID
 * @property {number} request.body.role_id - Target role ID
 * @return {object} 200 - New token and user info
 * @return {ErrorResponse} 403 - Access denied
 * @return {ErrorResponse} 400 - Validation error
 * @example request - Switch profile
 * {
 *   "clinic_id": 2,
 *   "role_id": 3
 * }
 * @example response - 200 - Success response
 * {
 *   "message": "Profile switched successfully",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": 123,
 *     "email": "doctor@clinic.com",
 *     "full_name": "Dr. Ahmed Khan",
 *     "clinic": { ... },
 *     "role": { ... }
 *   }
 * }
 */
router.route("/switch-profile").post(
    authMiddleware.verifyToken,
    authController.switchProfile
);

export default router;
