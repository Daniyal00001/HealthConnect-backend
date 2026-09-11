import prisma from "../../prismaClient.js";

export const getClinicPatients = async (req, res) => {
  console.log("Received getallClinicPatients request");
  
  try {
    // Get clinic_id from query params or body
    const clinicIdParam = req.query.clinic_id || req.body.clinic_id || req.params.clinic_id;
    
    if (!clinicIdParam) {
      return res.status(400).json({ message: "clinic_id is required" });
    }

    const clinicId = BigInt(clinicIdParam);

    // Get all patients who have appointments at this clinic
    const appointments = await prisma.appointments.findMany({
      where: {
        clinic_id: clinicId,
      },
      select: {
        patient_user_id: true,
      },
      distinct: ['patient_user_id'],
    });

    const patientUserIds = appointments.map(apt => apt.patient_user_id);

    if (patientUserIds.length === 0) {
      return res.json({
        patients: [],
        stats: {
          total: 0,
          active: 0,
          newThisMonth: 0,
        },
      });
    }

    // Fetch patient details with profiles
    const patientsData = await prisma.users.findMany({
      where: {
        id: { in: patientUserIds },
      },
      include: {
        patient_profiles: true,
      },
    });

    // Calculate stats for each patient
    const patientsWithStats = await Promise.all(
      patientsData.map(async (user) => {
        // Get total visits (appointments) count
        const totalVisits = await prisma.appointments.count({
          where: {
            patient_user_id: user.id,
            clinic_id: clinicId,
          },
        });

        // Get last visit date
        const lastAppointment = await prisma.appointments.findFirst({
          where: {
            patient_user_id: user.id,
            clinic_id: clinicId,
            status: { in: ['completed', 'checked_in', 'in_consult'] },
          },
          orderBy: {
            scheduled_at: 'desc',
          },
          select: {
            scheduled_at: true,
          },
        });

        return {
          id: user.id.toString(),
          user_id: user.id.toString(),
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          dob: user.dob,
          gender: user.gender,
          blood_group: user.patient_profiles?.blood_group,
          medical_record_no: user.patient_profiles?.medical_record_no,
          emergency_contact: user.patient_profiles?.emergency_contact,
          created_at: user.created_at,
          total_visits: totalVisits,
          last_visit: lastAppointment?.scheduled_at || null,
        };
      })
    );

    // Calculate overall stats
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const newThisMonth = patientsWithStats.filter(
      p => p.created_at && new Date(p.created_at) >= firstDayOfMonth
    ).length;

    const activePatients = patientsWithStats.filter(
      p => p.last_visit && new Date(p.last_visit) >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // Active in last 90 days
    ).length;

    // Sort by most recent registration
    patientsWithStats.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    res.json({
      patients: patientsWithStats,
      stats: {
        total: patientsWithStats.length,
        active: activePatients,
        newThisMonth: newThisMonth,
      },
    });
  } catch (error) {
    console.error("Error fetching clinic patients:", error);
    res.status(500).json({ 
      message: "Failed to fetch patients",
      error: error.message 
    });
  }
};