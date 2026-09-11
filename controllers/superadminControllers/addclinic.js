import prisma from "../../prismaClient.js";
import bcrypt from "bcrypt";










//import prisma from "../../prismaClient.js";

export const getMetrics = async (req, res) => {
    try {
        // Get counts for different metrics
        const totalClinics = await prisma.clinics.count();
        const totalDoctorProfiles = await prisma.doctor_profiles.count();
        const totalPatientProfiles = await prisma.patient_profiles.count();

        // Format the response to match your frontend expectations
        // Note: Total Users has been removed as requested
        const metrics = [
            {
                title: "Total Clinics",
                value: totalClinics,
                change: `${totalClinics} active clinics`
            },
            {
                title: "Total Doctors",
                value: totalDoctorProfiles,
                change: `${totalDoctorProfiles} doctor profiles`
            },
            {
                title: "Total Patients",
                value: totalPatientProfiles,
                change: `${totalPatientProfiles} patient profiles`
            }
        ];

        console.log("Metrics data:", metrics);
        
        return res.status(200).json(metrics);
    } catch (err) {
        console.error("Error retrieving metrics:", err);
        return res.status(500).json({ 
            message: "Error retrieving metrics", 
            error: err.message 
        });
    }
};

// ------------------
// ADD CLINIC WITH ADMIN USER
// ------------------
export const addClinic = async (req, res) => {
  console.log("addClinic called");
  try {
    const {
      // Clinic details
      name,
      code,
      address,
      phone,
      is_active = true,
      // Admin user details
      admin_email,
      admin_password,
      admin_full_name,
      admin_phone,
    } = req.body;

    // ✅ Validate required fields
    if (!name) {
      return res.status(400).json({ message: "Clinic name is required." });
    }
    if (!address) {
      return res.status(400).json({ message: "Clinic address is required." });
    }
    
    // Validate phone number (digits and optional + only, max length 15)
    // Allow + at the start, followed by digits
    const phoneRegex = /^\+?\d{9,15}$/;
    if (phone && !phoneRegex.test(phone)) {
        return res.status(400).json({ message: "Phone number must be 9-15 digits and can start with +." });
    }

    if (!admin_email || !admin_password || !admin_full_name) {
      return res.status(400).json({ 
        message: "Admin email, password, and full name are required." 
      });
    }

    if (admin_password.length > 8) {
      return res.status(400).json({
        message: "Admin password must not exceed 8 characters."
      });
    }

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: admin_email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Check if clinic name already exists
    const existingClinicName = await prisma.clinics.findFirst({
        where: { name },
    });
    if (existingClinicName) {
        return res.status(400).json({ message: "Clinic name already exists." });
    }

    // Check if clinic address already exists
    const existingClinicAddress = await prisma.clinics.findFirst({
        where: { address },
    });
    if (existingClinicAddress) {
        return res.status(400).json({ message: "Clinic address already exists." });
    }

    // Get clinic_admin role
    const clinicAdminRole = await prisma.roles.findUnique({
      where: { name: "clinic_admin" },
    });
    if (!clinicAdminRole) {
      return res.status(500).json({ 
        message: "Clinic admin role not found. Please seed roles first." 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(admin_password, 10);

    // 🔥 Transaction: Create user, clinic, and assign role
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create admin user
      const adminUser = await tx.users.create({
        data: {
          email: admin_email,
          password_hash: hashedPassword,
          full_name: admin_full_name,
          phone: admin_phone || null,
          is_active: true,
        },
      });

      // 2. Create clinic with owner
      const clinic = await tx.clinics.create({
        data: {
          name,
          code: code || `CLN-${Date.now()}`,
          address: address || null,
          phone: phone || null,
          owner_user_id: adminUser.id,
          is_active: is_active,
        },
      });

      // 3. Assign clinic_admin role to user for this clinic
      await tx.clinic_user_roles.create({
        data: {
          clinic_id: clinic.id,
          user_id: adminUser.id,
          role_id: clinicAdminRole.id,
        },
      });

      return { clinic, adminUser };
    });

    res.status(201).json({
      message: "Clinic and admin of clinic created successfully.",
      clinic: {
        id: result.clinic.id,
        name: result.clinic.name,
        code: result.clinic.code,
      },
      admin: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        full_name: result.adminUser.full_name,
      },
    });
  } catch (error) {
    console.error("Error adding clinic:", error);
    res.status(500).json({
      message: "Error adding clinic",
      error: error.message,
    });
  }
};

// ------------------
// GET ALL CLINICS
// ------------------
export const getAllClinics = async (req, res) => {
  console.log("getAllClinics called");
  try {
    const clinics = await prisma.clinics.findMany({
      where: {
        name: {
          not: "Clinic Name"
        }
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            clinic_sales: true,
            clinic_user_roles: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json(clinics);
  } catch (error) {
    console.error("Error fetching clinics:", error);
    res.status(500).json({
      message: "Error fetching clinics",
      error: error.message,
    });
  }
};

// ------------------
// GET SINGLE CLINIC
// ------------------
export const getClinic = async (req, res) => {
  console.log("getClinic called");
  try {
    const { id } = req.params;

    // Validate that id is a valid number before converting to BigInt
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        message: "Invalid clinic ID. ID must be a valid number." 
      });
    }

    const clinic = await prisma.clinics.findUnique({
      where: { id: BigInt(id) },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        clinic_user_roles: {
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
            roles: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            clinic_sales: true,
            clinic_user_roles: true,
          },
        },
      },
    });

    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    res.status(200).json(clinic);
  } catch (error) {
    console.error("Error fetching clinic:", error);
    res.status(500).json({
      message: "Error fetching clinic",
      error: error.message,
    });
  }
};

// ------------------
// GET CLINIC DETAILS (SUPER ADMIN)
// ------------------
export const getClinicDetails = async (req, res) => {
  console.log("getClinicDetails called");
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "Invalid clinic ID. ID must be a valid number.",
      });
    }

    const clinicId = BigInt(id);

    const clinic = await prisma.clinics.findUnique({
      where: { id: clinicId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    const staffAssignments = await prisma.clinic_user_roles.findMany({
      where: { clinic_id: clinicId },
      include: {
        roles: { select: { name: true } },
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            is_active: true,
            doctor_profiles: {
              select: {
                specialization: true,
                qualifications: true,
                license_no: true,
                is_active: true,
              },
            },
            front_desk_staff: {
              select: {
                shift: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        assigned_at: "asc",
      },
    });

    const doctors = staffAssignments
      .filter((assignment) => assignment.roles?.name === "doctor")
      .map((assignment) => {
        const user = assignment.users;
        return {
          id: user?.id?.toString() ?? assignment.user_id.toString(),
          name: user?.full_name || "Unknown Doctor",
          email: user?.email || null,
          phone: user?.phone || null,
          is_active: user?.is_active ?? false,
          specialization: user?.doctor_profiles?.specialization || null,
          qualifications: user?.doctor_profiles?.qualifications || null,
          license_no: user?.doctor_profiles?.license_no || null,
        };
      });

    const frontdesk = staffAssignments
      .filter((assignment) => assignment.roles?.name === "front_desk")
      .map((assignment) => {
        const user = assignment.users;
        return {
          id: user?.id?.toString() ?? assignment.user_id.toString(),
          name: user?.full_name || "Front Desk Staff",
          email: user?.email || null,
          phone: user?.phone || null,
          is_active: user?.is_active ?? false,
          shift: user?.front_desk_staff?.shift || null,
        };
      });

    const totalPatients = await prisma.patient_profiles.count({
      where: {
        users: {
          clinic_user_roles: {
            some: { clinic_id: clinicId },
          },
        },
      },
    });

    const totalAppointments = await prisma.appointments.count({
      where: { clinic_id: clinicId },
    });

    const revenueTotals = await prisma.appointments.aggregate({
      where: {
        clinic_id: clinicId,
        status: "completed",
        appointment_fee: { not: null },
      },
      _sum: { appointment_fee: true },
      _count: { id: true },
    });

    res.status(200).json({
      clinic: {
        id: clinic.id.toString(),
        name: clinic.name,
        code: clinic.code,
        address: clinic.address,
        phone: clinic.phone,
        is_active: clinic.is_active,
        created_at: clinic.created_at,
        owner: clinic.users
          ? {
              id: clinic.users.id?.toString(),
              full_name: clinic.users.full_name,
              email: clinic.users.email,
              phone: clinic.users.phone,
            }
          : null,
      },
      stats: {
        total_doctors: doctors.length,
        total_frontdesk: frontdesk.length,
        total_patients: totalPatients,
        total_appointments: totalAppointments,
        completed_appointments: revenueTotals._count.id,
        total_earnings: Number(revenueTotals._sum.appointment_fee || 0),
      },
      doctors,
      frontdesk,
    });
  } catch (error) {
    console.error("Error fetching clinic details:", error);
    res.status(500).json({
      message: "Error fetching clinic details",
      error: error.message,
    });
  }
};

// ------------------
// UPDATE CLINIC
// ------------------
export const updateClinic = async (req, res) => {
  console.log("updateClinic called");
  try {
    const { id } = req.params;
    const {
      name,
      code,
      address,
      phone,
      is_active,
    } = req.body;

    const existingClinic = await prisma.clinics.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingClinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    if (phone) {
        const phoneRegex = /^\+?\d{9,15}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: "Phone number must be 9-15 digits and can start with +." });
        }
    }

    const updatedClinic = await prisma.clinics.update({
      where: { id: BigInt(id) },
      data: {
        name: name || existingClinic.name,
        // code: code || existingClinic.code, // Disable updating clinic code
        address: address !== undefined ? address : existingClinic.address,
        phone: phone !== undefined ? phone : existingClinic.phone,
        is_active: is_active !== undefined ? is_active : existingClinic.is_active,
      },
      include: {
        users: true,
      },
    });

    res.status(200).json({
      message: "Clinic updated successfully",
      clinic: updatedClinic,
    });
  } catch (error) {
    console.error("Error updating clinic:", error);
    res.status(500).json({
      message: "Error updating clinic",
      error: error.message,
    });
  }
};

// ------------------
// DELETE CLINIC
// ------------------
export const deleteClinic = async (req, res) => {
  console.log("deleteClinic called");
  try {
    const { id } = req.params;

    const clinic = await prisma.clinics.findUnique({
      where: { id: BigInt(id) },
      include: {
        _count: {
          select: {
            appointments: true,
            clinic_sales: true,
          },
        },
      },
    });

    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    if (clinic._count.appointments > 0 || clinic._count.clinic_sales > 0) {
      console.log(
        `⚠️  Deleting clinic with ${clinic._count.appointments} appointments and ${clinic._count.clinic_sales} sales`
      );
    }

    await prisma.clinics.delete({
      where: { id: BigInt(id) },
    });

    res.status(200).json({ message: "Clinic deleted successfully" });
  } catch (error) {
    console.error("Error deleting clinic:", error);
    res.status(500).json({
      message: "Error deleting clinic",
      error: error.message,
    });
  }
};

// ------------------
// TOGGLE CLINIC STATUS
// ------------------
export const toggleClinicStatus = async (req, res) => {
  console.log("toggleClinicStatus called");
  try {
    const { id } = req.params;

    const clinic = await prisma.clinics.findUnique({
      where: { id: BigInt(id) },
    });

    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    const updatedClinic = await prisma.clinics.update({
      where: { id: BigInt(id) },
      data: {
        is_active: !clinic.is_active,
      },
    });

    res.status(200).json({
      message: `Clinic ${updatedClinic.is_active ? "activated" : "deactivated"} successfully`,
      clinic: updatedClinic,
    });
  } catch (error) {
    console.error("Error toggling clinic status:", error);
    res.status(500).json({
      message: "Error toggling clinic status",
      error: error.message,
    });
  }
};

// ------------------
// GET USER ROLE IN CLINIC
// ------------------
export const getUserClinicRole = async (req, res) => {
  try {
    const { userId, clinicId } = req.params;

    const userRole = await prisma.clinic_user_roles.findFirst({
      where: {
        user_id: BigInt(userId),
        clinic_id: BigInt(clinicId),
      },
      include: {
        roles: true,
        clinics: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!userRole) {
      return res.status(404).json({ 
        message: "User role not found for this clinic" 
      });
    }

    res.status(200).json(userRole);
  } catch (error) {
    console.error("Error fetching user role:", error);
    res.status(500).json({
      message: "Error fetching user role",
      error: error.message,
    });
  }
};



export const getRevenue = async (req, res) => {
    try {
        // Get all clinics with their sales data
        const clinicsWithSales = await prisma.clinics.findMany({
            where: {
                is_active: true,
            },
            include: {
                clinic_sales: {
                    where: {
                        status: {
                            in: ['completed', 'pending'],
                        },
                    },
                    select: {
                        amount: true,
                        status: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Process the data for each clinic
        const clinicRevenueData = clinicsWithSales.map((clinic) => {
            // Calculate total fees (all completed and pending sales)
            const totalFees = clinic.clinic_sales.reduce(
                (sum, sale) => sum + Number(sale.amount),
                0
            );

            // Calculate paid fees (only completed sales)
            const paidFees = clinic.clinic_sales
                .filter((sale) => sale.status === 'completed')
                .reduce((sum, sale) => sum + Number(sale.amount), 0);

            // Calculate pending fees (only pending sales)
            const pendingFees = clinic.clinic_sales
                .filter((sale) => sale.status === 'pending')
                .reduce((sum, sale) => sum + Number(sale.amount), 0);

            // Calculate revenue share (10% of total fees)
            const sharePercentage = 10;
            const revenueShare = (totalFees * sharePercentage) / 100;

            return {
                clinicId: clinic.code || `CLN${String(clinic.id).padStart(3, '0')}`,
                clinicName: clinic.name,
                totalFees: Math.round(totalFees),
                paidFees: Math.round(paidFees),
                pendingFees: Math.round(pendingFees),
                revenueShare: Math.round(revenueShare),
                sharePercentage,
            };
        });

        // Calculate totals across all clinics
        const totalRevenue = clinicRevenueData.reduce(
            (sum, clinic) => sum + clinic.totalFees,
            0
        );
        const totalRevenueShare = clinicRevenueData.reduce(
            (sum, clinic) => sum + clinic.revenueShare,
            0
        );
        const totalPaid = clinicRevenueData.reduce(
            (sum, clinic) => sum + clinic.paidFees,
            0
        );
        const totalPending = clinicRevenueData.reduce(
            (sum, clinic) => sum + clinic.pendingFees,
            0
        );

        const response = {
            totalRevenue,
            totalRevenueShare,
            totalPaid,
            totalPending,
            clinics: clinicRevenueData,
        };

        console.log("Revenue data:", response);
        
        return res.status(200).json(response);
    } catch (err) {
        console.error("Error retrieving revenue data:", err);
        return res.status(500).json({ 
            message: "Error retrieving revenue data", 
            error: err.message 
        });
    }
};




// ------------------
// GET REVENUE CHART DATA (TIME-BASED)
// ------------------
// ------------------
// GET REVENUE CHART DATA (TIME-BASED)
// ------------------
// ------------------
// GET REVENUE CHART DATA (TIME-BASED)
// ------------------
// ------------------
// GET REVENUE CHART DATA (TIME-BASED)
// ------------------
export const getRevenueChart = async (req, res) => {
    try {
        const { filter = 'monthly' } = req.query;

        let revenueData = [];

        switch (filter) {
            case 'daily': {
                // Last 7 days (more realistic for daily view)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const dailyData = await prisma.$queryRaw`
                    SELECT 
                        DATE(recorded_at) as date,
                        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as paid,
                        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending
                    FROM clinic_sales
                    WHERE recorded_at >= ${sevenDaysAgo}
                    GROUP BY DATE(recorded_at)
                    ORDER BY DATE(recorded_at) ASC
                `;

                revenueData = dailyData.map(row => ({
                    date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    paid: Number(row.paid),
                    pending: Number(row.pending)
                }));
                break;
            }

            case 'weekly': {
                // Last 8 weeks
                const eightWeeksAgo = new Date();
                eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

                const weeklyData = await prisma.$queryRaw`
                    SELECT 
                        YEAR(recorded_at) as year,
                        WEEK(recorded_at, 1) as week_num,
                        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as paid,
                        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending
                    FROM clinic_sales
                    WHERE recorded_at >= ${eightWeeksAgo}
                    GROUP BY YEAR(recorded_at), WEEK(recorded_at, 1)
                    ORDER BY YEAR(recorded_at) ASC, WEEK(recorded_at, 1) ASC
                `;

                revenueData = weeklyData.map(row => ({
                    week: `Week ${Number(row.week_num)} ${Number(row.year)}`,
                    paid: Number(row.paid),
                    pending: Number(row.pending)
                }));
                break;
            }

            case 'monthly': {
                // Last 12 months
                const twelveMonthsAgo = new Date();
                twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

                const monthlyData = await prisma.$queryRaw`
                    SELECT 
                        YEAR(recorded_at) as year,
                        MONTH(recorded_at) as month_num,
                        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as paid,
                        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending
                    FROM clinic_sales
                    WHERE recorded_at >= ${twelveMonthsAgo}
                    GROUP BY YEAR(recorded_at), MONTH(recorded_at)
                    ORDER BY YEAR(recorded_at) ASC, MONTH(recorded_at) ASC
                `;

                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                revenueData = monthlyData.map(row => ({
                    month: `${monthNames[Number(row.month_num) - 1]} ${Number(row.year)}`,
                    paid: Number(row.paid),
                    pending: Number(row.pending)
                }));
                break;
            }

            case 'yearly': {
                // All years
                const yearlyData = await prisma.$queryRaw`
                    SELECT 
                        YEAR(recorded_at) as year,
                        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as paid,
                        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending
                    FROM clinic_sales
                    GROUP BY YEAR(recorded_at)
                    ORDER BY YEAR(recorded_at) ASC
                    LIMIT 10
                `;

                revenueData = yearlyData.map(row => ({
                    year: String(Number(row.year)),
                    paid: Number(row.paid),
                    pending: Number(row.pending)
                }));
                break;
            }

            default:
                return res.status(400).json({ 
                    message: "Invalid filter. Use: daily, weekly, monthly, or yearly" 
                });
        }

        console.log(`Revenue chart data (${filter}):`, revenueData);
        
        return res.status(200).json(revenueData);
    } catch (err) {
        console.error("Error retrieving revenue chart data:", err);
        return res.status(500).json({ 
            message: "Error retrieving revenue chart data", 
            error: err.message 
        });
    }
};

// ------------------
// GET BOOKINGS CHART DATA (TIME-BASED)
// ------------------


// ------------------
// GET BOOKINGS CHART DATA (TIME-BASED)
// ------------------
// ------------------
// GET BOOKINGS CHART DATA (TIME-BASED)
// ------------------
export const getBookingsChart = async (req, res) => {
    try {
        const { range = 'weekly' } = req.query;

        let chartData = [];

        switch (range) {
            case 'daily': {
                // Last 7 days - FILL ALL DAYS
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const dailyData = await prisma.$queryRaw`
                    SELECT 
                        DATE(scheduled_at) as date,
                        COUNT(DISTINCT id) as bookings,
                        COUNT(DISTINCT patient_user_id) as patients
                    FROM appointments
                    WHERE scheduled_at >= ${sevenDaysAgo}
                    GROUP BY DATE(scheduled_at)
                    ORDER BY DATE(scheduled_at) ASC
                `;

                // Create array of all 7 days
                const dataMap = {};
                dailyData.forEach(row => {
                    dataMap[row.date.toISOString().split('T')[0]] = {
                        bookings: Number(row.bookings),
                        patients: Number(row.patients)
                    };
                });

                // Fill all 7 days with data or zeros
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    chartData.push({
                        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        bookings: dataMap[dateStr]?.bookings || 0,
                        patients: dataMap[dateStr]?.patients || 0
                    });
                }
                break;
            }

            case 'weekly': {
                // Last 8 weeks - FILL ALL WEEKS
                const eightWeeksAgo = new Date();
                eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

                const weeklyData = await prisma.$queryRaw`
                    SELECT 
                        YEAR(scheduled_at) as year,
                        WEEK(scheduled_at, 1) as week_num,
                        COUNT(DISTINCT id) as bookings,
                        COUNT(DISTINCT patient_user_id) as patients
                    FROM appointments
                    WHERE scheduled_at >= ${eightWeeksAgo}
                    GROUP BY YEAR(scheduled_at), WEEK(scheduled_at, 1)
                    ORDER BY YEAR(scheduled_at) ASC, WEEK(scheduled_at, 1) ASC
                `;

                // Create map of existing data
                const dataMap = {};
                weeklyData.forEach(row => {
                    const key = `${row.year}-${row.week_num}`;
                    dataMap[key] = {
                        bookings: Number(row.bookings),
                        patients: Number(row.patients)
                    };
                });

                // Fill last 8 weeks
                for (let i = 7; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - (i * 7));
                    const year = date.getFullYear();
                    const weekNum = getWeekNumber(date);
                    const key = `${year}-${weekNum}`;
                    
                    chartData.push({
                        label: `Week ${weekNum}`,
                        bookings: dataMap[key]?.bookings || 0,
                        patients: dataMap[key]?.patients || 0
                    });
                }
                break;
            }

            case 'monthly': {
                // Last 6 months - FILL ALL MONTHS
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                const monthlyData = await prisma.$queryRaw`
                    SELECT 
                        YEAR(scheduled_at) as year,
                        MONTH(scheduled_at) as month_num,
                        COUNT(DISTINCT id) as bookings,
                        COUNT(DISTINCT patient_user_id) as patients
                    FROM appointments
                    WHERE scheduled_at >= ${sixMonthsAgo}
                    GROUP BY YEAR(scheduled_at), MONTH(scheduled_at)
                    ORDER BY YEAR(scheduled_at) ASC, MONTH(scheduled_at) ASC
                `;

                // Create map of existing data
                const dataMap = {};
                monthlyData.forEach(row => {
                    const key = `${row.year}-${row.month_num}`;
                    dataMap[key] = {
                        bookings: Number(row.bookings),
                        patients: Number(row.patients)
                    };
                });

                // Fill last 6 months
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                for (let i = 5; i >= 0; i--) {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    const key = `${year}-${month}`;
                    
                    chartData.push({
                        label: `${monthNames[month - 1]} ${year}`,
                        bookings: dataMap[key]?.bookings || 0,
                        patients: dataMap[key]?.patients || 0
                    });
                }
                break;
            }

            case 'yearly': {
                // Last 5 years - FILL ALL YEARS
                const currentYear = new Date().getFullYear();
                const fiveYearsAgo = new Date();
                fiveYearsAgo.setFullYear(currentYear - 5);

                const yearlyData = await prisma.$queryRaw`
                    SELECT 
                        YEAR(scheduled_at) as year,
                        COUNT(DISTINCT id) as bookings,
                        COUNT(DISTINCT patient_user_id) as patients
                    FROM appointments
                    WHERE scheduled_at >= ${fiveYearsAgo}
                    GROUP BY YEAR(scheduled_at)
                    ORDER BY YEAR(scheduled_at) ASC
                `;

                // Create map of existing data
                const dataMap = {};
                yearlyData.forEach(row => {
                    dataMap[String(Number(row.year))] = {
                        bookings: Number(row.bookings),
                        patients: Number(row.patients)
                    };
                });

                // Fill last 5 years
                for (let i = 4; i >= 0; i--) {
                    const year = currentYear - i;
                    
                    chartData.push({
                        label: String(year),
                        bookings: dataMap[String(year)]?.bookings || 0,
                        patients: dataMap[String(year)]?.patients || 0
                    });
                }
                break;
            }

            default:
                return res.status(400).json({ 
                    message: "Invalid range. Use: daily, weekly, monthly, or yearly" 
                });
        }

        console.log(`Bookings chart data (${range}):`, chartData);
        
        return res.status(200).json(chartData);
    } catch (err) {
        console.error("Error retrieving bookings chart data:", err);
        return res.status(500).json({ 
            message: "Error retrieving bookings chart data", 
            error: err.message 
        });
    }
};

// Helper function to get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}