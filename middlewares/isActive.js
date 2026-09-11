// middlewares/isActive.js
import prisma from "../prisma/prisma.js";

export const checkClinicStatus = async (req, res, next) => {
  try {
    // Skip check for auth routes (login, register)
    if (req.path.startsWith('/api/auth')) {
      return next();
    }

    // Get userId from the token (set by verifyToken middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        message: "Unauthorized. Please login first." 
      });
    }

    // Step 1: Check if user is super admin
    const superAdminRole = await prisma.roles.findFirst({
      where: { name: "super_admin" },
    });

    if (superAdminRole) {
      const isSuperAdmin = await prisma.clinic_user_roles.findFirst({
        where: {
          user_id: userId,
          role_id: superAdminRole.id,
        },
      });

      if (isSuperAdmin) {
        return next(); // ✅ Super admins can always proceed
      }
    }

    // Step 2: Find user's clinic
    const userClinicRole = await prisma.clinic_user_roles.findFirst({
      where: {
        user_id: userId,
      },
      include: {
        clinics: true,
      },
    });

    // Step 3: Validate clinic status
    if (!userClinicRole || !userClinicRole.clinics) {
      return res.status(403).json({ 
        message: "No clinic linked with this account." 
      });
    }

    if (userClinicRole.clinics.is_active === false) {
      return res.status(403).json({ 
        message: "Clinic is inactive. Login disabled." 
      });
    }

    next(); // ✅ Clinic is active, proceed
  } catch (error) {
    console.error("Error in checkClinicStatus:", error);
    return res.status(500).json({ 
      message: "Error checking clinic status." 
    });
  }
};