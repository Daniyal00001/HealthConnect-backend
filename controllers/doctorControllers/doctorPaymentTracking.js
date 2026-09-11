import prisma from "../../prismaClient.js";

/**
 * Doctor Payment Tracking Controller
 * Provides earnings breakdown and payment status for doctors
 * Returns data for all periods: today, weekly, monthly, overall
 */
export const getDoctorPayments = async (req, res) => {
  console.log("💰 getDoctorPayments called");
  try {
    const { doctor_id, clinic_id } = req.query;

    if (!doctor_id || !clinic_id) {
      return res.status(400).json({ 
        message: "Doctor ID and Clinic ID are required" 
      });
    }

    const doctorId = BigInt(doctor_id);
    const clinicId = BigInt(clinic_id);

    // Helper function to parse decimal to float
    const parseAmount = (value) => parseFloat(value) || 0;

    // Helper function to format appointment data
    const formatAppointment = (apt) => ({
      id: apt.id.toString(),
      token_number: apt.token_number,
      token_date: apt.token_date,
      patient_name: apt.users_appointments_patient_user_idTousers?.full_name || null,
      patient_phone: apt.users_appointments_patient_user_idTousers?.phone || null,
      doctor_name: apt.users_appointments_doctor_user_idTousers?.full_name || null,
      clinic_name: apt.clinics?.name || null,
      scheduled_at: apt.scheduled_at,
      status: apt.status,
      payment_status: apt.payment_status,
      appointment_fee: parseAmount(apt.appointment_fee)
    });

    // Helper function to calculate date ranges for each period
    const getDateRange = (period, now) => {
      let startDate = null;
      let endDate = null;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 1);
          break;
        
        case 'weekly':
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate = new Date(now);
          startDate.setDate(now.getDate() - daysToMonday);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          break;
        
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        
        case 'overall':
          startDate = null;
          endDate = null;
          break;
      }

      return { startDate, endDate };
    };

    // Helper function to process period data
    const processPeriodData = async (period) => {
      const now = new Date();
      const { startDate, endDate } = getDateRange(period, now);

      // Build date filter for where clause
      const dateFilter = startDate && endDate 
        ? { token_date: { gte: startDate, lt: endDate } }
        : {};

      // Get period earnings (completed appointments)
      const periodEarnings = await prisma.appointments.aggregate({
        _sum: { appointment_fee: true },
        where: {
          doctor_user_id: doctorId,
          clinic_id: clinicId,
          status: 'completed',
          appointment_fee: { not: null },
          ...dateFilter
        }
      });

      // Get pending earnings (scheduled, checked_in, in_consult)
      const pendingDateFilter = period === 'overall' 
        ? {} 
        : (startDate && endDate ? { token_date: { gte: startDate, lt: endDate } } : {});
      
      const pendingTokens = await prisma.appointments.findMany({
        where: {
          doctor_user_id: doctorId,
          clinic_id: clinicId,
          status: { in: ['scheduled', 'checked_in', 'in_consult'] },
          appointment_fee: { not: null },
          ...pendingDateFilter
        },
        select: { appointment_fee: true }
      });

      const pendingEarnings = pendingTokens.reduce((sum, apt) => 
        sum + parseAmount(apt.appointment_fee), 0);

      // Get period appointments
      const periodAppointments = await prisma.appointments.findMany({
        where: {
          doctor_user_id: doctorId,
          clinic_id: clinicId,
          ...dateFilter
        },
        include: {
          users_appointments_patient_user_idTousers: {
            select: {
              id: true,
              full_name: true,
              phone: true
            }
          },
          clinics: {
            select: {
              name: true
            }
          },
          users_appointments_doctor_user_idTousers: {
            select: {
              full_name: true
            }
          }
        },
        orderBy: [
          { token_date: 'desc' },
          { token_number: 'asc' }
        ]
      });

      // Categorize appointments by payment status
      const paidAppointments = periodAppointments.filter(apt => apt.payment_status === 'paid');
      const unpaidAppointments = periodAppointments.filter(apt => apt.payment_status === 'unpaid');
      const partialAppointments = periodAppointments.filter(apt => apt.payment_status === 'partial');

      // Calculate earnings breakdown
      const paidEarnings = paidAppointments.reduce((sum, apt) => 
        sum + parseAmount(apt.appointment_fee), 0);
      const unpaidEarnings = unpaidAppointments.reduce((sum, apt) => 
        sum + parseAmount(apt.appointment_fee), 0);
      const partialEarnings = partialAppointments.reduce((sum, apt) => 
        sum + parseAmount(apt.appointment_fee), 0);

      return {
        period,
        period_range: startDate && endDate ? {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        } : null,
        earnings: {
          total: parseAmount(periodEarnings._sum.appointment_fee),
          pending: pendingEarnings
        },
        earningsBreakdown: {
          paid: paidEarnings,
          unpaid: unpaidEarnings,
          partial: partialEarnings,
          total: parseAmount(periodEarnings._sum.appointment_fee)
        },
        appointments: {
          paid: paidAppointments.map(formatAppointment),
          unpaid: unpaidAppointments.map(formatAppointment),
          partial: partialAppointments.map(formatAppointment),
          summary: {
            total: periodAppointments.length,
            paid: paidAppointments.length,
            unpaid: unpaidAppointments.length,
            partial: partialAppointments.length,
            completed: periodAppointments.filter(apt => apt.status === 'completed').length,
            pending: periodAppointments.filter(apt => ['scheduled', 'checked_in', 'in_consult'].includes(apt.status)).length
          }
        }
      };
    };

    // Process all periods in parallel
    const periods = ['today', 'weekly', 'monthly', 'overall'];
    const periodData = await Promise.all(
      periods.map(period => processPeriodData(period))
    );

    // Build response with all periods
    const response = {
      doctor_id: doctor_id,
      clinic_id: clinic_id,
      periods: {
        today: periodData.find(p => p.period === 'today'),
        weekly: periodData.find(p => p.period === 'weekly'),
        monthly: periodData.find(p => p.period === 'monthly'),
        overall: periodData.find(p => p.period === 'overall')
      }
    };

    console.log("💰 Doctor Payment Tracking - All Periods:", {
      todayEarnings: response.periods.today.earnings.total,
      weeklyEarnings: response.periods.weekly.earnings.total,
      monthlyEarnings: response.periods.monthly.earnings.total,
      overallEarnings: response.periods.overall.earnings.total
    });

    res.status(200).json({
      message: "Doctor payment tracking retrieved successfully",
      data: response
    });
  } catch (error) {
    console.error("Error fetching doctor payments:", error);
    res.status(500).json({ 
      message: "Error fetching doctor payment tracking", 
      error: error.message 
    });
  }
};

