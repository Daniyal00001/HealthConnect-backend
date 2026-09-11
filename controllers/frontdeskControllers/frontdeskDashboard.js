import prisma from "../../prismaClient.js";

export const getFrontDeskDashboard = async (req, res) => {
  console.log("🔍 getFrontDeskDashboard called");
  console.log("📋 Query params:", req.query);
  console.log("📋 Body:", req.body);
  console.log("📋 req.user:", req.user);
  try {
    // Get clinic_id from query params, body, or authenticated user
    const clinicIdParam = req.query.clinic_id || req.body.clinic_id || req.user?.clinic_id;
    
    if (!clinicIdParam) {
      console.log("❌ Missing clinic_id");
      return res.status(400).json({ 
        message: "clinic_id is required" 
      });
    }

    const clinicId = BigInt(clinicIdParam);
    console.log("✅ Using clinicId (BigInt):", clinicId.toString());

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

    console.log(`📅 Date ranges for calculations:`);
    console.log(`   Today: ${startOfToday.toISOString().split('T')[0]}`);
    console.log(`   Week: ${startOf7Days.toISOString().split('T')[0]} to ${endOf7Days.toISOString().split('T')[0]}`);
    console.log(`   Month: ${startOfMonth.toISOString().split('T')[0]} to ${endOfMonth.toISOString().split('T')[0]}`);

    // Helper function to extract date only from datetime (compare dates, not times)
    const getDateOnly = (date) => {
      const d = new Date(date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    // Helper function to parse decimal to float
    const parseAmount = (value) => parseFloat(value) || 0;

    // Get ALL appointments for this clinic with created_at and token_date fields
    const allAppointments = await prisma.appointments.findMany({
      where: {
        clinic_id: clinicId
      },
      select: {
        id: true,
        status: true,
        payment_status: true,
        patient_user_id: true,
        created_at: true,
        appointment_fee: true,
        token_date: true
      }
    });

    console.log(`📊 Total appointments found in DB: ${allAppointments.length}`);
    console.log(`📊 Appointments by status:`, allAppointments.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {}));
    console.log(`📊 Appointments by payment_status:`, allAppointments.reduce((acc, app) => {
      acc[app.payment_status] = (acc[app.payment_status] || 0) + 1;
      return acc;
    }, {}));
    console.log(`📊 Paid appointments: ${allAppointments.filter(app => app.payment_status === 'paid').length}`);

    // Filter appointments by date
    // For "today": Use token_date (appointment date) - shows appointments scheduled for today
    // For "week" and "month": Use created_at (booking date) - shows appointments booked in that period
    const todayAppointments = allAppointments.filter(app => {
      // Use token_date for today's filter - shows appointments scheduled for today
      if (app.token_date) {
        const appointmentTokenDate = getDateOnly(app.token_date);
        const todayDate = getDateOnly(currentDate);
        return appointmentTokenDate.getTime() === todayDate.getTime();
      }
      // Fallback to created_at if token_date is null
      const appointmentCreatedDate = getDateOnly(app.created_at);
      const todayDate = getDateOnly(currentDate);
      return appointmentCreatedDate.getTime() === todayDate.getTime();
    });

    const weeklyAppointments = allAppointments.filter(app => {
      // Use created_at for week/month filters - shows appointments booked in that period
      const appointmentCreatedDate = getDateOnly(app.created_at);
      return appointmentCreatedDate >= startOf7Days && appointmentCreatedDate < endOf7Days;
    });

    const monthlyAppointments = allAppointments.filter(app => {
      // Use created_at for week/month filters - shows appointments booked in that period
      const appointmentCreatedDate = getDateOnly(app.created_at);
      return appointmentCreatedDate >= startOfMonth && appointmentCreatedDate < endOfMonth;
    });

    console.log(`📊 Appointments filtered by date:`);
    console.log(`   Today: ${todayAppointments.length} appointments (token_date = ${currentDate.toISOString().split('T')[0]})`);
    console.log(`   Week: ${weeklyAppointments.length} appointments (created_at between ${startOf7Days.toISOString().split('T')[0]} and ${endOf7Days.toISOString().split('T')[0]})`);
    console.log(`   Month: ${monthlyAppointments.length} appointments (created_at between ${startOfMonth.toISOString().split('T')[0]} and ${endOfMonth.toISOString().split('T')[0]})`);

    // ========== TOTAL PATIENTS (Appointments) ==========
    const totalPatientsToday = todayAppointments.length;
    const totalPatientsWeek = weeklyAppointments.length;
    const totalPatientsMonth = monthlyAppointments.length;
    const totalPatientsOverall = allAppointments.length;

    // ========== PENDING TOKENS ==========
    const pendingTokensToday = todayAppointments.filter(
      app => ['scheduled', 'checked_in', 'in_consult'].includes(app.status)
    ).length;

    const pendingTokensWeek = weeklyAppointments.filter(
      app => ['scheduled', 'checked_in', 'in_consult'].includes(app.status)
    ).length;

    const pendingTokensMonth = monthlyAppointments.filter(
      app => ['scheduled', 'checked_in', 'in_consult'].includes(app.status)
    ).length;

    const pendingTokensOverall = allAppointments.filter(
      app => ['scheduled', 'checked_in', 'in_consult'].includes(app.status)
    ).length;

    // ========== COMPLETED APPOINTMENTS ==========
    const completedToday = todayAppointments.filter(
      app => app.status === 'completed'
    ).length;

    const completedWeek = weeklyAppointments.filter(
      app => app.status === 'completed'
    ).length;

    const completedMonth = monthlyAppointments.filter(
      app => app.status === 'completed'
    ).length;

    const completedOverall = allAppointments.filter(
      app => app.status === 'completed'
    ).length;

    // ========== PAID APPOINTMENTS ==========
    const paidToday = todayAppointments.filter(
      app => app.payment_status === 'paid'
    ).length;

    const paidWeek = weeklyAppointments.filter(
      app => app.payment_status === 'paid'
    ).length;

    const paidMonth = monthlyAppointments.filter(
      app => app.payment_status === 'paid'
    ).length;

    const paidOverall = allAppointments.filter(
      app => app.payment_status === 'paid'
    ).length;

    // ========== NEW REGISTRATIONS (Unique Patients) ==========
    // Get unique patient IDs from appointments
    const uniquePatientsToday = new Set(
      todayAppointments.map(app => app.patient_user_id.toString())
    ).size;

    const uniquePatientsWeek = new Set(
      weeklyAppointments.map(app => app.patient_user_id.toString())
    ).size;

    const uniquePatientsMonth = new Set(
      monthlyAppointments.map(app => app.patient_user_id.toString())
    ).size;

    const uniquePatientsOverall = new Set(
      allAppointments.map(app => app.patient_user_id.toString())
    ).size;

    // ========== TOTAL PAYMENTS (Earnings) ==========
    // Calculate earnings from paid appointments only
    // IMPORTANT: Only count earnings for appointments with payment_status === 'paid'
    const earningsToday = todayAppointments
      .filter(app => app.payment_status === 'paid' && app.appointment_fee !== null)
      .reduce((sum, apt) => sum + parseAmount(apt.appointment_fee), 0);

    const earningsWeek = weeklyAppointments
      .filter(app => app.payment_status === 'paid' && app.appointment_fee !== null)
      .reduce((sum, apt) => sum + parseAmount(apt.appointment_fee), 0);

    const earningsMonth = monthlyAppointments
      .filter(app => app.payment_status === 'paid' && app.appointment_fee !== null)
      .reduce((sum, apt) => sum + parseAmount(apt.appointment_fee), 0);

    const earningsOverall = allAppointments
      .filter(app => app.payment_status === 'paid' && app.appointment_fee !== null)
      .reduce((sum, apt) => sum + parseAmount(apt.appointment_fee), 0);

    console.log(`💰 Earnings calculation (based on payment_status='paid' and created_at date ranges):`);
    console.log(`   Today (${currentDate.toISOString().split('T')[0]}): ${earningsToday} (from ${todayAppointments.filter(app => app.payment_status === 'paid').length} paid appointments)`);
    console.log(`   Week (${startOf7Days.toISOString().split('T')[0]} to ${endOf7Days.toISOString().split('T')[0]}): ${earningsWeek} (from ${weeklyAppointments.filter(app => app.payment_status === 'paid').length} paid appointments)`);
    console.log(`   Month (${startOfMonth.toISOString().split('T')[0]} to ${endOfMonth.toISOString().split('T')[0]}): ${earningsMonth} (from ${monthlyAppointments.filter(app => app.payment_status === 'paid').length} paid appointments)`);
    console.log(`   Overall: ${earningsOverall} (from ${allAppointments.filter(app => app.payment_status === 'paid').length} paid appointments)`);
    
    // Show sample paid appointments for each period to verify date filtering
    const paidTodaySample = todayAppointments.filter(app => app.payment_status === 'paid').slice(0, 3);
    const paidWeekSample = weeklyAppointments.filter(app => app.payment_status === 'paid').slice(0, 3);
    if (paidTodaySample.length > 0) {
      console.log(`   Sample paid appointments today:`, paidTodaySample.map(apt => ({
        id: apt.id.toString(),
        created_at: apt.created_at,
        fee: apt.appointment_fee
      })));
    }
    if (paidWeekSample.length > 0) {
      console.log(`   Sample paid appointments this week:`, paidWeekSample.map(apt => ({
        id: apt.id.toString(),
        created_at: apt.created_at,
        fee: apt.appointment_fee
      })));
    }

    // ========== RECENT REGISTRATIONS ==========
    // Get unique patient IDs from all appointments
    const clinicPatientUserIds = [...new Set(allAppointments.map(apt => apt.patient_user_id))];
    
    // Only show patients who have appointments at this clinic
    const recentRegistrations = clinicPatientUserIds.length > 0 ? await prisma.users.findMany({
      where: {
        id: { in: clinicPatientUserIds },
        patient_profiles: { isNot: null }
      },
      include: {
        patient_profiles: {
          select: {
            id: true,
            medical_record_no: true,
            blood_group: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    }) : [];

    // ========== RECENT PAYMENTS ==========
    // Only show payments from paid appointments
    const recentPayments = await prisma.appointments.findMany({
      where: {
        clinic_id: clinicId,
        payment_status: 'paid', // Only show paid appointments
        appointment_fee: { not: null } // Only show appointments with fees
      },
      include: {
        users_appointments_patient_user_idTousers: {
          select: { full_name: true }
        },
        clinics: {
          select: { name: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    // Format response - matching doctor dashboard structure
    const response = {
      today: {
        total_patients: uniquePatientsToday,
        total_appointments: totalPatientsToday,
        completed_appointments: completedToday,
        pending_appointments: pendingTokensToday,
        earnings: earningsToday
      },
      this_week: {
        total_patients: uniquePatientsWeek,
        total_appointments: totalPatientsWeek,
        completed_appointments: completedWeek,
        pending_appointments: pendingTokensWeek,
        earnings: earningsWeek
      },
      this_month: {
        total_patients: uniquePatientsMonth,
        total_appointments: totalPatientsMonth,
        completed_appointments: completedMonth,
        pending_appointments: pendingTokensMonth,
        earnings: earningsMonth
      },
      overall: {
        total_patients: uniquePatientsOverall,
        total_appointments: totalPatientsOverall,
        completed_appointments: completedOverall,
        pending_appointments: pendingTokensOverall,
        total_earnings: earningsOverall
      },
      // Keep old structure for backward compatibility
      totalPatients: {
        today: totalPatientsToday,
        weekly: totalPatientsWeek,
        monthly: totalPatientsMonth,
        overall: totalPatientsOverall
      },
      pendingTokens: {
        today: pendingTokensToday,
        weekly: pendingTokensWeek,
        monthly: pendingTokensMonth,
        overall: pendingTokensOverall
      },
      newRegistrations: {
        today: uniquePatientsToday,
        weekly: uniquePatientsWeek,
        monthly: uniquePatientsMonth,
        overall: uniquePatientsOverall
      },
      totalPayments: {
        today: earningsToday,
        weekly: earningsWeek,
        monthly: earningsMonth,
        overall: earningsOverall
      },
      recentRegistrations: recentRegistrations.map(user => ({
        id: user.id.toString(),
        full_name: user.full_name,
        email: user.email || null,
        phone: user.phone || null,
        dob: user.dob || null,
        gender: user.gender || null,
        medical_record_no: user.patient_profiles?.medical_record_no || null,
        blood_group: user.patient_profiles?.blood_group || null,
        is_active: user.is_active,
        created_at: user.created_at,
        registered_at: user.created_at
      })),
      recentPayments: recentPayments.map(apt => ({
        id: apt.id.toString(),
        clinic_id: apt.clinic_id.toString(),
        clinic_name: apt.clinics?.name || null,
        patient_name: apt.users_appointments_patient_user_idTousers?.full_name || 'Unknown',
        amount: parseAmount(apt.appointment_fee),
        token_number: apt.token_number,
        token_date: apt.token_date,
        payment_status: apt.payment_status,
        status: apt.status,
        scheduled_at: apt.scheduled_at,
        created_at: apt.created_at,
      }))
    };

    console.log("📊 Frontdesk Dashboard Response:");
    console.log(`   Today: ${response.today.total_appointments} appointments, ${response.today.completed_appointments} completed, ${response.today.earnings} earnings`);
    console.log(`   This Week: ${response.this_week.total_appointments} appointments, ${response.this_week.completed_appointments} completed, ${response.this_week.earnings} earnings`);
    console.log(`   This Month: ${response.this_month.total_appointments} appointments, ${response.this_month.completed_appointments} completed, ${response.this_month.earnings} earnings`);
    console.log(`   Overall: ${response.overall.total_appointments} appointments, ${response.overall.completed_appointments} completed, ${response.overall.total_earnings} earnings`);

    res.json(response);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard data", error: err.message });
  }
};