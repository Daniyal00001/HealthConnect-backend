import prisma from "../../prismaClient.js";

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





export const getRevenue = async (req, res) => {
    try {
        // Get all clinics with their sales data
        const clinicsWithSales = await prisma.clinics.findMany({
            where: {
                is_active: true,
                name: {
                    not: "Clinic Name",
                },
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