import prisma from "../../prismaClient.js";

const getPatientById = async (req, res) => {
    console.log("Received getPatientById requesssssssssssst");
  try {
    const { id } = req.params;
    const patientUserId = BigInt(id);

    // Fetch patient profile with user details
    const patientProfile = await prisma.patient_profiles.findUnique({
      where: { user_id: patientUserId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            dob: true,
            gender: true,
            is_active: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Format the response
    const response = {
      success: true,
      user: {
        id: patientProfile.users.id.toString(),
        full_name: patientProfile.users.full_name,
        email: patientProfile.users.email,
        phone: patientProfile.users.phone,
        dob: patientProfile.users.dob,
        gender: patientProfile.users.gender,
        is_active: patientProfile.users.is_active,
        created_at: patientProfile.users.created_at,
        updated_at: patientProfile.users.updated_at,
      },
      medical_record_no: patientProfile.medical_record_no,
      blood_group: patientProfile.blood_group,
      emergency_contact: patientProfile.emergency_contact,
      extra: patientProfile.extra,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient details',
      error: error.message,
    });
  }
};

/**
 * Get patient appointments by patient ID
 * GET /api/patient/:id/appointments
 */
const getPatientAppointments = async (req, res) => {
    console.log("Received getPatientAppointmentsssssssssssssssssss request");
  try {
    const { id } = req.params;
    const patientUserId = BigInt(id);

    // Verify patient exists
    const patient = await prisma.patient_profiles.findUnique({
      where: { user_id: patientUserId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Fetch appointments with related data
    const appointments = await prisma.appointments.findMany({
      where: { patient_user_id: patientUserId },
      include: {
        clinics: {
          select: {
            id: true,
            name: true,
          },
        },
        users_appointments_doctor_user_idTousers: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: {
        scheduled_at: 'desc',
      },
    });

    // Format the response
    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id.toString(),
      token_number: apt.token_number,
      scheduled_at: apt.scheduled_at,
      status: apt.status,
      payment_status: apt.payment_status,
      appointment_fee: apt.appointment_fee ? apt.appointment_fee.toString() : null,
      notes: apt.notes,
      clinic_name: apt.clinics.name,
      doctor_name: apt.users_appointments_doctor_user_idTousers.full_name,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient appointments',
      error: error.message,
    });
  }
};

/**
 * Get all patients (for patients list page)
 * GET /api/patient
 * Filters patients by clinic_id from appointments
 */
const getAllPatients = async (req, res) => {
    console.log("Received getAllPatients request");
    console.log("Query params:", req.query);
    console.log("Body:", req.body);
    console.log("req.user:", req.user);
  try {
    // Get clinic_id from query params, body, or authenticated user
    const clinicIdParam = req.query.clinic_id || req.body.clinic_id || req.user?.clinic_id;
    
    console.log("clinicIdParam received:", clinicIdParam);
    
    if (!clinicIdParam) {
      return res.status(400).json({
        success: false,
        message: "clinic_id is required"
      });
    }

    const clinicId = BigInt(clinicIdParam);
    console.log("Using clinicId (BigInt):", clinicId.toString());
    
    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // First, get all patient_user_ids who have appointments at this clinic
    const appointments = await prisma.appointments.findMany({
      where: {
        clinic_id: clinicId,
      },
      select: {
        patient_user_id: true,
        clinic_id: true, // Add this for debugging
      },
      distinct: ['patient_user_id'],
    });

    console.log(`Found ${appointments.length} appointments for clinic_id ${clinicId.toString()}`);
    console.log("Sample appointments:", appointments.slice(0, 3).map(a => ({
      patient_user_id: a.patient_user_id.toString(),
      clinic_id: a.clinic_id.toString()
    })));

    const patientUserIds = appointments.map(apt => apt.patient_user_id);

    if (patientUserIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
        },
      });
    }

    // Build where clause - filter by patient_user_ids from appointments
    const where = {
      user_id: { in: patientUserIds },
    };

    if (search) {
      where.users = {
        OR: [
          { full_name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    if (status) {
      where.users = {
        ...where.users,
        is_active: status === 'active',
      };
    }

    // Fetch patients with pagination - only those with appointments at this clinic
    const [patients, total] = await Promise.all([
      prisma.patient_profiles.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
              dob: true,
              gender: true,
              is_active: true,
              created_at: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          users: {
            created_at: 'desc',
          },
        },
      }),
      prisma.patient_profiles.count({ where }),
    ]);

    // Get latest appointment info for each patient - ONLY from this clinic
    const patientsWithAppointments = await Promise.all(
      patients.map(async (patient) => {
        // Get latest appointment ONLY from this specific clinic
        const latestAppointment = await prisma.appointments.findFirst({
          where: {
            patient_user_id: patient.user_id,
            clinic_id: clinicId, // CRITICAL: Only appointments from this clinic
          },
          orderBy: {
            scheduled_at: 'desc',
          },
          include: {
            clinics: {
              select: {
                name: true,
              },
            },
            users_appointments_doctor_user_idTousers: {
              select: {
                full_name: true,
              },
            },
          },
        });

        // If no appointment found for this clinic, skip this patient
        if (!latestAppointment) {
          console.log(`Skipping patient ${patient.user_id.toString()} - no appointment at clinic ${clinicId.toString()}`);
          return null;
        }

        // Double-check: Verify appointment belongs to correct clinic
        if (latestAppointment.clinic_id.toString() !== clinicId.toString()) {
          console.error(`ERROR: Appointment clinic_id mismatch! Expected ${clinicId.toString()}, got ${latestAppointment.clinic_id.toString()}`);
          return null;
        }

        return {
          id: patient.user_id.toString(),
          user_id: patient.user_id.toString(),
          blood_group: patient.blood_group,
          emergency_contact: patient.emergency_contact,
          address: patient.address,
          medical_record_no: patient.medical_record_no,
          user: {
            id: patient.users.id.toString(),
            full_name: patient.users.full_name,
            email: patient.users.email,
            phone: patient.users.phone,
            dob: patient.users.dob,
            gender: patient.users.gender,
            is_active: patient.users.is_active,
            created_at: patient.users.created_at,
            updated_at: patient.users.updated_at,
          },
          latestAppointment: {
            id: latestAppointment.id.toString(),
            clinic_id: latestAppointment.clinic_id.toString(),
            clinic_name: latestAppointment.clinics?.name,
            patient_user_id: latestAppointment.patient_user_id.toString(),
            doctor_user_id: latestAppointment.doctor_user_id.toString(),
            doctor_name: latestAppointment.users_appointments_doctor_user_idTousers?.full_name,
            scheduled_at: latestAppointment.scheduled_at,
            token_number: latestAppointment.token_number,
            token_date: latestAppointment.token_date,
            status: latestAppointment.status,
            payment_status: latestAppointment.payment_status,
            appointment_fee: latestAppointment.appointment_fee?.toString(),
            notes: latestAppointment.notes,
            extra: latestAppointment.extra,
            created_at: latestAppointment.created_at,
            updated_at: latestAppointment.updated_at,
          },
        };
      })
    );

    // Filter out null values (patients without appointments at this clinic)
    const filteredPatients = patientsWithAppointments.filter(p => p !== null);
    
    console.log(`Returning ${filteredPatients.length} patients for clinic_id ${clinicId.toString()}`);

    res.json({
      success: true,
      data: filteredPatients,
      pagination: {
        total: filteredPatients.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredPatients.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message,
    });
  }
};

export default {
    getPatientById,
    getPatientAppointments,
    getAllPatients
    
};

