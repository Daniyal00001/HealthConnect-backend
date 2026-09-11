// controllers/frontdeskControllers/updateAppointment.js
import prisma from "../../prismaClient.js";

export const updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const {
      scheduledAt,
      doctorId,
      appointmentFee,
      paymentStatus,
      paymentMethod,
      tokenNumber,
      notes,
      status
    } = req.body;

    const clinicId = req.user.clinic_id;
    const userId = req.user.id;

    console.log('=== Update Appointment Request ===');
    console.log('Appointment ID:', appointmentId);
    console.log('Clinic ID:', clinicId);
    console.log('User ID:', userId);
    console.log('Body:', req.body);

    // 1. Verify appointment exists and belongs to this clinic
    const existingAppointment = await prisma.appointments.findFirst({
      where: {
        id: BigInt(appointmentId),
        clinic_id: BigInt(clinicId)
      },
      include: {
        clinic_sales: true
      }
    });

    if (!existingAppointment) {
      console.log('❌ Appointment not found or access denied');
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or access denied'
      });
    }

    console.log('✅ Existing appointment found:', existingAppointment.id.toString());

    // 2. Prepare update data
    const updateData = {};

    if (scheduledAt) {
      updateData.scheduled_at = new Date(scheduledAt);
      
      // Update token_date if scheduledAt is provided
      const schedDate = new Date(scheduledAt);
      updateData.token_date = new Date(
        schedDate.getFullYear(),
        schedDate.getMonth(),
        schedDate.getDate()
      );
    }

    if (doctorId) {
      console.log('Verifying doctor ID:', doctorId);
      
      // Get doctor role_id dynamically
      const doctorRole = await prisma.roles.findFirst({
        where: { name: "doctor" }
      });

      if (!doctorRole) {
        console.log('❌ Doctor role not found in database');
        return res.status(500).json({
          success: false,
          message: 'Doctor role not configured in system'
        });
      }

      console.log('Doctor role_id:', doctorRole.id);

      // Verify doctor belongs to this clinic
      const doctor = await prisma.users.findFirst({
        where: {
          id: BigInt(doctorId),
          clinic_user_roles: {
            some: {
              clinic_id: BigInt(clinicId),
              role_id: doctorRole.id // Use dynamic role_id
            }
          }
        }
      });

      if (!doctor) {
        console.log('❌ Doctor not found or not assigned to this clinic');
        console.log('Searched for doctor_id:', doctorId, 'in clinic_id:', clinicId.toString());
        return res.status(400).json({
          success: false,
          message: 'Invalid doctor selected for this clinic'
        });
      }

      updateData.doctor_user_id = BigInt(doctorId);
      console.log('✅ Doctor verified:', doctorId);
    }

    if (appointmentFee !== undefined && appointmentFee !== null) {
      updateData.appointment_fee = parseFloat(appointmentFee);
    }

    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }

    if (tokenNumber !== undefined && tokenNumber !== null) {
      updateData.token_number = parseInt(tokenNumber);
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    if (status) {
      updateData.status = status;
    }

    updateData.updated_at = new Date();

    console.log('Update data prepared:', updateData);

    // 3. Update appointment
    const updatedAppointment = await prisma.appointments.update({
      where: {
        id: BigInt(appointmentId)
      },
      data: updateData,
      include: {
        users_appointments_doctor_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        users_appointments_patient_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true
          }
        },
        clinics: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('✅ Appointment updated successfully');

    // 4. Update or create clinic_sales record if payment info changed
    if (paymentMethod || appointmentFee !== undefined || paymentStatus) {
      const existingSale = existingAppointment.clinic_sales[0];
      
      if (existingSale) {
        // Update existing sale
        const saleUpdateData = {};
        
        if (appointmentFee !== undefined && appointmentFee !== null) {
          saleUpdateData.amount = parseFloat(appointmentFee);
        }
        
        if (paymentMethod) {
          saleUpdateData.payment_method = paymentMethod;
        }
        
        if (paymentStatus) {
          saleUpdateData.status = paymentStatus === 'paid' ? 'completed' : 'pending';
        }

        if (Object.keys(saleUpdateData).length > 0) {
          await prisma.clinic_sales.update({
            where: {
              id: existingSale.id
            },
            data: saleUpdateData
          });
          console.log('✅ Sales record updated');
        }
      } else if (appointmentFee && paymentMethod) {
        // Create new sale record
        await prisma.clinic_sales.create({
          data: {
            clinic_id: BigInt(clinicId),
            appointment_id: BigInt(appointmentId),
            patient_user_id: existingAppointment.patient_user_id,
            created_by: BigInt(userId),
            amount: parseFloat(appointmentFee),
            payment_method: paymentMethod || 'cash',
            status: paymentStatus === 'paid' ? 'completed' : 'pending',
            notes: notes || null
          }
        });
        console.log('✅ New sales record created');
      }
    }

    // 5. Format response
    const formattedAppointment = {
      id: updatedAppointment.id.toString(),
      scheduledAt: updatedAppointment.scheduled_at,
      tokenNumber: updatedAppointment.token_number,
      status: updatedAppointment.status,
      paymentStatus: updatedAppointment.payment_status,
      appointmentFee: updatedAppointment.appointment_fee 
        ? parseFloat(updatedAppointment.appointment_fee) 
        : null,
      notes: updatedAppointment.notes,
      doctorName: updatedAppointment.users_appointments_doctor_user_idTousers?.full_name,
      doctorId: updatedAppointment.doctor_user_id.toString(),
      clinicName: updatedAppointment.clinics?.name,
      patientName: updatedAppointment.users_appointments_patient_user_idTousers?.full_name
    };

    console.log('=== Response ===');
    console.log(formattedAppointment);

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: formattedAppointment
    });

  } catch (error) {
    console.error('❌ Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
};