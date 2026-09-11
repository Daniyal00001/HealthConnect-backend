import prisma from "../../prismaClient.js";

// ------------------
// ADD SAMPLE REVENUE DATA
// ------------------
export const addSampleRevenueData = async (req, res) => {
  console.log("💰 addSampleRevenueData called");
  try {
    const { clinic_id } = req.query;

    if (!clinic_id) {
      return res.status(400).json({ 
        message: "Clinic ID is required" 
      });
    }

    // Get completed appointments for this clinic
    const completedAppointments = await prisma.appointments.findMany({
      where: {
        clinic_id: BigInt(clinic_id),
        status: 'completed'
      },
      select: {
        id: true,
        patient_user_id: true,
        scheduled_at: true
      }
    });

    console.log(`🔍 Found ${completedAppointments.length} completed appointments`);

    if (completedAppointments.length === 0) {
      return res.status(404).json({
        message: "No completed appointments found to add revenue data"
      });
    }

    // Update appointments with sample fees
    const sampleAmounts = [500, 750, 1000, 1200, 800]; // Sample fee amounts
    const paymentStatuses = ['paid', 'unpaid', 'partial'];

    let updatedCount = 0;
    let totalAmount = 0;

    for (let i = 0; i < completedAppointments.length; i++) {
      const appointment = completedAppointments[i];
      const amount = sampleAmounts[i % sampleAmounts.length];
      const paymentStatus = paymentStatuses[i % paymentStatuses.length];

      try {
        await prisma.appointments.update({
          where: { id: appointment.id },
          data: {
            appointment_fee: amount,
            payment_status: paymentStatus
          }
        });
        updatedCount++;
        totalAmount += amount;
        console.log(`✅ Updated appointment ${appointment.id} with fee ${amount} and status ${paymentStatus}`);
      } catch (error) {
        console.log(`❌ Failed to update appointment ${appointment.id}:`, error.message);
      }
    }

    console.log(`✅ Updated ${updatedCount} appointments with sample fees`);

    res.status(200).json({
      message: "Sample appointment fees added successfully",
      updated_appointments: updatedCount,
      total_amount: totalAmount,
      appointments_updated: completedAppointments.slice(0, updatedCount).map(app => ({
        appointment_id: app.id,
        patient_id: app.patient_user_id,
        scheduled_at: app.scheduled_at
      }))
    });

  } catch (error) {
    console.error("Error adding sample revenue data:", error);
    res.status(500).json({ 
      message: "Error adding sample revenue data", 
      error: error.message 
    });
  }
};

// ------------------
// GET REVENUE DATA STATUS
// ------------------
export const getRevenueDataStatus = async (req, res) => {
  console.log("📊 getRevenueDataStatus called");
  try {
    const { clinic_id } = req.query;

    if (!clinic_id) {
      return res.status(400).json({ 
        message: "Clinic ID is required" 
      });
    }

    // Check appointments table
    const appointmentsCount = await prisma.appointments.count({
      where: {
        clinic_id: BigInt(clinic_id)
      }
    });

    const completedAppointmentsCount = await prisma.appointments.count({
      where: {
        clinic_id: BigInt(clinic_id),
        status: 'completed'
      }
    });

    // Check appointment_fee data
    const appointmentsWithFees = await prisma.appointments.count({
      where: {
        clinic_id: BigInt(clinic_id),
        appointment_fee: {
          not: null
        }
      }
    });

    const completedAppointmentsWithFees = await prisma.appointments.count({
      where: {
        clinic_id: BigInt(clinic_id),
        status: 'completed',
        appointment_fee: {
          not: null
        }
      }
    });

    // Check if appointment_fee column exists
    let appointmentFeeExists = false;
    try {
      await prisma.appointments.findFirst({
        where: {
          clinic_id: BigInt(clinic_id),
          appointment_fee: {
            not: null
          }
        }
      });
      appointmentFeeExists = true;
    } catch (error) {
      appointmentFeeExists = false;
    }

    // Get total revenue from appointment_fee
    const totalRevenue = await prisma.appointments.aggregate({
      where: {
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

    const status = {
      clinic_id,
      appointments: {
        total: appointmentsCount,
        completed: completedAppointmentsCount,
        with_fees: appointmentsWithFees,
        completed_with_fees: completedAppointmentsWithFees
      },
      revenue: {
        total_revenue: totalRevenue._sum.appointment_fee || 0,
        source: 'appointment_fee_column'
      },
      appointment_fee_column_exists: appointmentFeeExists,
      recommendations: []
    };

    // Add recommendations
    if (!appointmentFeeExists) {
      status.recommendations.push("Add appointment_fee column to appointments table");
    }

    if (completedAppointmentsCount > 0 && completedAppointmentsWithFees === 0) {
      status.recommendations.push("Add appointment_fee values to completed appointments");
    }

    if (completedAppointmentsCount === 0) {
      status.recommendations.push("Complete some appointments to generate revenue data");
    }

    console.log(`📊 Revenue data status for clinic ${clinic_id}:`, status);

    res.status(200).json({
      message: "Revenue data status retrieved successfully",
      status
    });

  } catch (error) {
    console.error("Error getting revenue data status:", error);
    res.status(500).json({ 
      message: "Error getting revenue data status", 
      error: error.message 
    });
  }
};
