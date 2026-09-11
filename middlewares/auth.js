// middlewares/auth.js
import jwt from "jsonwebtoken";
import prisma from "../prisma/prisma.js";

// ============================================
// 1. VERIFY TOKEN (Basic check)
// ============================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Token missing" });

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token format invalid" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT verification error:", err);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    
    // Ensure decoded token has required fields
    if (!decoded) {
      return res.status(403).json({ message: "Token payload is empty" });
    }
    
    // Set req.user with decoded token data
    // Ensure all required fields are present
    if (!decoded.id) {
      return res.status(403).json({ message: "Token missing user ID" });
    }
    
    req.user = {
      id: decoded.id,
      email: decoded.email || null,
      clinic_id: decoded.clinic_id || decoded.clinicId || null,
      role_id: decoded.role_id || decoded.roleId || null,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    console.log("Token decoded successfully. req.user set:", { 
      id: req.user.id, 
      email: req.user.email, 
      clinic_id: req.user.clinic_id, 
      role_id: req.user.role_id 
    });
    next();
  });
};

// ============================================
// 2. CHECK ACCESS (Used during login)
// ============================================
const hasAccess = (user, clinic_id, role_id) => {
    const access = user.clinic_user_roles.some(
      (r) => Number(r.role_id) === Number(role_id) && 
             Number(r.clinic_id) === Number(clinic_id)
    );

    if (!access) {
        throw new Error("Access denied: You do not have the required role for this clinic. Please contact your administrator if you believe this is an error.");
    }
};

// ============================================
// 3. ENFORCE CLINIC SCOPE (Prevents cross-clinic access)
// ============================================
const enforceClinicScope = async (req, res, next) => {
  try {
    // Check if req.user exists and is an object
    if (!req.user || typeof req.user !== 'object') {
      console.error("req.user is undefined or not an object in enforceClinicScope");
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Safely get role_id (handle both snake_case and camelCase)
    const roleId = req.user?.role_id || req.user?.roleId;
    if (!roleId) {
      console.error("Role ID missing. req.user:", JSON.stringify(req.user, null, 2));
      return res.status(400).json({ message: "Role ID missing from token" });
    }

    // Get role name
    const role = await prisma.roles.findUnique({
      where: { id: Number(roleId) }
    });

    // Check if role exists
    if (!role) {
      console.error("Role not found for role_id:", roleId);
      return res.status(400).json({ message: "Role not found" });
    }

    // Super admin can access any clinic
    if (role.name === 'super_admin') {
      // Ensure req.user has required properties for super admin
      if (!req.user.clinic_id) {
        req.user.clinic_id = null; // Super admin doesn't need clinic_id
      }
      req.user.role_id = Number(roleId);
      return next();
    }

    // Safely get clinic_id from token, query, body, or params (in that order)
    const clinicIdFromToken = req.user?.clinic_id || req.user?.clinicId || null;
    const clinicIdFromRequest = req.params?.clinic_id || req.query?.clinic_id || req.body?.clinic_id || null;
    
    // Use clinic_id from request if available, otherwise from token
    let clinicId = clinicIdFromRequest || clinicIdFromToken;
    
    // For non-super-admin roles, clinic_id is required
    if (role.name !== 'super_admin') {
      if (!clinicId && clinicId !== 0) {
        console.error("Clinic ID missing. req.user:", JSON.stringify(req.user, null, 2));
        console.error("Request params:", req.params);
        console.error("Request query:", req.query);
        console.error("Request body:", req.body);
        return res.status(400).json({ 
          message: "Clinic ID is required. Please provide clinic_id in query, body, or ensure it's in your token." 
        });
      }
      
      // If clinic_id is in token and also in request, they must match
      if (clinicIdFromToken && clinicIdFromRequest && Number(clinicIdFromRequest) !== Number(clinicIdFromToken)) {
        return res.status(403).json({ 
          message: "Access denied: You can only access your own clinic's data" 
        });
      }
    }

    // Normalize clinic_id and role_id for use in controllers
    // Ensure req.user exists before setting properties
    if (!req.user) {
      console.error("req.user became undefined during processing");
      return res.status(401).json({ message: "User authentication lost during request processing" });
    }

    req.user.clinic_id = clinicId ? Number(clinicId) : null;
    req.user.role_id = Number(roleId);

    next();
  } catch (err) {
    console.error("Error in enforceClinicScope:", err);
    console.error("Error stack:", err.stack);
    console.error("req.user at error time:", req.user ? JSON.stringify(req.user, null, 2) : "req.user is undefined");
    console.error("Request method:", req.method);
    console.error("Request path:", req.path);
    console.error("Request params:", req.params);
    return res.status(500).json({ 
      message: "Error checking clinic access",
      error: err.message 
    });
  }
};

// ============================================
// 4. ENFORCE DOCTOR SCOPE (Doctors see only their patients)
// ============================================
const enforceDoctorScope = async (req, res, next) => {
  try {
    // Get role name
    const role = await prisma.roles.findUnique({
      where: { id: req.user.role_id }
    });

    // Only apply to doctors
    if (role.name !== 'doctor') {
      return next();
    }

    // Check if trying to access a specific patient
    const patientId = Number(req.params.patient_id || req.body.patient_user_id);

    if (patientId) {
     
      const hasAccess = await prisma.appointments.findFirst({
        where: {
          doctor_user_id: req.user.id,
          patient_user_id: patientId,
          clinic_id: req.user.clinic_id
        }
      });

      if (!hasAccess) {
        return res.status(403).json({ 
          message: "Access denied: You can only access your own patients" 
        });
      }
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Error checking patient access" });
  }
};


const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const role = await prisma.roles.findUnique({
        where: { id: req.user.role_id }
      });

      if (!role || !allowedRoles.includes(role.name)) {
        return res.status(403).json({ 
          message: `Access denied: Required role is ${allowedRoles.join(" or ")}` 
        });
      }

      req.userRole = role.name;
      next();
    } catch (err) {
      return res.status(500).json({ message: "Error checking role" });
    }
  };
};

export { 
  verifyToken, 
  hasAccess, 
  enforceClinicScope,
  enforceDoctorScope,
  requireRole
};