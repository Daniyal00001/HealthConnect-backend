
import prisma from "../../prismaClient.js";
import { subDays, startOfDay, endOfDay, subMonths } from "date-fns";

export const getBookingsData = async (req, res) => {
  try {
    const { range = "weekly" } = req.query;
    let data = [];

    if (range === "daily") {
      const start = startOfDay(new Date());
      const end = endOfDay(new Date());

      const appointments = await prisma.appointments.findMany({
        where: { scheduled_at: { gte: start, lte: end } },
      });

      data = Array.from({ length: 24 }, (_, h) => {
        const filtered = appointments.filter(a => new Date(a.scheduled_at).getHours() === h);
        return {
          label: `${h}:00`,
          bookings: filtered.length,
          patients: new Set(filtered.map(a => a.patient_user_id)).size,
        };
      });
    }

    else if (range === "weekly") {
      for (let i = 6; i >= 0; i--) {
        const day = subDays(new Date(), i);

        const appointments = await prisma.appointments.findMany({
          where: {
            scheduled_at: { gte: startOfDay(day), lte: endOfDay(day) },
          },
        });

        data.push({
          label: day.toLocaleDateString("en-US", { weekday: "short" }),
          bookings: appointments.length,
          patients: new Set(appointments.map(a => a.patient_user_id)).size,
        });
      }
    }

    else if (range === "monthly") {
      const start = subMonths(new Date(), 1);

      const monthlyData = await prisma.$queryRaw`
        SELECT DATE(scheduled_at) as date, COUNT(*) as bookings, COUNT(DISTINCT patient_user_id) as patients
        FROM appointments
        WHERE scheduled_at >= ${start}
        GROUP BY DATE(scheduled_at)
        ORDER BY DATE(scheduled_at)
      `;

      data = monthlyData.map(row => ({
        label: row.date.toISOString().slice(5, 10), // MM-DD
        bookings: Number(row.bookings),
        patients: Number(row.patients),
      }));
    }

    res.json(data);

  } catch (err) {
    console.error("Chart data fetch error ->", err);
    res.status(500).json({ message: "Error retrieving bookings data" });
  }
};



export const getRevenueOverview = async (req, res) => {
  console.log("Revenue overview request received");
  try {
    const filter = req.query.filter || "monthly"; // daily, weekly, monthly, yearly
    const now = new Date();
    let startDate;

    switch (filter) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "weekly":
        const firstDayOfWeek = now.getDate() - now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), firstDayOfWeek);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Fetch all sales from all clinics after startDate
    const sales = await prisma.clinic_sales.findMany({
      where: { recorded_at: { gte: startDate } },
    });

    let data = [];

    if (filter === "daily") {
      // group by hour
      data = Array.from({ length: 24 }, (_, h) => {
        const filtered = sales.filter(s => new Date(s.recorded_at).getHours() === h);
        return {
          date: `${h}:00`,
          paid: filtered.filter(s => s.status === "completed").reduce((sum, s) => sum + parseFloat(s.amount), 0),
          pending: filtered.filter(s => s.status === "pending").reduce((sum, s) => sum + parseFloat(s.amount), 0),
          // share: filtered.filter(s => s.status === "completed").reduce((sum, s) => sum + parseFloat(s.amount) * 0.1, 0),
        };
      });
    } else if (filter === "weekly") {
      const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      data = days.map((d, i) => {
        const daySales = sales.filter(s => new Date(s.recorded_at).getDay() === i);
        return {
          day: d,
          paid: daySales.filter(s => s.status === "completed").reduce((sum, s) => sum + parseFloat(s.amount), 0),
          pending: daySales.filter(s => s.status === "pending").reduce((sum, s) => sum + parseFloat(s.amount), 0),
          share: daySales.filter(s => s.status === "completed").reduce((sum, s) => sum + parseFloat(s.amount) * 0.1, 0),
        };
      });
    } else if (filter === "monthly") {
      data = Array.from({ length: 12 }, (_, i) => {
        const monthSales = sales.filter(s => new Date(s.recorded_at).getMonth() === i);
        return {
          month: new Date(0, i).toLocaleString("default", { month: "short" }),
          paid: monthSales.filter(s => s.status === "completed").reduce((sum, s) => sum + parseFloat(s.amount), 0),
          pending: monthSales.filter(s => s.status === "pending").reduce((sum, s) => sum + parseFloat(s.amount), 0),
          share: monthSales.filter(s => s.status === "completed").reduce((sum, s) => sum + parseFloat(s.amount) * 0.1, 0),
        };
      });
    } else if (filter === "yearly") {
      const yearMap = {};
      sales.forEach(s => {
        const y = s.recorded_at.getFullYear();
        if (!yearMap[y]) yearMap[y] = { year: y, paid: 0, pending: 0, share: 0 };
        if (s.status === "completed") {
          yearMap[y].paid += parseFloat(s.amount);
          yearMap[y].share += parseFloat(s.amount) * 0.1;
        } else if (s.status === "pending") {
          yearMap[y].pending += parseFloat(s.amount);
        }
      });
      data = Object.values(yearMap);
    }

    res.json(data);
  } catch (err) {
    console.error("Revenue overview error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
