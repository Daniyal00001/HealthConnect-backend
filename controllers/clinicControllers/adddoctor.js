import prisma from "../../prismaClient.js";

// ✅ Add Doctor
import bcrypt from "bcrypt";  // ← ADD at top

const addDoctor = async (req, res) => {
  try {
    const { name, specialization, phone, email, qualifications, license_no, bio, password } = req.body;

    if (!name || !specialization || !email || !phone || !password) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Validate phone number format (digits only, 10-15 chars, allowing optional leading +)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number. Must be 10-15 digits (e.g. +94...)" });
    }

    // Validate password is a string and not empty
    if (typeof password !== 'string' || password.trim().length === 0) {
      return res.status(400).json({ message: "Password must be a non-empty string" });
    }

    if (password.length > 8) {
      return res.status(400).json({ message: "Password must not exceed 8 characters" });
    }

    // Get clinic_id from request body or authenticated user
    const clinicIdParam = req.body.clinic_id || req.user?.clinic_id;
    if (!clinicIdParam) {
      return res.status(400).json({ message: "clinic_id is required" });
    }
    const clinicId = BigInt(clinicIdParam);

    // Check if user with this email already exists
    let user = await prisma.users.findUnique({
      where: { email },
      include: { doctor_profiles: true }
    });

    let isNewUser = false;

    // If user exists and already has a doctor profile, check if already associated with this clinic
    if (user && user.doctor_profiles) {
      try {
        const existingDoctorClinic = await prisma.doctor_clinics.findFirst({
          where: {
            doctor_id: user.id,
            clinic_id: clinicId,
          },
        });

        if (existingDoctorClinic) {
          return res.status(400).json({ 
            message: "Doctor with this email already present in this clinic" 
          });
        } else {
          return res.status(400).json({ 
            message: "Doctor with this email already present" 
          });
        }
      } catch (modelError) {
        if (modelError.message && modelError.message.includes("Cannot read properties of undefined")) {
          console.error("Prisma client error: doctor_clinics model not found. Please run 'npx prisma generate' to regenerate the Prisma client.");
          return res.status(500).json({ 
            message: "Database configuration error. The Prisma client needs to be regenerated.",
            error: "doctor_clinics model not available in Prisma client. Run 'npx prisma generate' in the backend-healthP directory."
          });
        }
        // If we can't check, still return the general error
        return res.status(400).json({ 
          message: "Doctor with this email already present" 
        });
      }
    }

    if (!user) {
      // New user - create everything
      isNewUser = true;
      
      // Password already validated above, safe to hash
      const password_hash = await bcrypt.hash(password, 10);

      user = await prisma.users.create({
        data: {
          full_name: name,
          email,
          phone,
          password_hash,
          is_active: true,
        },
        include: { doctor_profiles: true }
      });

      // Create doctor profile for new user
      await prisma.doctor_profiles.create({
        data: {
          user_id: user.id,
          specialization,
          license_no: license_no || null,
          qualifications: qualifications || null,
          bio: bio || null,
          is_active: true,
        },
      });
    } else {
      // Existing user - verify password matches
      // Check if user has a password_hash set
      if (!user.password_hash) {
        // User exists but has no password - set one
        const password_hash = await bcrypt.hash(password, 10);
        await prisma.users.update({
          where: { id: user.id },
          data: { password_hash }
        });
      } else {
        // User has password - verify it matches
        // Password already validated above, safe to compare
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
          return res.status(400).json({ 
            message: "Email already exists with different password. Please use the correct password." 
          });
        }
      }

      // Check if user already has doctor profile, if not create it
      if (!user.doctor_profiles) {
        await prisma.doctor_profiles.create({
          data: {
            user_id: user.id,
            specialization,
            license_no: license_no || null,
            qualifications: qualifications || null,
            bio: bio || null,
            is_active: true,
          },
        });
      }
    }

    // Check if doctor is already associated with this clinic
    let existingDoctorClinic;
    try {
      existingDoctorClinic = await prisma.doctor_clinics.findFirst({
        where: {
          doctor_id: user.id,
          clinic_id: clinicId,
        },
      });
    } catch (modelError) {
      if (modelError.message && modelError.message.includes("Cannot read properties of undefined")) {
        console.error("Prisma client error: doctor_clinics model not found. Please run 'npx prisma generate' to regenerate the Prisma client.");
        return res.status(500).json({ 
          message: "Database configuration error. The Prisma client needs to be regenerated.",
          error: "doctor_clinics model not available in Prisma client. Run 'npx prisma generate' in the backend-healthP directory."
        });
      }
      throw modelError;
    }

    if (existingDoctorClinic) {
      return res.status(400).json({ 
        message: "Doctor is already associated with this clinic" 
      });
    }

    // Step 3: Create doctor_clinics entry
    try {
      await prisma.doctor_clinics.create({
        data: {
          doctor_id: user.id,
          clinic_id: clinicId,
          is_active: true,
        },
      });
    } catch (createError) {
      if (createError.message && createError.message.includes("Cannot read properties of undefined")) {
        console.error("Prisma client error: doctor_clinics model not found. Please run 'npx prisma generate' to regenerate the Prisma client.");
        return res.status(500).json({ 
          message: "Database configuration error. The Prisma client needs to be regenerated.",
          error: "doctor_clinics model not available in Prisma client. Run 'npx prisma generate' in the backend-healthP directory."
        });
      }
      throw createError;
    }

    // Step 4: Assign doctor role in clinic (if not already assigned)
    const doctorRole = await prisma.roles.findFirst({
      where: { name: "doctor" }
    });

    if (doctorRole) {
      const existingRole = await prisma.clinic_user_roles.findFirst({
        where: {
          clinic_id: clinicId,
          user_id: user.id,
          role_id: doctorRole.id,
        },
      });

      if (!existingRole) {
        await prisma.clinic_user_roles.create({
          data: {
            clinic_id: clinicId,
            user_id: user.id,
            role_id: doctorRole.id,
          },
        });
      }
    }

    // Fetch updated doctor profile
    const doctorProfile = await prisma.doctor_profiles.findUnique({
      where: { user_id: user.id },
      include: { users: true },
    });

    res.status(201).json({ 
      message: isNewUser ? "Doctor added successfully" : "Doctor added to clinic successfully",
      data: doctorProfile 
    });
  } catch (error) {
    console.error("Error adding doctor:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        message: "Doctor is already associated with this clinic" 
      });
    }
    res.status(500).json({ message: "Server error while adding doctor", error: error.message });
  }
};


// ✅ Get All Doctors (filtered by clinic)
 const fetchDoctors = async (req, res) => {
  console.log("fetchDoctors called");
  try {
    // Get clinic_id from query params or body
    const clinicIdParam = req.query.clinic_id || req.body.clinic_id || req.params.clinic_id;
    
    if (!clinicIdParam) {
      return res.status(400).json({ message: "clinic_id is required" });
    }

    const clinicId = BigInt(clinicIdParam);
    
    // Get doctor role_id
    const doctorRole = await prisma.roles.findFirst({
      where: { name: "doctor" }
    });

    if (!doctorRole) {
      return res.status(500).json({ message: "Doctor role not found" });
    }

    // Get all users assigned as doctors to this clinic
    const clinicDoctors = await prisma.clinic_user_roles.findMany({
      where: {
        clinic_id: clinicId,
        role_id: doctorRole.id,
      },
      include: {
        users: {
          include: {
            doctor_profiles: true,
          },
        },
      },
      orderBy: { assigned_at: "desc" },
    });

    // Format the response to match expected structure
    const doctors = clinicDoctors
      .filter(assignment => assignment.users.doctor_profiles) // Only include users with doctor profiles
      .map(assignment => ({
        id: assignment.users.doctor_profiles.id.toString(),
        user_id: assignment.users.id.toString(),
        specialization: assignment.users.doctor_profiles.specialization,
        qualifications: assignment.users.doctor_profiles.qualifications,
        license_no: assignment.users.doctor_profiles.license_no,
        bio: assignment.users.doctor_profiles.bio,
        is_active: assignment.users.doctor_profiles.is_active,
        users: {
          id: assignment.users.id.toString(),
          full_name: assignment.users.full_name,
          email: assignment.users.email,
          phone: assignment.users.phone,
          is_active: assignment.users.is_active,
        },
      }));

    const safeDoctors = JSON.parse(
      JSON.stringify(doctors, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.json(safeDoctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
};

// ✅ Update Doctor
 const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialization, phone, email, qualifications, license_no, bio } = req.body;

    const doctor = await prisma.doctor_profiles.update({
      where: { id: BigInt(id) },
      data: {
        specialization,
        license_no,
        qualifications,
        bio,
        users: {
          update: {
            full_name: name,
            email,
            phone,
          },
        },
      },
      include: { users: true },
    });

    const safeDoctor = JSON.parse(
      JSON.stringify(doctor, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.json({ message: "Doctor updated successfully", data: safeDoctor });
  } catch (error) {
    console.error("Error updating doctor:", error);
    res.status(500).json({ message: "Failed to update doctor" });
  }
};

// ✅ Delete Doctor
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete doctor profile and linked user
    const doctor = await prisma.doctor_profiles.delete({
      where: { id: BigInt(id) },
      include: { users: true },
    });

    await prisma.users.delete({
      where: { id: doctor.user_id },
    });

    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ message: "Failed to delete doctor" });
  }
};


// ✅ Toggle Doctor Active/Inactive
const toggleDoctorStatus = async (req, res) => {
  console.log("toggleDoctorStatus called");
  try {
    const { id } = req.params; // doctor_profile id

    console.log(`Toggling status for doctor with ID: ${id}`);
    const doctor = await prisma.doctor_profiles.findUnique({
      where: { id: BigInt(id) },
      include: { users: true },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const newStatus = !doctor.is_active;

    // Update both doctor and user status
    await prisma.doctor_profiles.update({
      where: { id: BigInt(id) },
      data: {
        is_active: newStatus,
        users: {
          update: {
            is_active: newStatus,
          },
        },
      },
    });

    res.json({
      message: `Doctor ${
        newStatus ? "activated" : "deactivated"
      } successfully`,
      status: newStatus,
    });
  } catch (error) {
    console.error("Error toggling doctor status:", error);
    res.status(500).json({ message: "Failed to toggle doctor status" });
  }
};




// ✅ Get Single Doctor Details
const getDoctorDetails = async (req, res) => {
  console.log("getDoctorDetails called");
  try {
    const { id } = req.params;
    const clinicId = req.user?.clinic_id || req.query.clinic_id;

    const doctor = await prisma.doctor_profiles.findUnique({
      where: { id: BigInt(id) },
      include: { users: true },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Get schedule if clinic_id is available
    let schedule = null;
    if (clinicId) {
      try {
        const scheduleResult = await prisma.$queryRaw`
          SELECT * FROM schedule 
          WHERE doctor_id = ${doctor.user_id} 
          AND clinic_id = ${BigInt(clinicId)}
          ORDER BY created_at DESC
          LIMIT 1
        `;

        if (scheduleResult && scheduleResult.length > 0) {
          const scheduleData = scheduleResult[0];
          schedule = {
            schedule_id: scheduleData.schedule_id.toString(),
            doctor_id: scheduleData.doctor_id.toString(),
            clinic_id: scheduleData.clinic_id.toString(),
            monday: typeof scheduleData.monday === 'string' ? JSON.parse(scheduleData.monday) : scheduleData.monday,
            tuesday: typeof scheduleData.tuesday === 'string' ? JSON.parse(scheduleData.tuesday) : scheduleData.tuesday,
            wednesday: typeof scheduleData.wednesday === 'string' ? JSON.parse(scheduleData.wednesday) : scheduleData.wednesday,
            thursday: typeof scheduleData.thursday === 'string' ? JSON.parse(scheduleData.thursday) : scheduleData.thursday,
            friday: typeof scheduleData.friday === 'string' ? JSON.parse(scheduleData.friday) : scheduleData.friday,
            saturday: typeof scheduleData.saturday === 'string' ? JSON.parse(scheduleData.saturday) : scheduleData.saturday,
            sunday: typeof scheduleData.sunday === 'string' ? JSON.parse(scheduleData.sunday) : scheduleData.sunday,
            created_at: scheduleData.created_at,
            updated_at: scheduleData.updated_at
          };
        }
      } catch (scheduleError) {
        console.error("Error fetching schedule:", scheduleError);
        // Continue without schedule if there's an error
      }
    }

    const response = {
      ...doctor,
      id: doctor.id.toString(),
      user_id: doctor.user_id.toString(),
      name: doctor.users?.full_name || "Unknown",
      schedule: schedule
    };

    // Convert BigInt to string for JSON serialization
    const safeResponse = JSON.parse(
      JSON.stringify(response, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.json(safeResponse);
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    res.status(500).json({ message: "Failed to fetch doctor details" });
  }
};

// ✅ Get Doctor Appointments
const getDoctorAppointments = async (req, res) => {
  console.log("getDoctorAppointments called");
  try {
    const { id } = req.params;
    const clinicId = req.user?.clinic_id || req.query.clinic_id;

    // First, get the doctor profile to get the user_id
    const doctor = await prisma.doctor_profiles.findUnique({
      where: { id: BigInt(id) },
      select: { user_id: true },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Build where clause
    const whereClause = {
      doctor_user_id: doctor.user_id,
    };

    // Add clinic_id filter if available
    if (clinicId) {
      whereClause.clinic_id = BigInt(clinicId);
    }

    const appointments = await prisma.appointments.findMany({
      where: whereClause,
      include: {
        users_appointments_patient_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { scheduled_at: "desc" },
    });

    const formatted = appointments.map((a) => ({
      id: a.id.toString(),
      patientName: a.users_appointments_patient_user_idTousers?.full_name || "N/A",
      scheduledAt: a.scheduled_at,
      status: a.status,
      tokenNumber: a.token_number || null,
      payment_status: a.payment_status,
      appointment_fee: a.appointment_fee ? a.appointment_fee.toString() : null,
    }));

    console.log(`Found ${formatted.length} appointments for doctor profile ${id} (user_id: ${doctor.user_id.toString()})`);
    
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ message: "Failed to fetch appointments", error: error.message });
  }
};

// ✅ Get Doctor Earnings
const getDoctorEarnings = async (req, res) => {
  console.log("getDoctorEarnings called");
  try {
    const { id } = req.params;
    const clinicId = req.user?.clinic_id || req.query.clinic_id;

    // First, get the doctor profile to get the user_id
    const doctor = await prisma.doctor_profiles.findUnique({
      where: { id: BigInt(id) },
      select: { user_id: true },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Build where clause for appointments
    const appointmentWhere = {
      doctor_user_id: doctor.user_id,
    };

    // Add clinic_id filter if available
    if (clinicId) {
      appointmentWhere.clinic_id = BigInt(clinicId);
    }

    // Get appointments for this doctor
    const appointments = await prisma.appointments.findMany({
      where: appointmentWhere,
      select: { id: true },
    });

    const appointmentIds = appointments.map(apt => apt.id);

    // Aggregate total earnings from clinic_sales through appointments
    const earnings = await prisma.clinic_sales.aggregate({
      _sum: { amount: true },
      where: {
        appointment_id: {
          in: appointmentIds.length > 0 ? appointmentIds : [],
        },
      },
    });

    // Also calculate from appointment_fee directly if clinic_sales doesn't have all data
    const appointmentsWithFees = await prisma.appointments.findMany({
      where: {
        ...appointmentWhere,
        payment_status: 'paid',
      },
      select: {
        appointment_fee: true,
      },
    });

    const totalFromFees = appointmentsWithFees.reduce((sum, apt) => {
      return sum + (apt.appointment_fee ? Number(apt.appointment_fee) : 0);
    }, 0);

    // Use the higher value or clinic_sales if available
    const totalEarnings = earnings._sum.amount 
      ? Number(earnings._sum.amount) 
      : totalFromFees;

    res.json({
      total: totalEarnings,
      currency: "LKR",
    });
  } catch (error) {
    console.error("Error fetching doctor earnings:", error);
    res.status(500).json({ message: "Failed to fetch earnings", error: error.message });
  }
};



export { addDoctor, fetchDoctors, updateDoctor, deleteDoctor, toggleDoctorStatus ,getDoctorDetails, getDoctorAppointments, getDoctorEarnings };
