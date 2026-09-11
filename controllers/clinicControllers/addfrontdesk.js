import prisma from "../../prismaClient.js";
import bcrypt from "bcrypt";


export const addFrontDesk = async (req, res) => {
  console.log("add front desk controller hit");

  try {
    const { full_name, email, phone, shift, status, password, gender, dob } = req.body;

    if (!password || !email) {
      return res.status(400).json({ error: "Password and email both are required" });
    }

    // Validate phone number format
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number. Must be 10-15 digits (e.g. +94...)" });
    }

    if (password.length > 8) {
      return res.status(400).json({ error: "Password must not exceed 8 characters" });
    }

    // Get clinic_id from request body or authenticated user
    const clinicIdParam = req.body.clinic_id || req.user?.clinic_id;
    if (!clinicIdParam) {
      return res.status(400).json({ error: "clinic_id is required" });
    }
    const clinicId = BigInt(clinicIdParam);

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Normalize gender (accepts any case)
    const normalizedGender = gender?.trim().toLowerCase();

    // ✅ Map to enum
    const genderEnumMap = {
      male: "M",
      female: "F",
      other: "O",
    };

    const genderEnum = genderEnumMap[normalizedGender];

    if (!genderEnum) {
      return res.status(400).json({ error: "Invalid gender value. Use Male, Female, or Other." });
    }

    // ✅ Create user
    const user = await prisma.users.create({
      data: {
        full_name,
        email,
        phone,
        password_hash: hashedPassword,
        gender: genderEnum,
        dob: dob ? new Date(dob) : null,
        is_active: true,
      },
    });

    // ✅ Create front desk staff entry
    const staff = await prisma.front_desk_staff.create({
      data: {
        user_id: user.id,
        shift,
        status: status || "active",
      },
    });

    // Assign front_desk role in clinic
    const frontDeskRole = await prisma.roles.findFirst({
      where: { name: "front_desk" }
    });

    if (frontDeskRole) {
      await prisma.clinic_user_roles.create({
        data: {
          clinic_id: clinicId,
          user_id: user.id,
          role_id: frontDeskRole.id,
        },
      });
    }

    res.status(201).json({
      message: "Front desk staff added successfully",
      staff,
    });
  } catch (error) {
    console.error("Error adding staff:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Edit Front Desk Staff
export const updateFrontDesk = async (req, res) => {
    console.log("update front desk controller hit");
  try {
    const { id } = req.params;
    const { full_name, email, phone, shift, status } = req.body;

    const staff = await prisma.front_desk_staff.update({
      where: { id: BigInt(id) },
      data: {
        shift,
        status,
        user: {
          update: {
            full_name,
            email,
            phone,
          },
        },
      },
      include: { user: true },
    });

    res.status(200).json({
      message: "Front desk staff updated successfully",
      staff,
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Delete Front Desk Staff
export const deleteFrontDesk = async (req, res) => {
    console.log("delete front desk controller hit");
  try {
    const { id } = req.params;

    const staff = await prisma.front_desk_staff.delete({
      where: { id: BigInt(id) },
    });

    res.status(200).json({
      message: "Front desk staff deleted successfully",
      staff,
    });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Fetch all Front Desk Staff (filtered by clinic)
export const fetchFrontDesks = async (req, res) => {
    console.log("fetch front desk controller hit");
  try {
    // Get clinic_id from query params or body
    const clinicIdParam = req.query.clinic_id || req.body.clinic_id || req.params.clinic_id;
    
    if (!clinicIdParam) {
      return res.status(400).json({ error: "clinic_id is required" });
    }

    const clinicId = BigInt(clinicIdParam);
    
    // Get front_desk role_id
    const frontDeskRole = await prisma.roles.findFirst({
      where: { name: "front_desk" }
    });

    if (!frontDeskRole) {
      return res.status(500).json({ error: "Front desk role not found" });
    }

    // Get all users assigned as front_desk staff to this clinic
    const clinicFrontDesks = await prisma.clinic_user_roles.findMany({
      where: {
        clinic_id: clinicId,
        role_id: frontDeskRole.id,
      },
      include: {
        users: {
          include: {
            front_desk_staff: true,
          },
        },
      },
      orderBy: { assigned_at: "desc" },
    });

    // Format the response to match expected structure
    const frontDesks = clinicFrontDesks
      .filter(assignment => assignment.users.front_desk_staff) // Only include users with front_desk_staff profiles
      .map(assignment => ({
        id: assignment.users.front_desk_staff.id.toString(),
        user_id: assignment.users.id.toString(),
        shift: assignment.users.front_desk_staff.shift,
        status: assignment.users.front_desk_staff.status,
        user: {
          id: assignment.users.id.toString(),
          full_name: assignment.users.full_name,
          email: assignment.users.email,
          phone: assignment.users.phone,
          is_active: assignment.users.is_active,
        },
      }));

    res.status(200).json(frontDesks);
  } catch (error) {
    console.error("Error fetching front desks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// ✅ Toggle Front Desk Active/Inactive
export const toggleFrontDeskStatus = async (req, res) => {
  console.log("toggle front desk status called");
  try {
    const { id } = req.params; // front_desk_staff id

    const staff = await prisma.front_desk_staff.findUnique({
      where: { id: BigInt(id) },
      include: { user: true },
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const newStatus = staff.status === "active" ? "inactive" : "active";
    const newUserStatus = staff.user.is_active ? false : true;

    // Update both staff and user status
    await prisma.front_desk_staff.update({
      where: { id: BigInt(id) },
      data: {
        status: newStatus,
        user: {
          update: {
            is_active: newUserStatus,
          },
        },
      },
    });

    res.json({
      message: `Staff member ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      status: newStatus,
    });
  } catch (error) {
    console.error("Error toggling staff status:", error);
    res.status(500).json({ message: "Failed to toggle staff status" });
  }
};