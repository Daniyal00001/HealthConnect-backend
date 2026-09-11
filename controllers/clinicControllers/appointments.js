import prisma from "../../prismaClient.js";

// Get all appointments of a specific clinic

export const getAllAppointments = async (req, res) => {
  try {
    // 1️⃣ Get clinic ID from request body or fallback to user token
    const clinicIdRaw = req.body.clinic_id || req.user?.clinic_id;

    if (!clinicIdRaw) {
      return res.status(400).json({ success: false, message: "Clinic ID missing" });
    }

    const clinicId = Number(clinicIdRaw);
    if (isNaN(clinicId)) {
      return res.status(400).json({ success: false, message: "Invalid clinic ID" });
    }

    console.log("📅 Fetching appointments for clinic:", clinicId);

    // 2️⃣ Fetch appointments
    const appointments = await prisma.appointments.findMany({
      where: { clinic_id: clinicId },
      include: {
        users_appointments_doctor_user_idTousers: { select: { full_name: true } },
        users_appointments_patient_user_idTousers: { select: { full_name: true } },
      },
      orderBy: { scheduled_at: "desc" },
    });

    // 3️⃣ Compute stats
    const stats = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === "completed").length,
      scheduled: appointments.filter(a => a.status === "scheduled").length,
    };

    // 4️⃣ Clean JSON for frontend
    const cleanAppointments = appointments.map(a => ({
      id: a.id,
      scheduled_at: a.scheduled_at,
      token_number: a.token_number,
      token_date: a.token_date,
      status: a.status,
      payment_status: a.payment_status,
      appointment_fee: a.appointment_fee,
      doctor: { full_name: a.users_appointments_doctor_user_idTousers.full_name },
      patient: { full_name: a.users_appointments_patient_user_idTousers.full_name },
    }));

    // 5️⃣ Send response
    res.json({ success: true, appointments: cleanAppointments, stats });
  } catch (error) {
    console.error("❌ Error fetching appointments:", error);
    res.status(500).json({ success: false, message: "Failed to fetch appointments" });
  }
};

// Get single appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid appointment ID" });

    const appointment = await prisma.appointments.findUnique({
      where: { id },
      include: {
        users_appointments_doctor_user_idTousers: { select: { full_name: true, email: true, phone: true } },
        users_appointments_patient_user_idTousers: { select: { full_name: true, email: true, phone: true } },
      },
    });

    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    res.json({ success: true, appointment });
  } catch (error) {
    console.error("❌ Error fetching appointment:", error);
    res.status(500).json({ success: false, message: "Error fetching appointment" });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid appointment ID" });

    const updated = await prisma.appointments.update({
      where: { id },
      data: req.body,
    });

    res.json({ success: true, message: "Appointment updated successfully", updated });
  } catch (error) {
    console.error("❌ Error updating appointment:", error);
    res.status(500).json({ success: false, message: "Failed to update appointment" });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid appointment ID" });

    await prisma.appointments.delete({ where: { id } });
    res.json({ success: true, message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting appointment:", error);
    res.status(500).json({ success: false, message: "Failed to delete appointment" });
  }
};
