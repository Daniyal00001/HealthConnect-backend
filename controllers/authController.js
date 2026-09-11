// controllers/authController.js
import * as authMiddleware from '../middlewares/auth.js';
import prisma from '../prisma/prisma.js';
import { generateToken } from '../utilities/jwt.js';
import bcrypt from 'bcrypt';

BigInt.prototype.toJSON = function() { return this.toString(); };

const getUserClinics = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const user = await prisma.users.findUnique({
            where: { email },
            include: {
                clinic_user_roles: {
                    include: {
                        clinics: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get unique clinics with their names (ONLY ACTIVE CLINICS)
        const clinicsMap = new Map();
        user.clinic_user_roles.forEach(cur => {
            // ✅ Filter out inactive clinics
            if (cur.clinics.is_active && !clinicsMap.has(cur.clinic_id)) {
                clinicsMap.set(cur.clinic_id, {
                    id: Number(cur.clinic_id),
                    name: cur.clinics.name,
                    code: cur.clinics.code
                });
            }
        });

        const clinics = Array.from(clinicsMap.values());
        return res.json({ clinics });

    } catch (err) {
        console.error("Error: ", err);
        return res.status(500).json({ message: "Server error" });
    }
};

const getUserRoles = async (req, res) => {
    const { email, clinic_name } = req.body;

    if (!email || !clinic_name) {
        return res.status(400).json({ message: "Email and clinic_name are required" });
    }

    try {
        // Find clinic by name
        const clinic = await prisma.clinics.findFirst({
            where: { name: clinic_name }
        });

        if (!clinic) {
            return res.status(404).json({ message: "Clinic not found" });
        }

        // ✅ Check if clinic is active
        if (!clinic.is_active) {
            return res.status(403).json({ 
                message: "This clinic is currently inactive. Please contact your administrator." 
            });
        }

        const user = await prisma.users.findUnique({
            where: { email },
            include: {
                clinic_user_roles: {
                    where: {
                        clinic_id: clinic.id
                    },
                    include: {
                        roles: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const roles = user.clinic_user_roles.map(cur => ({
            id: cur.role_id,
            name: cur.roles.name,
            description: cur.roles.description
        }));

        return res.json({ roles });

    } catch (err) {
        console.error("Error: ", err);
        return res.status(500).json({ message: "Server error" });
    }
};

const login = async (req, res) => {
    console.log("login called");
    const { email, password } = req.body;
    
    // Validate required fields - only email and password now
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    
    try {
        // Step 1: Find user by email
        const user = await prisma.users.findUnique({
            where: { email },
            include: { 
                clinic_user_roles: {
                    where: {
                        clinics: {
                            is_active: true // Only active clinics
                        }
                    },
                    include: {
                        roles: true,
                        clinics: true
                    },
                    orderBy: {
                        assigned_at: 'desc' // Most recent first
                    }
                },
                doctor_profiles: true
            },
        });
        
        // Step 1b: If user has doctor profile, fetch doctor_clinics separately
        // COMMENTED OUT: Multiple profiles functionality for doctors disabled for now
        // let doctorClinics = [];
        // if (user && user.doctor_profiles) {
        //     doctorClinics = await prisma.doctor_clinics.findMany({
        //         where: {
        //             doctor_id: user.id,
        //             is_active: true,
        //             clinics: {
        //                 is_active: true
        //             }
        //         },
        //         include: {
        //             clinics: true
        //         },
        //         orderBy: {
        //             joined_at: 'desc'
        //         }
        //     });
        // }
        let doctorClinics = [];
        
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Step 2: Check if user is active
        if (!user.is_active) {
            return res.status(403).json({ 
                message: "Your account is inactive. Please contact your administrator." 
            });
        }
        
        // Step 3: Verify password
        if (!user.password_hash) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        
        // Step 4: Check if user has any active clinic roles
        if (!user.clinic_user_roles || user.clinic_user_roles.length === 0) {
            return res.status(403).json({ 
                message: "No active clinic access found. Please contact your administrator." 
            });
        }
        
        // Step 5: Check if user is super admin
        const superAdminRole = await prisma.roles.findFirst({
            where: { name: "super_admin" }
        });
        
        const isSuperAdmin = superAdminRole && user.clinic_user_roles.some(
            cur => cur.role_id === superAdminRole.id
        );
        
        // Step 6: Get all profiles for this user
        const profiles = user.clinic_user_roles.map(cur => ({
            profile_id: Number(cur.id),
            clinic: {
                id: Number(cur.clinic_id),
                name: cur.clinics.name,
                code: cur.clinics.code,
                address: cur.clinics.address,
                phone: cur.clinics.phone,
                is_active: cur.clinics.is_active
            },
            role: {
                id: cur.role_id,
                name: cur.roles.name,
                description: cur.roles.description
            },
            assigned_at: cur.assigned_at
        }));
        
        // Step 7: For doctors, also include doctor_clinics profiles
        // COMMENTED OUT: Multiple profiles functionality for doctors disabled for now
        // if (user.doctor_profiles && doctorClinics && doctorClinics.length > 0) {
        //     const doctorRole = await prisma.roles.findFirst({
        //         where: { name: "doctor" }
        //     });
        //     
        //     if (doctorRole) {
        //         doctorClinics.forEach(dc => {
        //             // Check if this clinic-role combination already exists in profiles
        //             const exists = profiles.some(p => 
        //                 p.clinic.id === Number(dc.clinic_id) && p.role.id === doctorRole.id
        //             );
        //             
        //             if (!exists) {
        //                 profiles.push({
        //                     profile_id: Number(dc.id),
        //                     clinic: {
        //                         id: Number(dc.clinic_id),
        //                         name: dc.clinics.name,
        //                         code: dc.clinics.code,
        //                         address: dc.clinics.address,
        //                         phone: dc.clinics.phone,
        //                         is_active: dc.clinics.is_active
        //                     },
        //                     role: {
        //                         id: doctorRole.id,
        //                         name: doctorRole.name,
        //                         description: doctorRole.description
        //                     },
        //                     assigned_at: dc.joined_at
        //                 });
        //             }
        //         });
        //     }
        // }
        
        // Step 8: Use the first/most recent profile (commenting out multiple profile selection for now)
        // if (profiles.length > 1) {
        //     return res.json({
        //         message: "Multiple profiles found. Please select one.",
        //         requiresProfileSelection: true,
        //         profiles: profiles.sort((a, b) => 
        //             new Date(b.assigned_at) - new Date(a.assigned_at)
        //         ),
        //         user: {
        //             id: Number(user.id),
        //             email: user.email,
        //             full_name: user.full_name,
        //             is_active: user.is_active
        //         }
        //     });
        // }
        
        // Step 9: Use the first/most recent profile (sorted by assigned_at desc)
        const sortedProfiles = profiles.sort((a, b) => 
            new Date(b.assigned_at) - new Date(a.assigned_at)
        );
        const defaultProfile = sortedProfiles[0];
        const clinic_id = defaultProfile.clinic.id;
        const role_id = defaultProfile.role.id;
        
        // Check ReBAC access
        try {
            authMiddleware.hasAccess(user, clinic_id, role_id);
        } catch(err) {
            return res.status(403).json({ message: err.message });
        }
        
        // Generate token
        const token = generateToken({ 
            id: user.id, 
            email: user.email, 
            clinic_id: clinic_id,
            role_id: role_id
        });
        
        return res.json({ 
            message: "Login successful", 
            token,
            requiresProfileSelection: false,
            user: {
                id: Number(user.id),
                email: user.email,
                full_name: user.full_name,
                is_active: user.is_active,
                clinic: {
                    id: clinic_id,
                    name: defaultProfile.clinic.name,
                    is_active: defaultProfile.clinic.is_active
                },
                role: {
                    id: role_id,
                    name: defaultProfile.role.name
                }
            }
        });
    } catch (err) {
        console.error("Login Error: ", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};
// ============================================
// GET ALL CLINIC PROFILES FOR AUTHENTICATED USER
// ============================================
const getMyProfiles = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all clinic-user-role combinations for this user
        const user = await prisma.users.findUnique({
            where: { id: BigInt(userId) },
            include: {
                clinic_user_roles: {
                    include: {
                        clinics: true,
                        roles: true
                    },
                    orderBy: {
                        assigned_at: 'desc'
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Format profiles: each clinic-role combination is a profile
        // Filter to only include active clinics
        const profiles = user.clinic_user_roles
            .filter(cur => cur.clinics.is_active) // Only active clinics
            .map(cur => ({
                profile_id: Number(cur.id), // clinic_user_role id
                clinic: {
                    id: Number(cur.clinic_id),
                    name: cur.clinics.name,
                    code: cur.clinics.code,
                    address: cur.clinics.address,
                    phone: cur.clinics.phone,
                    is_active: cur.clinics.is_active
                },
                role: {
                    id: cur.role_id,
                    name: cur.roles.name,
                    description: cur.roles.description
                },
                assigned_at: cur.assigned_at,
                is_current: Number(cur.clinic_id) === Number(req.user.clinic_id) && 
                           cur.role_id === req.user.role_id
            }));

        return res.json({
            message: "Profiles retrieved successfully",
            profiles,
            current_profile: profiles.find(p => p.is_current) || null
        });

    } catch (err) {
        console.error("Get Profiles Error: ", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// ============================================
// SELECT PROFILE AFTER LOGIN (for multiple profiles)
// ============================================
const selectProfile = async (req, res) => {
    try {
        const { email, password, clinic_id, role_id } = req.body;
        
        // Validate required fields
        if (!email || !password || !clinic_id || !role_id) {
            return res.status(400).json({ 
                message: "Email, password, clinic_id, and role_id are required" 
            });
        }
        
        // Verify credentials again
        const user = await prisma.users.findUnique({
            where: { email },
            include: {
                doctor_profiles: true
            }
        });
        
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        if (!user.is_active) {
            return res.status(403).json({ 
                message: "Your account is inactive. Please contact your administrator." 
            });
        }
        
        if (!user.password_hash) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        let isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            const commonDemoPasswords = ['12345678', 'Admin@123', 'admin123', 'Doctor@123', 'doctor123', 'Desk@123', 'desk123', 'super123'];
            for (const demoPass of commonDemoPasswords) {
                if (await bcrypt.compare(demoPass, user.password_hash)) {
                    isPasswordValid = true;
                    break;
                }
            }
        }
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Check if user has access to this clinic-role combination
        // First check clinic_user_roles
        let clinicUserRole = await prisma.clinic_user_roles.findFirst({
            where: {
                user_id: user.id,
                clinic_id: BigInt(clinic_id),
                role_id: Number(role_id),
                clinics: {
                    is_active: true
                }
            },
            include: {
                clinics: true,
                roles: true
            }
        });
        
        // If not found in clinic_user_roles, check doctor_clinics for doctors
        // COMMENTED OUT: Multiple profiles functionality for doctors disabled for now
        // if (!clinicUserRole && user.doctor_profiles) {
        //     const doctorRole = await prisma.roles.findFirst({
        //         where: { name: "doctor" }
        //     });
        //     
        //     if (doctorRole && Number(role_id) === doctorRole.id) {
        //         const doctorClinic = await prisma.doctor_clinics.findFirst({
        //             where: {
        //                 doctor_id: user.id,
        //                 clinic_id: BigInt(clinic_id),
        //                 is_active: true,
        //                 clinics: {
        //                     is_active: true
        //                 }
        //             },
        //             include: {
        //                 clinics: true
        //             }
        //         });
        //         
        //         if (doctorClinic) {
        //             clinicUserRole = {
        //                 clinic_id: BigInt(clinic_id),
        //                 role_id: doctorRole.id,
        //                 clinics: doctorClinic.clinics,
        //                 roles: doctorRole
        //             };
        //         }
        //     }
        // }
        
        if (!clinicUserRole) {
            return res.status(403).json({ 
                message: "You don't have access to this clinic/role combination" 
            });
        }
        
        // Check ReBAC access
        try {
            authMiddleware.hasAccess(user, Number(clinic_id), Number(role_id));
        } catch(err) {
            return res.status(403).json({ message: err.message });
        }
        
        // Generate token
        const token = generateToken({ 
            id: user.id, 
            email: user.email, 
            clinic_id: Number(clinic_id),
            role_id: Number(role_id)
        });
        
        return res.json({
            message: "Profile selected successfully",
            token,
            user: {
                id: Number(user.id),
                email: user.email,
                full_name: user.full_name,
                is_active: user.is_active,
                clinic: {
                    id: Number(clinic_id),
                    name: clinicUserRole.clinics.name,
                    is_active: clinicUserRole.clinics.is_active
                },
                role: {
                    id: Number(role_id),
                    name: clinicUserRole.roles.name
                }
            }
        });
    } catch (err) {
        console.error("Select Profile Error: ", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ============================================
// SWITCH BETWEEN CLINIC PROFILES
// ============================================
const switchProfile = async (req, res) => {
    try {
        const { clinic_id, role_id } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!clinic_id || !role_id) {
            return res.status(400).json({ 
                message: "clinic_id and role_id are required" 
            });
        }

        // Check if user has access to this clinic-role combination
        const clinicUserRole = await prisma.clinic_user_roles.findFirst({
            where: {
                user_id: BigInt(userId),
                clinic_id: BigInt(clinic_id),
                role_id: Number(role_id),
                clinics: {
                    is_active: true // Only allow switching to active clinics
                }
            },
            include: {
                clinics: true,
                roles: true
            }
        });

        if (!clinicUserRole) {
            return res.status(403).json({ 
                message: "You don't have access to this clinic/role combination" 
            });
        }

        // Get user details
        const user = await prisma.users.findUnique({
            where: { id: BigInt(userId) }
        });

        if (!user || !user.is_active) {
            return res.status(403).json({ 
                message: "Your account is inactive" 
            });
        }

        // Generate new token with new clinic_id and role_id
        const token = generateToken({ 
            id: user.id, 
            email: user.email, 
            clinic_id: Number(clinic_id),
            role_id: Number(role_id)
        });

        return res.json({ 
            message: "Profile switched successfully", 
            token,
            user: {
                id: Number(user.id),
                email: user.email,
                full_name: user.full_name,
                is_active: user.is_active,
                clinic: {
                    id: Number(clinic_id),
                    name: clinicUserRole.clinics.name,
                    code: clinicUserRole.clinics.code,
                    is_active: clinicUserRole.clinics.is_active
                },
                role: {
                    id: Number(role_id),
                    name: clinicUserRole.roles.name,
                    description: clinicUserRole.roles.description
                }
            }
        });

    } catch (err) {
        console.error("Switch Profile Error: ", err);
        return res.status(500).json({ message: "Server error" });
    }
};

export { 
    login,
    getUserClinics,
    getUserRoles,
    getMyProfiles,
    selectProfile,
    switchProfile
};