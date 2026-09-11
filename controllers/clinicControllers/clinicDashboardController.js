import prisma from "../../prismaClient.js";

export const getDashboardData = async (req, res) => {
  console.log("\n==============================");
  console.log("📊 Clinic Dashboard Data Request Received");
  console.log("Query Params:", req.query);
  console.log("==============================\n");

  try {
    const { clinic_id, current_date } = req.query;

    if (!clinic_id) {
      console.log("❌ ERROR: clinic_id missing in request");
      return res.status(400).json({ error: 'clinic_id is required' });
    }

    const clinicId = BigInt(clinic_id);
    console.log("➡️ Using clinicId:", clinicId);

    // Use frontend-provided date (YYYY-MM-DD) if present to avoid TZ drift
    const baseDate = current_date
      ? new Date(`${current_date}T00:00:00`)
      : new Date();

    // Get current date (date only, no time) from frontend
    const currentDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    
    // Calculate date ranges (date only, no time)
    const startOfToday = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    const endOfToday = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1);
    
    // Calculate 7 days range from current date (last 7 days including today)
    const startOf7Days = new Date(baseDate);
    startOf7Days.setDate(baseDate.getDate() - 6); // 7 days including today (today - 6 days = 7 days total)
    startOf7Days.setHours(0, 0, 0, 0);
    
    const endOf7Days = new Date(baseDate);
    endOf7Days.setDate(baseDate.getDate() + 1); // End of today
    endOf7Days.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const endOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);

    console.log("📅 Date ranges for calculations (using created_at date only):");
    console.log(`   Current date from frontend: ${current_date || 'not provided, using server date'}`);
    console.log(`   Today: ${startOfToday.toISOString().split('T')[0]}`);
    console.log(`   Week: ${startOf7Days.toISOString().split('T')[0]} to ${endOf7Days.toISOString().split('T')[0]} (last 7 days including today)`);
    console.log(`   Month: ${startOfMonth.toISOString().split('T')[0]} to ${endOfMonth.toISOString().split('T')[0]}`);

    // Helper function to extract date only from datetime (compare dates, not times)
    const getDateOnly = (date) => {
      const d = new Date(date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    // Get ALL appointments for this clinic with created_at, appointment_fee, and payment_status
    // We'll filter by date in memory to ensure date-only matching
    const allAppointmentsRaw = await prisma.appointments.findMany({
      where: {
        clinic_id: clinicId
      },
      select: { 
        id: true, 
        status: true,
        payment_status: true,
        appointment_fee: true,
        created_at: true,
        patient_user_id: true
      }
    });

    console.log(`📊 Total appointments found in DB: ${allAppointmentsRaw.length}`);

    // Filter appointments by created_at date (not datetime) - date only matching
    const todayAppointments = allAppointmentsRaw.filter(app => {
      const appointmentCreatedDate = getDateOnly(app.created_at);
      const todayDate = getDateOnly(currentDate);
      return appointmentCreatedDate.getTime() === todayDate.getTime();
    });

    const weekAppointments = allAppointmentsRaw.filter(app => {
      const appointmentCreatedDate = getDateOnly(app.created_at);
      return appointmentCreatedDate >= startOf7Days && appointmentCreatedDate < endOf7Days;
    });

    const monthAppointments = allAppointmentsRaw.filter(app => {
      const appointmentCreatedDate = getDateOnly(app.created_at);
      return appointmentCreatedDate >= startOfMonth && appointmentCreatedDate < endOfMonth;
    });

    const allAppointments = allAppointmentsRaw;

    console.log(`📊 Appointments filtered by created_at date:`);
    console.log(`   Today: ${todayAppointments.length} appointments (created on ${currentDate.toISOString().split('T')[0]})`);
    if (todayAppointments.length > 0) {
      console.log(`   Today's appointments:`, todayAppointments.map(apt => ({
        id: apt.id.toString(),
        created_at: apt.created_at,
        payment_status: apt.payment_status,
        appointment_fee: apt.appointment_fee
      })));
    }
    console.log(`   Week: ${weekAppointments.length} appointments (created between ${startOf7Days.toISOString().split('T')[0]} and ${endOf7Days.toISOString().split('T')[0]})`);
    console.log(`   Month: ${monthAppointments.length} appointments (created between ${startOfMonth.toISOString().split('T')[0]} and ${endOfMonth.toISOString().split('T')[0]})`);
    
    // Debug: Show all appointments with their created_at dates
    console.log(`🔍 Debug - All appointments with created_at dates:`);
    allAppointmentsRaw.slice(0, 10).forEach(apt => {
      const aptDate = getDateOnly(apt.created_at);
      const todayDate = getDateOnly(currentDate);
      const isToday = aptDate.getTime() === todayDate.getTime();
      console.log(`   ID: ${apt.id.toString()}, created_at: ${apt.created_at}, date_only: ${aptDate.toISOString().split('T')[0]}, is_today: ${isToday}, payment_status: ${apt.payment_status}, fee: ${apt.appointment_fee}`);
    });

    // Get distinct patients for each period
    const todayPatientsDistinct = [...new Set(todayAppointments.map(apt => apt.patient_user_id.toString()))];
    const weekPatientsDistinct = [...new Set(weekAppointments.map(apt => apt.patient_user_id.toString()))];
    const monthPatientsDistinct = [...new Set(monthAppointments.map(apt => apt.patient_user_id.toString()))];
    const allPatientsDistinct = [...new Set(allAppointments.map(apt => apt.patient_user_id.toString()))];

    // Helper function to parse decimal to float
    const parseAmount = (value) => parseFloat(value) || 0;

    // Calculate earnings from paid appointments based on created_at date ranges
    // IMPORTANT: Only count earnings for appointments with payment_status === 'paid'
    const earningsToday = todayAppointments
      .filter(app => app.payment_status === 'paid' && app.appointment_fee !== null)
      .reduce((sum, apt) => sum + parseAmount(apt.appointment_fee), 0);

    const earningsWeek = weekAppointments
      .filter(app => app.payment_status === 'paid' && app.appointment_fee !== null)
      .reduce((sum, apt) => sum + parseAmount(apt.appointment_fee), 0);

    const earningsMonth = monthAppointments
      .filter(app => app.payment_status === 'paid' && app.appointment_fee !== null)
      .reduce((sum, apt) => sum + parseAmount(apt.appointment_fee), 0);

    const earningsOverall = allAppointments
      .filter(app => app.payment_status === 'paid' && app.appointment_fee !== null)
      .reduce((sum, apt) => sum + parseAmount(apt.appointment_fee), 0);

    console.log(`💰 Earnings calculation (based on payment_status='paid' and created_at date ranges):`);
    console.log(`   Today (${currentDate.toISOString().split('T')[0]}): ${earningsToday} (from ${todayAppointments.filter(app => app.payment_status === 'paid').length} paid appointments)`);
    console.log(`   Week (${startOf7Days.toISOString().split('T')[0]} to ${endOf7Days.toISOString().split('T')[0]}): ${earningsWeek} (from ${weekAppointments.filter(app => app.payment_status === 'paid').length} paid appointments)`);
    console.log(`   Month (${startOfMonth.toISOString().split('T')[0]} to ${endOfMonth.toISOString().split('T')[0]}): ${earningsMonth} (from ${monthAppointments.filter(app => app.payment_status === 'paid').length} paid appointments)`);
    console.log(`   Overall: ${earningsOverall} (from ${allAppointments.filter(app => app.payment_status === 'paid').length} paid appointments)`);

    // Parallel Queries for other data
    const [
      clinicInfo,
      totalDoctors,
      totalFrontDesk,

      // Get all active doctors assigned to this clinic
      activeDoctorsList
    ] = await Promise.all([

      prisma.clinics.findUnique({
        where: { id: clinicId },
        select: { id: true, name: true, code: true, is_active: true }
      }),

      prisma.clinic_user_roles.count({
        where: { clinic_id: clinicId, role_id: 4 } // doctor
      }),

      prisma.clinic_user_roles.count({
        where: { clinic_id: clinicId, role_id: 3 } // front_desk
      }),

      // Get all active doctors assigned to this clinic (role_id = 4)
      // Include only users where is_active = true
      prisma.clinic_user_roles.findMany({
        where: {
          clinic_id: clinicId,
          role_id: 4,
          users: {
            is_active: true
          }
        },
        select: {
          users: {
            select: {
              id: true,
              full_name: true,
              phone: true,
              email: true,
              is_active: true,
              doctor_profiles: {
                select: {
                  specialization: true,
                  qualifications: true,
                  is_active: true
                }
              }
            }
          }
        }
      })
    ]);

    console.log("\n=================== RAW RESULTS ===================");
    console.log(`Today Appointments (created_at date = ${currentDate.toISOString().split('T')[0]}):`, todayAppointments.length);
    console.log(`   Paid today: ${todayAppointments.filter(app => app.payment_status === 'paid').length}`);
    console.log(`Week Appointments (created_at between ${startOf7Days.toISOString().split('T')[0]} and ${endOf7Days.toISOString().split('T')[0]}):`, weekAppointments.length);
    console.log(`   Paid this week: ${weekAppointments.filter(app => app.payment_status === 'paid').length}`);
    console.log(`Month Appointments (created_at between ${startOfMonth.toISOString().split('T')[0]} and ${endOfMonth.toISOString().split('T')[0]}):`, monthAppointments.length);
    console.log(`   Paid this month: ${monthAppointments.filter(app => app.payment_status === 'paid').length}`);
    console.log("All Appointments:", allAppointments.length);
    console.log(`   Paid overall: ${allAppointments.filter(app => app.payment_status === 'paid').length}`);

    console.log("Clinic Info:", clinicInfo);

    console.log("Total Doctors:", totalDoctors);
    console.log("Total Front Desk:", totalFrontDesk);
    console.log(`Patients Today (created_at date = ${currentDate.toISOString().split('T')[0]}):`, todayPatientsDistinct.length);
    console.log(`Patients Week (created_at between ${startOf7Days.toISOString().split('T')[0]} and ${endOf7Days.toISOString().split('T')[0]}):`, weekPatientsDistinct.length);
    console.log(`Patients Month (created_at between ${startOfMonth.toISOString().split('T')[0]} and ${endOfMonth.toISOString().split('T')[0]}):`, monthPatientsDistinct.length);
    console.log("Total Patients (distinct):", allPatientsDistinct.length);

    console.log("Active Doctors (List):", activeDoctorsList.length);
    console.log("===================================================\n");

    const processAppointmentData = (appointments) => {
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;

      return {
        total_appointments: appointments.length,
        completed_appointments: completedAppointments
      };
    };


    // Calculate total active doctors count
    const totalActiveDoctors = activeDoctorsList.length;
    
    // Total patients registered in clinic
    const totalPatientsRegistered = allPatientsDistinct.length;

    const dashboard = {
      today: {
        ...processAppointmentData(todayAppointments),
        total_revenue: earningsToday,
        total_active_doctors: totalActiveDoctors,
        total_patients_registered: todayPatientsDistinct.length
      },
      this_week: {
        ...processAppointmentData(weekAppointments),
        total_revenue: earningsWeek,
        total_active_doctors: totalActiveDoctors,
        total_patients_registered: weekPatientsDistinct.length
      },
      this_month: {
        ...processAppointmentData(monthAppointments),
        total_revenue: earningsMonth,
        total_active_doctors: totalActiveDoctors,
        total_patients_registered: monthPatientsDistinct.length
      },
      overall: {
        ...processAppointmentData(allAppointments),
        total_revenue: earningsOverall,
        total_active_doctors: totalActiveDoctors,
        total_patients_registered: totalPatientsRegistered
      },
      summary: {
        total_active_doctors: totalActiveDoctors,
        total_patients_registered: totalPatientsRegistered
      },
      clinic_info: {
        id: clinicInfo?.id?.toString(),
        name: clinicInfo?.name,
        code: clinicInfo?.code,
        is_active: clinicInfo?.is_active,
        total_doctors: totalDoctors,
        total_frontdesk: totalFrontDesk,
        total_patients_registered: totalPatientsRegistered
      }
    };

    console.log("📦 Final Dashboard Response:", dashboard);

    res.json({ dashboard });

  } catch (error) {
    console.error("❌ Dashboard Error:", error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', message: error.message });
  }
};