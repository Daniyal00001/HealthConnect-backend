import prisma from "../../prismaClient.js";

// ------------------
// get all doctors for select options
// ------------------

// In your addpatient.js file (document 10), replace the getAllDoctors function with this:

export const getAllDoctors = async (req, res) => {
  console.log("Received getAllDoctors request");
  console.log("Query params:", req.query);
  console.log("Body:", req.body);
  console.log("req.user:", req.user);
  try {
    // Get clinic_id from query params, body, or authenticated user
    const clinicIdParam = req.query.clinic_id || req.body.clinic_id || req.user?.clinic_id;
    
    if (!clinicIdParam) {
      return res.status(400).json({ 
        success: false,
        message: "clinic_id is required" 
      });
    }

    const clinicId = BigInt(clinicIdParam);
    console.log("Using clinicId (BigInt):", clinicId.toString());

    // Get doctor role_id
    const doctorRole = await prisma.roles.findFirst({
      where: { name: "doctor" }
    });

    if (!doctorRole) {
      return res.status(500).json({ 
        success: false,
        message: "Doctor role not found" 
      });
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
            doctor_profiles: {
              where: { is_active: true },
            },
          },
        },
      },
    });

    // Filter and format doctors - only include users with active doctor profiles
    const formatted = clinicDoctors
      .filter(assignment => assignment.users.doctor_profiles && assignment.users.doctor_profiles.is_active)
      .map((assignment) => ({
        id: assignment.users.id.toString(),
        fullName: assignment.users.full_name, // ← CHANGED from 'name' to 'fullName'
        email: assignment.users.email || "",   // ← ADDED email field
        specialization: assignment.users.doctor_profiles.specialization || "N/A",
      }));

    console.log(`Returning ${formatted.length} doctors for clinic_id ${clinicId.toString()}`);
    console.log("Formatted doctors:", formatted); // ← Add this to debug
    
    // ← WRAP in success object
    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch doctors" 
    });
  }
};

// ==========================================
// BACKEND FIX (addpatient.js)
// ==========================================

// ==========================================
// BACKEND FIX (addpatient.js)
// ==========================================

export const addPatientWithAppointment = async (req, res) => {
  console.log("Received addPatientWithAppointment request:", req.body);
  console.log("req.user:-------------------------", req.user);

  try {
    const {
      name,
      email,
      phone,
      dob,
      gender,
      bloodGroup,
      address,
      appointmentTime,
      doctorId,
      fees,
      paymentStatus,
      paymentMethod,
      tokenNumber,
      emergencyContact,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !phone || !doctorId || !appointmentTime) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Use info from JWT set by verifyToken
    const clinicId = BigInt(req.user.clinic_id);
    const createdBy = BigInt(req.user.id);

    // Verify clinic exists
    const clinic = await prisma.clinics.findUnique({
      where: { id: clinicId }
    });

    if (!clinic) {
      return res.status(400).json({ message: "Invalid clinic ID" });
    }

    // ✅ FIXED: Parse appointment date correctly for token_date
    // appointmentTime comes as "2025-11-16T03:02" or "2025-11-16T03:02:00"
    const scheduledDate = new Date(appointmentTime);
    
    // Get date components from the scheduled date
    const year = scheduledDate.getFullYear();
    const month = scheduledDate.getMonth();
    const day = scheduledDate.getDate();
    
    // Create tokenDate as UTC Midnight to avoid timezone shifts when saving to DB
    // Prisma/MySQL @db.Date usually stores YYYY-MM-DD. 
    // Using UTC ensures 2026-02-14T00:00:00Z -> 2026-02-14
    const tokenDate = new Date(Date.UTC(year, month, day));
    
    console.log('📅 Appointment Time (input):', appointmentTime);
    console.log('📅 Scheduled Date (parsed):', scheduledDate.toString());
    console.log('📅 Token Date (UTC):', tokenDate.toISOString());

    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // ... (user creation logic remains same, skipping lines for brevity) ...

      // Step 1 & 2 logic is unchanged, jumping to token generation part
      
      // ... [We need to keep the user creation logic intact, so I will only replace the token generation block if I can match it, 
      // but here I selected a large block. I must be careful. 
      // Actually, my previous replacement was only the token generation part. 
      // I should update the 'tokenDate' definition at the TOP of the file first.

      // Step 1: Check if patient already exists by email or phone
      let existingUser = null;
      
      if (email) {
        existingUser = await tx.users.findFirst({
          where: {
            email: email,
            patient_profiles: { isNot: null } // Ensure it's a patient
          },
          include: {
            patient_profiles: true
          }
        });
      }
      
      // If not found by email, try phone
      if (!existingUser && phone) {
        existingUser = await tx.users.findFirst({
          where: {
            phone: phone,
            patient_profiles: { isNot: null } // Ensure it's a patient
          },
          include: {
            patient_profiles: true
          }
        });
      }

      let patientUser;
      let isNewPatient = false;

      if (existingUser) {
        // Patient exists - use existing user
        console.log(`✅ Found existing patient: ${existingUser.id.toString()}`);
        patientUser = existingUser;
        
        // Update user info if provided (but don't overwrite with nulls)
        const updateData = {};
        if (name && name !== existingUser.full_name) updateData.full_name = name;
        if (email && email !== existingUser.email) updateData.email = email;
        if (phone && phone !== existingUser.phone) updateData.phone = phone;
        if (dob) updateData.dob = new Date(dob);
        if (gender) {
          const genderEnum = gender === "Male" ? "M" : gender === "Female" ? "F" : "O";
          if (genderEnum !== existingUser.gender) updateData.gender = genderEnum;
        }
        
        if (Object.keys(updateData).length > 0) {
          patientUser = await tx.users.update({
            where: { id: existingUser.id },
            data: updateData
          });
        }
        
        // Update patient profile if needed
        if (existingUser.patient_profiles) {
          const profileUpdateData = {};
          if (bloodGroup) profileUpdateData.blood_group = bloodGroup;
          if (emergencyContact) profileUpdateData.emergency_contact = emergencyContact;
          if (address) {
            const currentExtra = existingUser.patient_profiles.extra || {};
            profileUpdateData.extra = { ...currentExtra, address };
          }
          
          if (Object.keys(profileUpdateData).length > 0) {
            await tx.patient_profiles.update({
              where: { user_id: existingUser.id },
              data: profileUpdateData
            });
          }
        } else {
          // Patient profile doesn't exist, create it
          await tx.patient_profiles.create({
            data: {
              user_id: existingUser.id,
              blood_group: bloodGroup || null,
              emergency_contact: emergencyContact || {},
              extra: { address },
            },
          });
        }
      } else {
        // Patient doesn't exist - create new user
        console.log(`➕ Creating new patient`);
        isNewPatient = true;
        patientUser = await tx.users.create({
          data: {
            full_name: name,
            email: email || null,
            phone,
            dob: dob ? new Date(dob) : null,
            gender: gender === "Male" ? "M" : gender === "Female" ? "F" : "O",
          },
        });

        // Step 2: Create patient profile
        await tx.patient_profiles.create({
          data: {
            user_id: patientUser.id,
            blood_group: bloodGroup || null,
            emergency_contact: emergencyContact || {},
            extra: { address },
          },
        });
      }

      // Step 3: Determine token number
      let finalTokenNumber;
      
      const doctorIdBigInt = BigInt(doctorId);

      if (tokenNumber && parseInt(tokenNumber) > 0) {
        // Use manually entered token number
        finalTokenNumber = parseInt(tokenNumber);
        
        // Check if token number already exists for this DOCTOR on this date
        const existingToken = await tx.appointments.findFirst({
          where: {
            clinic_id: clinicId,
            doctor_user_id: doctorIdBigInt, // Scope by doctor
            token_date: tokenDate,
            token_number: finalTokenNumber,
          },
        });

        if (existingToken) {
          throw new Error(`Token number ${finalTokenNumber} already exists for this doctor on this date`);
        }
      } else {
        // Auto-generate token number based on Doctor's last token for the day
        try {
          // Find the last token number for this doctor on this date
          console.log(`🔎 Looking for last token for date: ${tokenDate.toISOString().split('T')[0]}`);

          const lastAppointment = await tx.appointments.findFirst({
            where: {
              clinic_id: clinicId,
              doctor_user_id: doctorIdBigInt,
              token_date: tokenDate, // Should match exactly now that it's UTC midnight
            },
            orderBy: {
              token_number: 'desc',
            },
            select: {
              token_number: true,
            },
          });
          
          if (lastAppointment) {
            finalTokenNumber = lastAppointment.token_number + 1;
          } else {
            finalTokenNumber = 1;
          }

          console.log(`✅ Generated Token ${finalTokenNumber} for Doctor ${doctorId} on ${tokenDate.toISOString().split('T')[0]}`);
          
        } catch (counterError) {
          console.error("Token generation error:", counterError);
          // Fallback safe default
          finalTokenNumber = 1; 
        }
      }

      // Step 4: Create appointment
      const appointment = await tx.appointments.create({
        data: {
          clinic_id: clinicId,
          patient_user_id: patientUser.id,
          doctor_user_id: BigInt(doctorId),
          created_by: createdBy,
          scheduled_at: scheduledDate,
          token_number: finalTokenNumber,
          token_date: tokenDate,
          status: "scheduled",
          payment_status: paymentStatus || "unpaid",
          appointment_fee: fees ? parseFloat(fees) : null,
          notes: notes || null,
          extra: { address },
        },
      });

      // Step 5: Create payment record if payment is made
      let payment = null;
      if (fees && parseFloat(fees) > 0 && (paymentStatus === "paid" || paymentStatus === "partial")) {
        payment = await tx.clinic_sales.create({
          data: {
            clinic_id: clinicId,
            appointment_id: appointment.id,
            patient_user_id: patientUser.id,
            created_by: createdBy,
            amount: parseFloat(fees),
            currency: "LKR",
            payment_method: paymentMethod || "cash",
            status: "completed",
            notes: `Payment for appointment #${finalTokenNumber}`,
          },
        });
      }

      return { appointment, payment, tokenNumber: finalTokenNumber, isNewPatient };
    });

    res.status(201).json({
      message: result.isNewPatient 
        ? "Patient and appointment created successfully" 
        : "Appointment created successfully for existing patient",
      isNewPatient: result.isNewPatient,
      appointment: {
        ...result.appointment,
        id: result.appointment.id.toString(),
        appointment_fee: result.appointment.appointment_fee ? result.appointment.appointment_fee.toString() : null,
        token_number: result.tokenNumber,
      },
      payment: result.payment ? {
        ...result.payment,
        id: result.payment.id.toString(),
        amount: result.payment.amount.toString(),
      } : null,
    });
  } catch (error) {
    console.error("Error in addPatientWithAppointment:", error);
    res.status(500).json({ 
      message: "Error creating patient or appointment",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};




export const getAllPatients = async (req, res) => {
  console.log("Received getAllPatients request");
  try {
    const patients = await prisma.patient_profiles.findMany({
      include: {
        users: {
          include: {
            appointments_appointments_patient_user_idTousers: {
              orderBy: {
                created_at: 'desc'
              },
              take: 1, // Get only the latest appointment
              include: {
                users_appointments_doctor_user_idTousers: {
                  select: {
                    id: true,
                    full_name: true,
                  }
                },
                clinics: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        }
      },
    });

    // Format the response with all patient and appointment data
    const formattedPatients = patients.map(p => {
      const latestAppointment = p.users.appointments_appointments_patient_user_idTousers[0];
      
      // Extract address from extra field
      const address = p.extra && typeof p.extra === 'object' ? p.extra.address : null;
      
      return {
        id: p.id.toString(),
        user_id: p.user_id.toString(),
        blood_group: p.blood_group,
        emergency_contact: p.emergency_contact,
        address: address,
        medical_record_no: p.medical_record_no,
        user: {
          id: p.users.id.toString(),
          full_name: p.users.full_name,
          email: p.users.email,
          phone: p.users.phone,
          dob: p.users.dob,
          gender: p.users.gender,
          is_active: p.users.is_active,
          created_at: p.users.created_at,
          updated_at: p.users.updated_at,
        },
        latestAppointment: latestAppointment ? {
          id: latestAppointment.id.toString(),
          clinic_id: latestAppointment.clinic_id.toString(),
          clinic_name: latestAppointment.clinics ? latestAppointment.clinics.name : null,
          patient_user_id: latestAppointment.patient_user_id.toString(),
          doctor_user_id: latestAppointment.doctor_user_id.toString(),
          doctor_name: latestAppointment.users_appointments_doctor_user_idTousers ? latestAppointment.users_appointments_doctor_user_idTousers.full_name : null,
          scheduled_at: latestAppointment.scheduled_at,
          token_number: latestAppointment.token_number,
          token_date: latestAppointment.token_date,
          status: latestAppointment.status,
          payment_status: latestAppointment.payment_status,
          appointment_fee: latestAppointment.appointment_fee ? latestAppointment.appointment_fee.toString() : null,
          notes: latestAppointment.notes,
          extra: latestAppointment.extra,
          created_at: latestAppointment.created_at,
          updated_at: latestAppointment.updated_at,
        } : null
      };
    });

    res.json(formattedPatients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Failed to fetch patients" });
  }
};

export const updatePatient = async (req, res) => {
  console.log("Received updatePatient request");
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      dob,
      gender,
      blood_group,
      emergency_contact,
    } = req.body;

    // Step 1: Update user details
    await prisma.users.update({
      where: { id: BigInt(id) },
      data: {
        full_name: name,
        email: email || null,
        phone,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
      },
    });

    // Step 2: Update patient profile
    await prisma.patient_profiles.update({
      where: { user_id: BigInt(id) },
      data: {
        blood_group: blood_group || null,
        emergency_contact: emergency_contact || {},
      },
    });

    res.json({ message: "Patient updated successfully" });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({ message: "Error updating patient" });
  }
};

export const deletePatient = async (req, res) => {
  console.log("Received deletePatient request");
  try {
    const { id } = req.params;

    // Check if patient exists first
    const patientProfile = await prisma.patient_profiles.findUnique({
      where: { user_id: BigInt(id) },
    });

    if (!patientProfile) {
      return res.status(404).json({ 
        message: "Patient not found" 
      });
    }

    // Step 1: Delete patient profile first (foreign key dependency)
    await prisma.patient_profiles.delete({
      where: { user_id: BigInt(id) },
    });

    // Step 2: Delete user
    await prisma.users.delete({
      where: { id: BigInt(id) },
    });

    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error);
    
    // Handle Prisma P2025 error (record not found)
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        message: "Patient not found" 
      });
    }
    
    res.status(500).json({ message: "Error deleting patient" });
  }
};