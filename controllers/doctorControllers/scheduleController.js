import prisma from "../../prismaClient.js";

/**
 * Get schedule for a doctor at a clinic
 * GET /api/doctor/schedule
 */
export const getSchedule = async (req, res) => {
  try {
    const doctorId = req.user?.id || req.query.doctor_id || req.body.doctor_id;
    const clinicId = req.user?.clinic_id || req.query.clinic_id || req.body.clinic_id;

    if (!doctorId || !clinicId) {
      return res.status(400).json({
        success: false,
        message: "doctor_id and clinic_id are required"
      });
    }

    const schedule = await prisma.$queryRaw`
      SELECT * FROM schedule 
      WHERE doctor_id = ${BigInt(doctorId)} 
      AND clinic_id = ${BigInt(clinicId)}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!schedule || schedule.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "No schedule found"
      });
    }

    // Parse JSON fields
    const scheduleData = schedule[0];
    const parsedSchedule = {
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

    res.json({
      success: true,
      data: parsedSchedule
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedule",
      error: error.message
    });
  }
};

/**
 * Create or update schedule for a doctor at a clinic
 * POST /api/doctor/schedule
 */
export const createOrUpdateSchedule = async (req, res) => {
  try {
    const doctorId = req.user?.id || req.body.doctor_id;
    const clinicId = req.user?.clinic_id || req.body.clinic_id;
    const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = req.body;

    if (!doctorId || !clinicId) {
      return res.status(400).json({
        success: false,
        message: "doctor_id and clinic_id are required"
      });
    }

    // Validate that all days are provided and are valid JSON
    const days = { monday, tuesday, wednesday, thursday, friday, saturday, sunday };
    for (const [day, value] of Object.entries(days)) {
      if (!value) {
        return res.status(400).json({
          success: false,
          message: `${day} is required`
        });
      }
      // Ensure it's valid JSON
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        // Validate structure: should have available boolean and slots array
        if (typeof parsed !== 'object' || parsed === null) {
          return res.status(400).json({
            success: false,
            message: `${day} must be an object`
          });
        }
        if (typeof parsed.available !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: `${day}.available must be a boolean`
          });
        }
        if (parsed.available && (!parsed.slots || !Array.isArray(parsed.slots))) {
          return res.status(400).json({
            success: false,
            message: `${day}.slots must be an array when available is true`
          });
        }
        // Validate each slot
        if (parsed.slots && Array.isArray(parsed.slots)) {
          for (const slot of parsed.slots) {
            if (!slot.startTime || !slot.endTime) {
              return res.status(400).json({
                success: false,
                message: `${day} slots must have startTime and endTime`
              });
            }
          }
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: `${day} must be valid JSON: ${e.message}`
        });
      }
    }

    // Check if schedule exists
    const existingSchedule = await prisma.$queryRaw`
      SELECT schedule_id FROM schedule 
      WHERE doctor_id = ${BigInt(doctorId)} 
      AND clinic_id = ${BigInt(clinicId)}
      LIMIT 1
    `;

    let result;
    const mondayJson = JSON.stringify(monday);
    const tuesdayJson = JSON.stringify(tuesday);
    const wednesdayJson = JSON.stringify(wednesday);
    const thursdayJson = JSON.stringify(thursday);
    const fridayJson = JSON.stringify(friday);
    const saturdayJson = JSON.stringify(saturday);
    const sundayJson = JSON.stringify(sunday);

    if (existingSchedule && existingSchedule.length > 0) {
      // Update existing schedule
      result = await prisma.$executeRaw`
        UPDATE schedule 
        SET 
          monday = CAST(${mondayJson} AS JSON),
          tuesday = CAST(${tuesdayJson} AS JSON),
          wednesday = CAST(${wednesdayJson} AS JSON),
          thursday = CAST(${thursdayJson} AS JSON),
          friday = CAST(${fridayJson} AS JSON),
          saturday = CAST(${saturdayJson} AS JSON),
          sunday = CAST(${sundayJson} AS JSON),
          updated_at = CURRENT_TIMESTAMP
        WHERE schedule_id = ${existingSchedule[0].schedule_id}
      `;

      res.json({
        success: true,
        message: "Schedule updated successfully",
        schedule_id: existingSchedule[0].schedule_id.toString()
      });
    } else {
      // Create new schedule
      result = await prisma.$executeRaw`
        INSERT INTO schedule (
          doctor_id, 
          clinic_id, 
          monday, 
          tuesday, 
          wednesday, 
          thursday, 
          friday, 
          saturday, 
          sunday
        ) VALUES (
          ${BigInt(doctorId)},
          ${BigInt(clinicId)},
          CAST(${mondayJson} AS JSON),
          CAST(${tuesdayJson} AS JSON),
          CAST(${wednesdayJson} AS JSON),
          CAST(${thursdayJson} AS JSON),
          CAST(${fridayJson} AS JSON),
          CAST(${saturdayJson} AS JSON),
          CAST(${sundayJson} AS JSON)
        )
      `;

      const newSchedule = await prisma.$queryRaw`
        SELECT schedule_id FROM schedule 
        WHERE doctor_id = ${BigInt(doctorId)} 
        AND clinic_id = ${BigInt(clinicId)}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      res.status(201).json({
        success: true,
        message: "Schedule created successfully",
        schedule_id: newSchedule[0].schedule_id.toString()
      });
    }
  } catch (error) {
    console.error("Error creating/updating schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create/update schedule",
      error: error.message
    });
  }
};

/**
 * Delete schedule for a doctor at a clinic
 * DELETE /api/doctor/schedule
 */
export const deleteSchedule = async (req, res) => {
  try {
    const doctorId = req.user?.id || req.query.doctor_id || req.body.doctor_id;
    const clinicId = req.user?.clinic_id || req.query.clinic_id || req.body.clinic_id;

    if (!doctorId || !clinicId) {
      return res.status(400).json({
        success: false,
        message: "doctor_id and clinic_id are required"
      });
    }

    const result = await prisma.$executeRaw`
      DELETE FROM schedule 
      WHERE doctor_id = ${BigInt(doctorId)} 
      AND clinic_id = ${BigInt(clinicId)}
    `;

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found"
      });
    }

    res.json({
      success: true,
      message: "Schedule deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete schedule",
      error: error.message
    });
  }
};

/**
 * Get available slots for a doctor on a specific date
 * GET /api/doctor/schedule/available-slots
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctor_id, clinic_id, day } = req.query;

    if (!doctor_id || !clinic_id || !day) {
      return res.status(400).json({
        success: false,
        message: "doctor_id, clinic_id, and day are required"
      });
    }

    // Validate day name
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayName = day.toLowerCase();
    if (!validDays.includes(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid day. Must be one of: ${validDays.join(', ')}`
      });
    }

    // doctor_id from frontend is actually user_id (from getAllDoctors)
    const doctorUserId = BigInt(doctor_id);

    // Verify doctor exists and has active profile
    const doctor = await prisma.users.findFirst({
      where: {
        id: doctorUserId,
        doctor_profiles: {
          is_active: true
        }
      },
      select: { id: true },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or inactive"
      });
    }

    // Get schedule
    const schedule = await prisma.$queryRaw`
      SELECT * FROM schedule 
      WHERE doctor_id = ${doctorUserId} 
      AND clinic_id = ${BigInt(clinic_id)}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!schedule || schedule.length === 0) {
      return res.json({
        success: true,
        available: false,
        message: "Doctor has no schedule set",
        slots: []
      });
    }

    // Parse schedule data for the requested day
    const scheduleData = schedule[0];
    const daySchedule = typeof scheduleData[dayName] === 'string' 
      ? JSON.parse(scheduleData[dayName]) 
      : scheduleData[dayName];

    if (!daySchedule || !daySchedule.available) {
      return res.json({
        success: true,
        available: false,
        message: "Doctor is not available on this day",
        slots: []
      });
    }

    // Get slots for the day
    const slots = daySchedule.slots || 
      (daySchedule.startTime && daySchedule.endTime 
        ? [{ startTime: daySchedule.startTime, endTime: daySchedule.endTime }]
        : []);

    // Get existing appointments for today to filter out booked slots
    // We need to check appointments for today since we're showing today's slots
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointments.findMany({
      where: {
        doctor_user_id: doctorUserId,
        clinic_id: BigInt(clinic_id),
        scheduled_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: 'cancelled'
        }
      },
      select: {
        scheduled_at: true,
      },
    });

    // Format existing appointments times
    const bookedTimes = existingAppointments.map(apt => {
      const aptDate = new Date(apt.scheduled_at);
      return `${String(aptDate.getHours()).padStart(2, '0')}:${String(aptDate.getMinutes()).padStart(2, '0')}`;
    });

    // Filter available slots (remove booked ones)
    const availableSlots = slots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: !bookedTimes.includes(slot.startTime)
    }));

    res.json({
      success: true,
      available: true,
      day: dayName,
      slots: availableSlots
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available slots",
      error: error.message
    });
  }
};

/**
 * Get schedule for a specific doctor (for clinic admin)
 * GET /api/clinic/schedule/:doctorId
 */
export const getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const clinicId = req.user?.clinic_id || req.query.clinic_id || req.body.clinic_id;

    if (!doctorId || !clinicId) {
      return res.status(400).json({
        success: false,
        message: "doctor_id and clinic_id are required"
      });
    }

    const schedule = await prisma.$queryRaw`
      SELECT * FROM schedule 
      WHERE doctor_id = ${BigInt(doctorId)} 
      AND clinic_id = ${BigInt(clinicId)}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!schedule || schedule.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "No schedule found"
      });
    }

    // Parse JSON fields
    const scheduleData = schedule[0];
    const parsedSchedule = {
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

    res.json({
      success: true,
      data: parsedSchedule
    });
  } catch (error) {
    console.error("Error fetching doctor schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor schedule",
      error: error.message
    });
  }
};

