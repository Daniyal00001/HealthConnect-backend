import prisma from "../../prismaClient.js";

// ------------------
// GET ALL APPOINTMENTS FOR DOCTOR
// ------------------
export const getAllAppointments = async (req, res) => {
  console.log("🔍 getAllAppointments called");
  console.log("📋 Query parameters received:", req.query);
  try {
    const { doctor_id, clinic_id, status, date } = req.query;

    if (!doctor_id || !clinic_id) {
      return res.status(400).json({ 
        message: "Doctor ID and Clinic ID are required" 
      });
    }

    // Build where clause
    const whereClause = {
      doctor_user_id: BigInt(doctor_id),
      clinic_id: BigInt(clinic_id)
    };

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    // Add date filter if provided
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      whereClause.scheduled_at = {
        gte: startDate,
        lt: endDate
      };
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
            dob: true,
            gender: true,
            patient_profiles: true
          }
        },
        clinics: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        scheduled_at: 'asc'
      }
    });

    console.log(`✅ Found ${appointments.length} appointments for doctor ${doctor_id} in clinic ${clinic_id}`);
    
    res.status(200).json({
      message: "Appointments retrieved successfully",
      appointments
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ 
      message: "Error fetching appointments", 
      error: error.message 
    });
  }
};

// ------------------
// GET APPOINTMENT DETAILS
// ------------------
export const getAppointmentDetails = async (req, res) => {
  console.log("getAppointmentDetails called");
  try {
    const { appointment_id } = req.params;

    if (!appointment_id) {
      return res.status(400).json({ 
        message: "Appointment ID is required" 
      });
    }

    const appointment = await prisma.appointments.findUnique({
      where: { id: BigInt(appointment_id) },
      include: {
        users_appointments_patient_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            dob: true,
            gender: true,
            patient_profiles: true
          }
        },
        users_appointments_doctor_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            doctor_profiles: true
          }
        },
        clinics: {
          select: {
            name: true,
            code: true,
            address: true,
            phone: true
          }
        }
      }
    });

    if (!appointment) {
      console.log(`❌ Appointment ${appointment_id} not found`);
      return res.status(404).json({ 
        message: "Appointment not found" 
      });
    }

    console.log(`✅ Found appointment ${appointment_id} for patient: ${appointment.users_appointments_patient_user_idTousers?.full_name}`);
    
    res.status(200).json({
      message: "Appointment details retrieved successfully",
      appointment
    });
  } catch (error) {
    console.error("Error fetching appointment details:", error);
    res.status(500).json({ 
      message: "Error fetching appointment details", 
      error: error.message 
    });
  }
};

// ------------------
// UPDATE APPOINTMENT STATUS AND NOTES
// ------------------
export const updateAppointment = async (req, res) => {
  console.log("updateAppointment called");
  try {
    const { appointment_id } = req.params;
    const { status, notes } = req.body;

    if (!appointment_id) {
      return res.status(400).json({ 
        message: "Appointment ID is required" 
      });
    }

    // Validate status if provided
    const validStatuses = ['scheduled', 'checked_in', 'in_consult', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be one of: " + validStatuses.join(', ')
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updated_at = new Date();

    const updatedAppointment = await prisma.appointments.update({
      where: { id: BigInt(appointment_id) },
      data: updateData,
      include: {
        users_appointments_patient_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            dob: true,
            gender: true,
            patient_profiles: true
          }
        },
        clinics: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    console.log(`✅ Updated appointment ${appointment_id} - Status: ${updatedAppointment.status}, Patient: ${updatedAppointment.users_appointments_patient_user_idTousers?.full_name}`);
    
    res.status(200).json({
      message: "Appointment updated successfully",
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ 
      message: "Error updating appointment", 
      error: error.message 
    });
  }
};

// ------------------
// DELETE APPOINTMENT
// ------------------
export const deleteAppointment = async (req, res) => {
  console.log("deleteAppointment called");
  try {
    const { appointment_id } = req.params;

    if (!appointment_id) {
      return res.status(400).json({ 
        message: "Appointment ID is required" 
      });
    }

    // Check if appointment exists
    const appointment = await prisma.appointments.findUnique({
      where: { id: BigInt(appointment_id) },
    });

    if (!appointment) {
      return res.status(404).json({ 
        message: "Appointment not found" 
      });
    }

    // Delete the appointment
    await prisma.appointments.delete({
      where: { id: BigInt(appointment_id) },
    });

    console.log(`✅ Deleted appointment ${appointment_id}`);
    
    res.status(200).json({
      message: "Appointment deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    
    // Handle Prisma P2025 error (record not found)
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        message: "Appointment not found" 
      });
    }
    
    res.status(500).json({ 
      message: "Error deleting appointment", 
      error: error.message 
    });
  }
};

// ------------------
// GET PATIENT PREVIOUS RECORDS
// ------------------
export const getPatientPreviousRecords = async (req, res) => {
  console.log("getPatientPreviousRecords called");
  try {
    const { patient_id } = req.params;
    const { doctor_id, clinic_id } = req.query;

    if (!patient_id) {
      return res.status(400).json({ 
        message: "Patient ID is required" 
      });
    }

    if (!doctor_id || !clinic_id) {
      return res.status(400).json({ 
        message: "Doctor ID and Clinic ID are required" 
      });
    }

    const whereClause = {
      patient_user_id: BigInt(patient_id),
      doctor_user_id: BigInt(doctor_id),
      clinic_id: BigInt(clinic_id)
    };

    const previousAppointments = await prisma.appointments.findMany({
      where: whereClause,
      include: {
        users_appointments_patient_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            dob: true,
            gender: true,
            patient_profiles: true
          }
        },
        clinics: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        scheduled_at: 'desc'
      }
    });

    console.log(`✅ Found ${previousAppointments.length} previous appointments for patient ${patient_id}`);
    
    res.status(200).json({
      message: "Patient previous records retrieved successfully",
      patient_id: patient_id,
      total_appointments: previousAppointments.length,
      appointments: previousAppointments
    });
  } catch (error) {
    console.error("Error fetching patient previous records:", error);
    res.status(500).json({ 
      message: "Error fetching patient previous records", 
      error: error.message 
    });
  }
};

// ------------------
// GET DOCTOR DASHBOARD METRICS
// ------------------
export const getDoctorDashboard = async (req, res) => {
  console.log("🔍 getDoctorDashboard called");
  console.log("📋 Query params received:", req.query);
  try {
    const { doctor_id, clinic_id } = req.query;

    if (!doctor_id || !clinic_id) {
      console.log("❌ Missing doctor_id or clinic_id");
      return res.status(400).json({ 
        message: "Doctor ID and Clinic ID are required" 
      });
    }

    console.log(`🔍 Searching for appointments with:`);
    console.log(`   doctor_id: ${doctor_id} (type: ${typeof doctor_id})`);
    console.log(`   clinic_id: ${clinic_id} (type: ${typeof clinic_id})`);
    console.log(`   doctor_id as BigInt: ${BigInt(doctor_id).toString()}`);
    console.log(`   clinic_id as BigInt: ${BigInt(clinic_id).toString()}`);

    // Get current date (date only, no time)
    const today = new Date();
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Calculate date ranges (date only, no time)
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Calculate 7 days range from current date (last 7 days including today)
    const startOf7Days = new Date(today);
    startOf7Days.setDate(today.getDate() - 6); // 7 days including today (today - 6 days = 7 days total)
    startOf7Days.setHours(0, 0, 0, 0);
    
    const endOf7Days = new Date(today);
    endOf7Days.setDate(today.getDate() + 1); // End of today
    endOf7Days.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // First, let's check if there are ANY appointments for this doctor/clinic combination
    const totalAppointmentsCount = await prisma.appointments.count({
      where: {
        doctor_user_id: BigInt(doctor_id),
        clinic_id: BigInt(clinic_id)
      }
    });
    console.log(`📊 Total appointments found in DB: ${totalAppointmentsCount}`);

    // Also check without clinic_id filter to see if doctor_id is the issue
    const appointmentsWithoutClinicFilter = await prisma.appointments.count({
      where: {
        doctor_user_id: BigInt(doctor_id)
      }
    });
    console.log(`📊 Appointments for doctor_id only (any clinic): ${appointmentsWithoutClinicFilter}`);

    // Get ALL appointments for this doctor with created_at field
    const allAppointments = await prisma.appointments.findMany({
      where: {
        doctor_user_id: BigInt(doctor_id),
        clinic_id: BigInt(clinic_id)
      },
      select: {
        id: true,
        status: true,
        patient_user_id: true,
        created_at: true,
        appointment_fee: true
      }
    });

    console.log(`✅ Query executed. Found ${allAppointments.length} appointments`);
    if (allAppointments.length > 0) {
      console.log(`📋 Sample appointment:`, {
        id: allAppointments[0].id.toString(),
        status: allAppointments[0].status,
        created_at: allAppointments[0].created_at,
        appointment_fee: allAppointments[0].appointment_fee
      });
    } else {
      console.log(`⚠️ No appointments found. Checking if doctor/clinic combination exists...`);
      // Check if doctor exists
      const doctorExists = await prisma.users.findFirst({
        where: { id: BigInt(doctor_id) }
      });
      console.log(`   Doctor exists: ${doctorExists ? 'Yes' : 'No'}`);
      
      // Check if clinic exists
      const clinicExists = await prisma.clinics.findFirst({
        where: { id: BigInt(clinic_id) }
      });
      console.log(`   Clinic exists: ${clinicExists ? 'Yes' : 'No'}`);
      
      // Check if there are any appointments at all
      const anyAppointments = await prisma.appointments.count();
      console.log(`   Total appointments in database: ${anyAppointments}`);
      
      // Check appointments with different doctor_id format
      const appointmentsWithStringId = await prisma.appointments.findMany({
        where: {
          doctor_user_id: doctor_id,
          clinic_id: clinic_id
        },
        take: 5
      });
      console.log(`   Appointments with string IDs: ${appointmentsWithStringId.length}`);
    }

    // Helper function to extract date only from datetime (compare dates, not times)
    const getDateOnly = (date) => {
      const d = new Date(date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    // Get today's appointments - match created_at date with current date
    const todayAppointments = allAppointments.filter(app => {
      const appointmentCreatedDate = getDateOnly(app.created_at);
      const todayDate = getDateOnly(currentDate);
      return appointmentCreatedDate.getTime() === todayDate.getTime();
    });

    // Get last 7 days appointments - match created_at date within 7 days range
    const weeklyAppointments = allAppointments.filter(app => {
      const appointmentCreatedDate = getDateOnly(app.created_at);
      return appointmentCreatedDate >= startOf7Days && appointmentCreatedDate < endOf7Days;
    });

    // Get this month's appointments - match created_at date within current month
    const monthlyAppointments = allAppointments.filter(app => {
      const appointmentCreatedDate = getDateOnly(app.created_at);
      return appointmentCreatedDate >= startOfMonth && appointmentCreatedDate < endOfMonth;
    });

    // Get completed appointments (all time)
    const completedAppointments = allAppointments.filter(
      app => app.status === 'completed'
    );

    // Get today's completed appointments
    const todayCompletedAppointments = todayAppointments.filter(
      app => app.status === 'completed'
    );

    // Get this week's completed appointments
    const weeklyCompletedAppointments = weeklyAppointments.filter(
      app => app.status === 'completed'
    );

    // Get this month's completed appointments
    const monthlyCompletedAppointments = monthlyAppointments.filter(
      app => app.status === 'completed'
    );

    // Get unique patients (all time)
    const uniquePatients = new Set(
      allAppointments.map(app => app.patient_user_id.toString())
    ).size;

    // Get unique patients today
    const uniquePatientsToday = new Set(
      todayAppointments.map(app => app.patient_user_id.toString())
    ).size;

    // Get unique patients this week
    const uniquePatientsThisWeek = new Set(
      weeklyAppointments.map(app => app.patient_user_id.toString())
    ).size;

    // Get unique patients this month
    const uniquePatientsThisMonth = new Set(
      monthlyAppointments.map(app => app.patient_user_id.toString())
    ).size;

    // Get total earnings (all time) from appointment_fee column in appointments table
    const totalEarnings = await prisma.appointments.aggregate({
      where: {
        doctor_user_id: BigInt(doctor_id),
        clinic_id: BigInt(clinic_id),
        status: 'completed',
        appointment_fee: {
          not: null
        }
      },
      _sum: {
        appointment_fee: true
      }
    });

    // Get last 7 days earnings from appointment_fee column - using created_at date
    const weeklyEarnings = await prisma.appointments.aggregate({
      where: {
        doctor_user_id: BigInt(doctor_id),
        clinic_id: BigInt(clinic_id),
        created_at: {
          gte: startOf7Days,
          lt: endOf7Days
        },
        status: 'completed',
        appointment_fee: {
          not: null
        }
      },
      _sum: {
        appointment_fee: true
      }
    });

    // Get this month's earnings from appointment_fee column - using created_at date
    const monthlyEarnings = await prisma.appointments.aggregate({
      where: {
        doctor_user_id: BigInt(doctor_id),
        clinic_id: BigInt(clinic_id),
        created_at: {
          gte: startOfMonth,
          lt: endOfMonth
        },
        status: 'completed',
        appointment_fee: {
          not: null
        }
      },
      _sum: {
        appointment_fee: true
      }
    });

    // Get today's earnings from appointment_fee column - using created_at date
    const todayEarnings = await prisma.appointments.aggregate({
      where: {
        doctor_user_id: BigInt(doctor_id),
        clinic_id: BigInt(clinic_id),
        created_at: {
          gte: startOfToday,
          lt: endOfToday
        },
        status: 'completed',
        appointment_fee: {
          not: null
        }
      },
      _sum: {
        appointment_fee: true
      }
    });

    // Calculate remaining appointments (not completed or cancelled)
    const remainingAppointments = allAppointments.filter(
      app => app.status !== 'completed' && app.status !== 'cancelled'
    ).length;

    // Calculate pending appointments (scheduled, checked_in, in_consult)
    const pendingAppointments = allAppointments.filter(
      app => ['scheduled', 'checked_in', 'in_consult'].includes(app.status)
    ).length;

    const dashboard = {
      overall: {
        total_patients: uniquePatients,
        total_appointments: allAppointments.length,
        completed_appointments: completedAppointments.length,
        remaining_appointments: remainingAppointments,
        pending_appointments: pendingAppointments,
        total_earnings: totalEarnings._sum.appointment_fee ? parseFloat(totalEarnings._sum.appointment_fee) : 0
      },
      this_month: {
        total_patients: uniquePatientsThisMonth,
        total_appointments: monthlyAppointments.length,
        completed_appointments: monthlyCompletedAppointments.length,
        earnings: monthlyEarnings._sum.appointment_fee ? parseFloat(monthlyEarnings._sum.appointment_fee) : 0
      },
      this_week: {
        total_patients: uniquePatientsThisWeek,
        total_appointments: weeklyAppointments.length,
        completed_appointments: weeklyCompletedAppointments.length,
        earnings: weeklyEarnings._sum.appointment_fee ? parseFloat(weeklyEarnings._sum.appointment_fee) : 0
      },
      today: {
        total_patients: uniquePatientsToday,
        total_appointments: todayAppointments.length,
        completed_appointments: todayCompletedAppointments.length,
        earnings: todayEarnings._sum.appointment_fee ? parseFloat(todayEarnings._sum.appointment_fee) : 0
      },
      summary: {
        completion_rate_overall: allAppointments.length > 0 
          ? ((completedAppointments.length / allAppointments.length) * 100).toFixed(2)
          : 0,
        completion_rate_month: monthlyAppointments.length > 0 
          ? ((monthlyCompletedAppointments.length / monthlyAppointments.length) * 100).toFixed(2)
          : 0,
        completion_rate_week: weeklyAppointments.length > 0 
          ? ((weeklyCompletedAppointments.length / weeklyAppointments.length) * 100).toFixed(2)
          : 0,
        completion_rate_today: todayAppointments.length > 0 
          ? ((todayCompletedAppointments.length / todayAppointments.length) * 100).toFixed(2)
          : 0
      }
    };

    console.log(`📊 Dashboard metrics for doctor ${doctor_id} in clinic ${clinic_id}:`);
    console.log(`   Overall: ${dashboard.overall.total_patients} patients, ${dashboard.overall.total_appointments} appointments, ${dashboard.overall.completed_appointments} completed, $${dashboard.overall.total_earnings} earnings`);
    console.log(`   This month: ${dashboard.this_month.total_patients} patients, ${dashboard.this_month.total_appointments} appointments, ${dashboard.this_month.completed_appointments} completed, $${dashboard.this_month.earnings} earnings`);
    console.log(`   This week: ${dashboard.this_week.total_patients} patients, ${dashboard.this_week.total_appointments} appointments, ${dashboard.this_week.completed_appointments} completed, $${dashboard.this_week.earnings} earnings`);
    console.log(`   Today: ${dashboard.today.total_patients} patients, ${dashboard.today.total_appointments} appointments, ${dashboard.today.completed_appointments} completed, $${dashboard.today.earnings} earnings`);
    console.log(`   Completion rates - Overall: ${dashboard.summary.completion_rate_overall}%, Month: ${dashboard.summary.completion_rate_month}%, Week: ${dashboard.summary.completion_rate_week}%, Today: ${dashboard.summary.completion_rate_today}%`);
    
    // Debug: Show all appointments with their statuses
    console.log(`🔍 Debug - All appointments breakdown:`);
    console.log(`   Total appointments: ${allAppointments.length}`);
    console.log(`   Completed: ${completedAppointments.length}, Remaining: ${remainingAppointments}, Pending: ${pendingAppointments}`);
    console.log(`   Status breakdown:`, allAppointments.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {}));
    
    console.log(`📤 Sending response with dashboard data...`);
    console.log(`📦 Response structure:`, JSON.stringify(dashboard, null, 2).substring(0, 500));
    
    res.status(200).json({
      message: "Dashboard metrics retrieved successfully",
      dashboard
    });
    
    console.log(`✅ Response sent successfully`);
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ 
      message: "Error fetching dashboard metrics", 
      error: error.message 
    });
  }
};

// ------------------
// GET TODAY'S APPOINTMENTS SUMMARY
// ------------------
export const getTodayAppointments = async (req, res) => {
  console.log("getTodayAppointments called");
  try {
    const { doctor_id, clinic_id } = req.query;

    if (!doctor_id || !clinic_id) {
      return res.status(400).json({ 
        message: "Doctor ID and Clinic ID are required" 
      });
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayAppointments = await prisma.appointments.findMany({
      where: {
        doctor_user_id: BigInt(doctor_id),
        clinic_id: BigInt(clinic_id),
        scheduled_at: {
          gte: startOfToday,
          lt: endOfToday
        }
      },
      include: {
        users_appointments_patient_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            dob: true,
            gender: true,
            patient_profiles: true
          }
        }
      },
      orderBy: {
        scheduled_at: 'asc'
      }
    });

    // Group appointments by status
    const appointmentsByStatus = todayAppointments.reduce((acc, appointment) => {
      const status = appointment.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(appointment);
      return acc;
    }, {});

    console.log(`📅 Today's appointments for doctor ${doctor_id}: ${todayAppointments.length} total`);
    console.log(`   By status:`, Object.keys(appointmentsByStatus).map(status => `${status}: ${appointmentsByStatus[status].length}`).join(', '));
    
    // Debug: Show detailed appointment information
    console.log(`🔍 Debug - Today's appointments details:`);
    todayAppointments.forEach((app, index) => {
      console.log(`   ${index + 1}. ID: ${app.id}, Status: ${app.status}, Scheduled: ${app.scheduled_at}, Patient: ${app.users_appointments_patient_user_idTousers?.full_name || 'Unknown'}`);
    });
    
    res.status(200).json({
      message: "Today's appointments retrieved successfully",
      date: startOfToday.toISOString().split('T')[0],
      total_appointments: todayAppointments.length,
      appointments_by_status: appointmentsByStatus,
      appointments: todayAppointments
    });
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ 
      message: "Error fetching today's appointments", 
      error: error.message 
    });
  }
};

// ------------------
// DEBUG ENDPOINT - GET ALL APPOINTMENTS WITH DETAILS
// ------------------
export const debugAppointments = async (req, res) => {
  console.log("🔧 debugAppointments called");
  try {
    const { doctor_id, clinic_id } = req.query;

    if (!doctor_id || !clinic_id) {
      return res.status(400).json({ 
        message: "Doctor ID and Clinic ID are required" 
      });
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log(`🔍 Debug query for doctor ${doctor_id} in clinic ${clinic_id}`);
    console.log(`📅 Date range: ${startOfToday.toISOString()} to ${endOfToday.toISOString()}`);

    // Get all appointments for today with full details
    const allAppointments = await prisma.appointments.findMany({
      where: {
        doctor_user_id: BigInt(doctor_id),
        clinic_id: BigInt(clinic_id),
        scheduled_at: {
          gte: startOfToday,
          lt: endOfToday
        }
      },
      include: {
        users_appointments_patient_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        scheduled_at: 'asc'
      }
    });

    console.log(`🔍 Found ${allAppointments.length} appointments in database`);
    
    // Group by status for analysis
    const statusCounts = allAppointments.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`📊 Status breakdown:`, statusCounts);

    res.status(200).json({
      message: "Debug information retrieved successfully",
      debug_info: {
        doctor_id,
        clinic_id,
        date_range: {
          start: startOfToday.toISOString(),
          end: endOfToday.toISOString()
        },
        total_appointments: allAppointments.length,
        status_counts: statusCounts,
        appointments: allAppointments
      }
    });
  } catch (error) {
    console.error("Error in debug appointments:", error);
    res.status(500).json({ 
      message: "Error in debug appointments", 
      error: error.message 
    });
  }
};

// ------------------
// GET DOCTOR PAYMENT TRACKING
// ------------------
export const getDoctorPaymentTracking = async (req, res) => {
  console.log("💰 getDoctorPaymentTracking called");
  try {
    const { doctor_id, clinic_id } = req.query;

    if (!doctor_id || !clinic_id) {
      return res.status(400).json({ 
        message: "Doctor ID and Clinic ID are required" 
      });
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(today.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Get all appointments with fees for this doctor
    const allAppointments = await prisma.appointments.findMany({
      where: {
        doctor_user_id: BigInt(doctor_id),
        clinic_id: BigInt(clinic_id),
        appointment_fee: {
          not: null
        }
      },
      include: {
        users_appointments_patient_user_idTousers: {
          select: {
            full_name: true,
            phone: true
          }
        }
      },
      orderBy: {
        scheduled_at: 'desc'
      }
    });

    // Filter by time periods
    const todayAppointments = allAppointments.filter(app => {
      const appointmentDate = new Date(app.scheduled_at);
      return appointmentDate >= startOfToday && appointmentDate < endOfToday;
    });

    const weeklyAppointments = allAppointments.filter(app => {
      const appointmentDate = new Date(app.scheduled_at);
      return appointmentDate >= startOfWeek && appointmentDate < endOfWeek;
    });

    const monthlyAppointments = allAppointments.filter(app => {
      const appointmentDate = new Date(app.scheduled_at);
      return appointmentDate >= startOfMonth && appointmentDate < endOfMonth;
    });

    // Calculate earnings by time period
    const totalEarnings = allAppointments.reduce((sum, app) => sum + Number(app.appointment_fee || 0), 0);
    const todayEarnings = todayAppointments.reduce((sum, app) => sum + Number(app.appointment_fee || 0), 0);
    const weeklyEarnings = weeklyAppointments.reduce((sum, app) => sum + Number(app.appointment_fee || 0), 0);
    const monthlyEarnings = monthlyAppointments.reduce((sum, app) => sum + Number(app.appointment_fee || 0), 0);

    // Group by payment status
    const paymentStatusBreakdown = allAppointments.reduce((acc, app) => {
      const status = app.payment_status || 'unpaid';
      if (!acc[status]) {
        acc[status] = {
          count: 0,
          total_amount: 0
        };
      }
      acc[status].count += 1;
      acc[status].total_amount += Number(app.appointment_fee || 0);
      return acc;
    }, {});

    // Get recent transactions
    const recentTransactions = allAppointments.slice(0, 10).map(app => ({
      appointment_id: app.id,
      patient_name: app.users_appointments_patient_user_idTousers?.full_name,
      patient_phone: app.users_appointments_patient_user_idTousers?.phone,
      scheduled_at: app.scheduled_at,
      appointment_fee: app.appointment_fee,
      payment_status: app.payment_status,
      status: app.status
    }));

    const paymentTracking = {
      doctor_id,
      clinic_id,
      earnings_summary: {
        total_earnings: totalEarnings,
        monthly_earnings: monthlyEarnings,
        weekly_earnings: weeklyEarnings,
        today_earnings: todayEarnings
      },
      appointment_counts: {
        total_appointments: allAppointments.length,
        monthly_appointments: monthlyAppointments.length,
        weekly_appointments: weeklyAppointments.length,
        today_appointments: todayAppointments.length
      },
      payment_status_breakdown: paymentStatusBreakdown,
      recent_transactions: recentTransactions
    };

    console.log(`💰 Payment tracking for doctor ${doctor_id}:`);
    console.log(`   Total earnings: $${totalEarnings}, Monthly: $${monthlyEarnings}, Weekly: $${weeklyEarnings}, Today: $${todayEarnings}`);
    console.log(`   Payment status breakdown:`, paymentStatusBreakdown);

    res.status(200).json({
      message: "Doctor payment tracking retrieved successfully",
      payment_tracking: paymentTracking
    });
  } catch (error) {
    console.error("Error fetching doctor payment tracking:", error);
    res.status(500).json({ 
      message: "Error fetching doctor payment tracking", 
      error: error.message 
    });
  }
};
