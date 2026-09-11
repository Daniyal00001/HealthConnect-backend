import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const secretKey = process.env.JWT_SECRET


const generateToken = (payload) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not set in .env");
    }

    // Convert any BigInt to string
    const safePayload = Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [
            key,
            typeof value === "bigint" ? value.toString() : value
        ])
    );

    return jwt.sign(safePayload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export { generateToken };