import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with realistic data...');

  const defaultPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. ROLES
  console.log('Seeding roles...');
  const rolesData = [
    { id: 1, name: 'super_admin', description: 'System-wide administrator' },
    { id: 2, name: 'clinic_admin', description: 'Administrator for a specific clinic' },
    { id: 3, name: 'front_desk', description: 'Front desk operator' },
    { id: 4, name: 'doctor', description: 'Medical practitioner' },
    { id: 5, name: 'patient', description: 'Registered patient' },
    { id: 6, name: 'sales', description: 'Handles clinic sales and payments' },
  ];

  for (const role of rolesData) {
    await prisma.roles.upsert({
      where: { id: role.id },
      update: role,
      create: role,
    });
  }

  // 2. USERS
  console.log('Seeding users...');
  const usersData = [
    // Super Admins
    { id: 1n, email: 'super@sys.com', full_name: 'Super Admin', phone: '+923000000000', dob: new Date('1980-01-01'), gender: 'M' },
    { id: 2n, email: 'ahmad.hassan@sys.com', full_name: 'Dr. Ahmad Hassan', phone: '+923000000001', dob: new Date('1982-04-15'), gender: 'M' },
    // Clinic Admins
    { id: 3n, email: 'admin@awaishealth.com', full_name: 'Dr. Awais Qarni', phone: '+923001234567', dob: new Date('1978-08-20'), gender: 'M' },
    { id: 4n, email: 'admin@careplus.com', full_name: 'Dr. Sarah Khan', phone: '+923002345678', dob: new Date('1985-02-14'), gender: 'F' },
    { id: 5n, email: 'admin@shifafamily.com', full_name: 'Dr. Usman Tariq', phone: '+923003456789', dob: new Date('1981-11-05'), gender: 'M' },
    // Doctors
    { id: 6n, email: 'dr.waleed@awaishealth.com', full_name: 'Dr. Waleed Ahmad', phone: '+923004567890', dob: new Date('1988-06-12'), gender: 'M' },
    { id: 7n, email: 'dr.ayesha@careplus.com', full_name: 'Dr. Ayesha Malik', phone: '+923005678901', dob: new Date('1990-09-25'), gender: 'F' },
    { id: 8n, email: 'dr.bilawal@careplus.com', full_name: 'Dr. Bilawal Shah', phone: '+923006789012', dob: new Date('1986-03-18'), gender: 'M' },
    { id: 9n, email: 'dr.shoaib@shifafamily.com', full_name: 'Dr. Shoaib Abbas', phone: '+923007890123', dob: new Date('1984-12-01'), gender: 'M' },
    { id: 10n, email: 'dr.fatima@apexcardiac.com', full_name: 'Dr. Fatima Noor', phone: '+923008901234', dob: new Date('1989-07-30'), gender: 'F' },
    { id: 11n, email: 'dr.hamza@lifeline.com', full_name: 'Dr. Hamza Raza', phone: '+923009012345', dob: new Date('1991-01-10'), gender: 'M' },
    { id: 12n, email: 'dr.zainab@awaishealth.com', full_name: 'Dr. Zainab Akhtar', phone: '+923010123456', dob: new Date('1992-05-22'), gender: 'F' },
    // Front Desk Staff
    { id: 13n, email: 'sara.frontdesk@awaishealth.com', full_name: 'Sara Ahmed', phone: '+923011234567', dob: new Date('1995-10-15'), gender: 'F' },
    { id: 14n, email: 'mariam.frontdesk@careplus.com', full_name: 'Mariam Jameel', phone: '+923012345678', dob: new Date('1996-04-08'), gender: 'F' },
    { id: 15n, email: 'hamza.frontdesk@shifafamily.com', full_name: 'Hamza Javed', phone: '+923013456789', dob: new Date('1994-08-19'), gender: 'M' },
    { id: 16n, email: 'sobia.frontdesk@apexcardiac.com', full_name: 'Sobia Naz', phone: '+923014567890', dob: new Date('1997-12-03'), gender: 'F' },
    // Patients
    { id: 17n, email: 'daniyaltallat88@gmail.com', full_name: 'Daniyal Talat', phone: '+923316412655', dob: new Date('1998-02-10'), gender: 'M' },
    { id: 18n, email: 'miral.khan@gmail.com', full_name: 'Miral Khan', phone: '+923164257645', dob: new Date('1999-05-14'), gender: 'F' },
    { id: 19n, email: 'saqib.malik@gmail.com', full_name: 'Muhammad Saqib', phone: '+923004567891', dob: new Date('1993-11-20'), gender: 'M' },
    { id: 20n, email: 'ali.raza99@yahoo.com', full_name: 'Ali Raza', phone: '+923214567890', dob: new Date('1995-07-04'), gender: 'M' },
    { id: 21n, email: 'usman.ghani@gmail.com', full_name: 'Usman Ghani', phone: '+923335551234', dob: new Date('1991-03-30'), gender: 'M' },
    { id: 22n, email: 'nadia.hussain@outlook.com', full_name: 'Nadia Hussain', phone: '+923019876543', dob: new Date('1987-09-12'), gender: 'F' },
    { id: 23n, email: 'zubair.mahmood@gmail.com', full_name: 'Zubair Mahmood', phone: '+923123456789', dob: new Date('1986-01-25'), gender: 'M' },
    { id: 24n, email: 'amina.bibi@gmail.com', full_name: 'Amina Bibi', phone: '+923056789012', dob: new Date('1992-04-18'), gender: 'F' },
    { id: 25n, email: 'hassan.farooq@gmail.com', full_name: 'Hassan Farooq', phone: '+923456789012', dob: new Date('1994-06-08'), gender: 'M' },
    { id: 26n, email: 'saima.imran@gmail.com', full_name: 'Saima Imran', phone: '+923023456789', dob: new Date('1989-10-05'), gender: 'F' },
    { id: 27n, email: 'rehan.c@gmail.com', full_name: 'Rehan Chaudhry', phone: '+923134567890', dob: new Date('1996-08-14'), gender: 'M' },
    { id: 28n, email: 'khadija.b@gmail.com', full_name: 'Khadija Bibi', phone: '+923245678901', dob: new Date('1993-02-28'), gender: 'F' },
    { id: 29n, email: 'bilal.ashraf@gmail.com', full_name: 'Bilal Ashraf', phone: '+923356789012', dob: new Date('1990-12-11'), gender: 'M' },
    { id: 30n, email: 'omer.sheikh@gmail.com', full_name: 'Omer Sheikh', phone: '+923067890123', dob: new Date('1997-04-03'), gender: 'M' },
    // Generic Demo Accounts (For instant UI modal testing)
    { id: 31n, email: 'admin@clinic.com', full_name: 'Clinic Admin Demo', phone: '+923000000031', dob: new Date('1985-01-01'), gender: 'M' },
    { id: 32n, email: 'doctor@clinic.com', full_name: 'Dr. General Doctor', phone: '+923000000032', dob: new Date('1987-05-15'), gender: 'M' },
    { id: 33n, email: 'desk@clinic.com', full_name: 'Front Desk Demo', phone: '+923000000033', dob: new Date('1995-03-20'), gender: 'F' },
    { id: 34n, email: 'patient@clinic.com', full_name: 'Demo Patient', phone: '+923000000034', dob: new Date('1998-08-10'), gender: 'M' },
  ];

  for (const user of usersData) {
    await prisma.users.upsert({
      where: { id: user.id },
      update: {
        ...user,
        password_hash: defaultPasswordHash,
        is_active: true,
      },
      create: {
        ...user,
        password_hash: defaultPasswordHash,
        is_active: true,
      },
    });
  }

  // 3. CLINICS
  console.log('Seeding clinics...');
  const clinicsData = [
    { id: 1n, name: 'Awais Health Center', code: 'AWC001', address: '123 Main Boulevard, Gulberg III, Lahore', owner_user_id: 3n, phone: '+924235789001', is_active: true },
    { id: 2n, name: 'CarePlus Medical & Specialty Clinic', code: 'CPM002', address: 'Suite 405, Medical Tower, F-7/2, Islamabad', owner_user_id: 4n, phone: '+92512891234', is_active: true },
    { id: 3n, name: 'Shifa Family Care Clinic', code: 'SFC003', address: '74-B Commercial Area, Phase 5 DHA, Lahore', owner_user_id: 5n, phone: '+924237124567', is_active: true },
    { id: 4n, name: 'Apex Cardiac & Vascular Institute', code: 'ACV004', address: '15 Shahrah-e-Faisal, PECHS, Karachi', owner_user_id: 10n, phone: '+922134567890', is_active: true },
    { id: 5n, name: 'LifeLine Pediatrics & Dental Care', code: 'LPD005', address: 'Plot 12-C, Bahria Town Phase 4, Rawalpindi', owner_user_id: 11n, phone: '+92515730099', is_active: true },
  ];

  for (const clinic of clinicsData) {
    await prisma.clinics.upsert({
      where: { id: clinic.id },
      update: clinic,
      create: clinic,
    });
  }

  // 4. CLINIC USER ROLES
  console.log('Seeding clinic user roles...');
  const clinicUserRolesData = [
    { id: 1n, clinic_id: 1n, user_id: 3n, role_id: 2, assigned_by: 1n },
    { id: 2n, clinic_id: 1n, user_id: 6n, role_id: 4, assigned_by: 3n },
    { id: 3n, clinic_id: 1n, user_id: 12n, role_id: 4, assigned_by: 3n },
    { id: 4n, clinic_id: 1n, user_id: 13n, role_id: 3, assigned_by: 3n },
    { id: 5n, clinic_id: 2n, user_id: 4n, role_id: 2, assigned_by: 1n },
    { id: 6n, clinic_id: 2n, user_id: 7n, role_id: 4, assigned_by: 4n },
    { id: 7n, clinic_id: 2n, user_id: 8n, role_id: 4, assigned_by: 4n },
    { id: 8n, clinic_id: 2n, user_id: 14n, role_id: 3, assigned_by: 4n },
    { id: 9n, clinic_id: 3n, user_id: 5n, role_id: 2, assigned_by: 1n },
    { id: 10n, clinic_id: 3n, user_id: 9n, role_id: 4, assigned_by: 5n },
    { id: 11n, clinic_id: 3n, user_id: 15n, role_id: 3, assigned_by: 5n },
    { id: 12n, clinic_id: 4n, user_id: 10n, role_id: 2, assigned_by: 1n },
    { id: 13n, clinic_id: 4n, user_id: 10n, role_id: 4, assigned_by: 1n },
    { id: 14n, clinic_id: 4n, user_id: 16n, role_id: 3, assigned_by: 10n },
    { id: 15n, clinic_id: 5n, user_id: 11n, role_id: 2, assigned_by: 1n },
    { id: 16n, clinic_id: 5n, user_id: 11n, role_id: 4, assigned_by: 1n },
    { id: 17n, clinic_id: 1n, user_id: 17n, role_id: 5, assigned_by: 13n },
    { id: 18n, clinic_id: 1n, user_id: 18n, role_id: 5, assigned_by: 13n },
    { id: 19n, clinic_id: 2n, user_id: 19n, role_id: 5, assigned_by: 14n },
    { id: 20n, clinic_id: 2n, user_id: 20n, role_id: 5, assigned_by: 14n },
    { id: 21n, clinic_id: 3n, user_id: 21n, role_id: 5, assigned_by: 15n },
    { id: 22n, clinic_id: 3n, user_id: 22n, role_id: 5, assigned_by: 15n },
    { id: 23n, clinic_id: 1n, user_id: 23n, role_id: 5, assigned_by: 13n },
    { id: 24n, clinic_id: 2n, user_id: 24n, role_id: 5, assigned_by: 14n },
    { id: 25n, clinic_id: 4n, user_id: 25n, role_id: 5, assigned_by: 16n },
    { id: 26n, clinic_id: 1n, user_id: 26n, role_id: 5, assigned_by: 13n },
    { id: 27n, clinic_id: 3n, user_id: 27n, role_id: 5, assigned_by: 15n },
    { id: 28n, clinic_id: 5n, user_id: 28n, role_id: 5, assigned_by: 11n },
    { id: 29n, clinic_id: 4n, user_id: 29n, role_id: 5, assigned_by: 16n },
    { id: 30n, clinic_id: 1n, user_id: 30n, role_id: 5, assigned_by: 13n },
    // Demo accounts role assignments
    { id: 31n, clinic_id: 1n, user_id: 31n, role_id: 2, assigned_by: 1n },
    { id: 32n, clinic_id: 1n, user_id: 32n, role_id: 4, assigned_by: 31n },
    { id: 33n, clinic_id: 1n, user_id: 33n, role_id: 3, assigned_by: 31n },
    { id: 34n, clinic_id: 1n, user_id: 34n, role_id: 5, assigned_by: 33n },
    { id: 35n, clinic_id: 1n, user_id: 1n, role_id: 1, assigned_by: 1n },
    { id: 36n, clinic_id: 1n, user_id: 2n, role_id: 1, assigned_by: 1n },
  ];

  for (const cur of clinicUserRolesData) {
    await prisma.clinic_user_roles.upsert({
      where: { id: cur.id },
      update: cur,
      create: cur,
    });
  }

  // 5. DOCTOR PROFILES
  console.log('Seeding doctor profiles...');
  const doctorProfilesData = [
    { id: 1n, user_id: 6n, qualifications: 'MBBS, FCPS (Cardiology)', specialization: 'Cardiology', license_no: 'PMC-12948-C', bio: 'Senior Cardiologist with over 12 years of experience in interventional cardiology and preventive heart care.', is_active: true },
    { id: 2n, user_id: 7n, qualifications: 'MBBS, MD (Pediatrics)', specialization: 'Pediatrics', license_no: 'PMC-45812-P', bio: 'Specialist pediatrician dedicated to newborn care, childhood immunizations, and developmental health.', is_active: true },
    { id: 3n, user_id: 8n, qualifications: 'MBBS, MCPS (Dermatology)', specialization: 'Dermatology', license_no: 'PMC-98231-D', bio: 'Board-certified dermatologist specializing in aesthetic dermatology, acne treatments, and skin disorders.', is_active: true },
    { id: 4n, user_id: 9n, qualifications: 'MBBS, FCPS (Ophthalmology)', specialization: 'Ophthalmology', license_no: 'PMC-65780-O', bio: 'Expert Eye Specialist focusing on cataract surgery, refractive errors, and corneal diseases.', is_active: true },
    { id: 5n, user_id: 10n, qualifications: 'MBBS, MRCP (UK), FCPS', specialization: 'Cardiology', license_no: 'PMC-33412-C', bio: 'Consultant Cardiologist specializing in echocardiography and cardiovascular rehabilitation.', is_active: true },
    { id: 6n, user_id: 11n, qualifications: 'BDS, RDS, FCPS (Orthodontics)', specialization: 'Dentistry', license_no: 'PMC-77123-D', bio: 'Orthodontist and dental surgeon focused on cosmetic dentistry, braces, and oral hygiene.', is_active: true },
    { id: 7n, user_id: 12n, qualifications: 'MBBS, MRCGP (UK)', specialization: 'General Medicine', license_no: 'PMC-88419-G', bio: 'Family medicine consultant with comprehensive experience in chronic disease management and wellness checkups.', is_active: true },
    { id: 8n, user_id: 32n, qualifications: 'MBBS, FCPS', specialization: 'General Practice', license_no: 'PMC-00001-D', bio: 'Demo clinic doctor practitioner', is_active: true },
  ];

  for (const doc of doctorProfilesData) {
    const existing = await prisma.doctor_profiles.findFirst({ where: { user_id: doc.user_id } });
    if (existing) {
      await prisma.doctor_profiles.update({ where: { id: existing.id }, data: doc });
    } else {
      await prisma.doctor_profiles.create({ data: doc });
    }
  }

  // 6. DOCTOR CLINICS
  console.log('Seeding doctor clinics...');
  const doctorClinicsData = [
    { id: 1n, doctor_id: 6n, clinic_id: 1n, is_active: true, joined_at: new Date('2025-01-10T09:00:00Z') },
    { id: 2n, doctor_id: 12n, clinic_id: 1n, is_active: true, joined_at: new Date('2025-01-15T09:00:00Z') },
    { id: 3n, doctor_id: 7n, clinic_id: 2n, is_active: true, joined_at: new Date('2025-02-01T09:00:00Z') },
    { id: 4n, doctor_id: 8n, clinic_id: 2n, is_active: true, joined_at: new Date('2025-02-10T09:00:00Z') },
    { id: 5n, doctor_id: 9n, clinic_id: 3n, is_active: true, joined_at: new Date('2025-03-01T09:00:00Z') },
    { id: 6n, doctor_id: 10n, clinic_id: 4n, is_active: true, joined_at: new Date('2025-03-15T09:00:00Z') },
    { id: 7n, doctor_id: 11n, clinic_id: 5n, is_active: true, joined_at: new Date('2025-04-01T09:00:00Z') },
  ];

  try {
    if (prisma.doctor_clinics) {
      for (const dc of doctorClinicsData) {
        await prisma.doctor_clinics.upsert({
          where: { id: dc.id },
          update: dc,
          create: dc,
        });
      }
    }
  } catch (err) {
    console.log('⚠️ Skipping doctor_clinics table insertion (table not found in database)');
  }

  // 7. FRONT DESK STAFF
  console.log('Seeding front desk staff...');
  const frontDeskData = [
    { id: 1n, user_id: 13n, shift: 'Morning (08:00 AM - 04:00 PM)', status: 'active' },
    { id: 2n, user_id: 14n, shift: 'Morning (08:00 AM - 04:00 PM)', status: 'active' },
    { id: 3n, user_id: 15n, shift: 'Evening (04:00 PM - 12:00 AM)', status: 'active' },
    { id: 4n, user_id: 16n, shift: 'Morning (08:00 AM - 04:00 PM)', status: 'active' },
    { id: 5n, user_id: 33n, shift: 'Morning (08:00 AM - 04:00 PM)', status: 'active' },
  ];

  for (const fd of frontDeskData) {
    const existing = await prisma.front_desk_staff.findFirst({ where: { user_id: fd.user_id } });
    if (existing) {
      await prisma.front_desk_staff.update({ where: { id: existing.id }, data: fd });
    } else {
      await prisma.front_desk_staff.create({ data: fd });
    }
  }

  // 8. PATIENT PROFILES
  console.log('Seeding patient profiles...');
  const patientProfilesData = [
    { id: 1n, user_id: 17n, medical_record_no: 'MRN-2025-001', blood_group: 'O+', emergency_contact: { name: 'Talat Mahmood', phone: '+923316412655', relation: 'Father' }, extra: { address: 'House 24, Block L, Cantt View Housing Scheme, Lahore' } },
    { id: 2n, user_id: 18n, medical_record_no: 'MRN-2025-002', blood_group: 'AB+', emergency_contact: { name: 'Sajid Khan', phone: '+923164257645', relation: 'Brother' }, extra: { address: 'Flat 302, Royal Apartments, Gulberg, Lahore' } },
    { id: 3n, user_id: 19n, medical_record_no: 'MRN-2025-003', blood_group: 'B+', emergency_contact: { name: 'Asim Saqib', phone: '+923004567891', relation: 'Brother' }, extra: { address: 'House 12, Street 4, Sector F-7, Islamabad' } },
    { id: 4n, user_id: 20n, medical_record_no: 'MRN-2025-004', blood_group: 'A+', emergency_contact: { name: 'Tariq Raza', phone: '+923214567890', relation: 'Father' }, extra: { address: 'House 55, Block C, Model Town, Lahore' } },
    { id: 5n, user_id: 21n, medical_record_no: 'MRN-2025-005', blood_group: 'A-', emergency_contact: { name: 'Rashid Ghani', phone: '+923335551234', relation: 'Father' }, extra: { address: 'House 89, Sector G-9/2, Islamabad' } },
    { id: 6n, user_id: 22n, medical_record_no: 'MRN-2025-006', blood_group: 'O-', emergency_contact: { name: 'Kamran Hussain', phone: '+923019876543', relation: 'Husband' }, extra: { address: 'Villa 14, Bahria Town, Lahore' } },
    { id: 7n, user_id: 23n, medical_record_no: 'MRN-2025-007', blood_group: 'B-', emergency_contact: { name: 'Mahmood Ahmed', phone: '+923123456789', relation: 'Father' }, extra: { address: 'House 10, Canal View, Lahore' } },
    { id: 8n, user_id: 24n, medical_record_no: 'MRN-2025-008', blood_group: 'AB-', emergency_contact: { name: 'Muhammad Akram', phone: '+923056789012', relation: 'Husband' }, extra: { address: 'House 77, Satellite Town, Rawalpindi' } },
    { id: 9n, user_id: 25n, medical_record_no: 'MRN-2025-009', blood_group: 'O+', emergency_contact: { name: 'Farooq Azam', phone: '+923456789012', relation: 'Father' }, extra: { address: 'House 30, Clifton Block 5, Karachi' } },
    { id: 10n, user_id: 26n, medical_record_no: 'MRN-2025-010', blood_group: 'A+', emergency_contact: { name: 'Imran Nazir', phone: '+923023456789', relation: 'Husband' }, extra: { address: 'House 45, Johar Town, Lahore' } },
    { id: 11n, user_id: 27n, medical_record_no: 'MRN-2025-011', blood_group: 'B+', emergency_contact: { name: 'Bilal Chaudhry', phone: '+923134567890', relation: 'Brother' }, extra: { address: 'House 18, Phase 3 DHA, Lahore' } },
    { id: 12n, user_id: 28n, medical_record_no: 'MRN-2025-012', blood_group: 'O+', emergency_contact: { name: 'Tariq Mahmood', phone: '+923245678901', relation: 'Husband' }, extra: { address: 'House 9, Westridge 2, Rawalpindi' } },
    { id: 13n, user_id: 29n, medical_record_no: 'MRN-2025-013', blood_group: 'AB+', emergency_contact: { name: 'Ashraf Ali', phone: '+923356789012', relation: 'Father' }, extra: { address: 'House 62, DHA Phase 6, Karachi' } },
    { id: 14n, user_id: 30n, medical_record_no: 'MRN-2025-014', blood_group: 'A-', emergency_contact: { name: 'Zubair Sheikh', phone: '+923067890123', relation: 'Brother' }, extra: { address: 'House 21, Askari 10, Lahore' } },
    { id: 15n, user_id: 34n, medical_record_no: 'MRN-DEMO-001', blood_group: 'O+', emergency_contact: { name: 'Emergency Contact', phone: '+923000000000', relation: 'Family' }, extra: { address: 'Demo Address, Lahore' } },
  ];

  for (const p of patientProfilesData) {
    const existing = await prisma.patient_profiles.findFirst({ where: { user_id: p.user_id } });
    if (existing) {
      await prisma.patient_profiles.update({ where: { id: existing.id }, data: p });
    } else {
      await prisma.patient_profiles.create({ data: p });
    }
  }

  // 9. APPOINTMENTS
  console.log('Seeding appointments...');
  const appointmentsData = [
    { id: 1n, clinic_id: 1n, patient_user_id: 17n, doctor_user_id: 6n, created_by: 13n, scheduled_at: new Date('2025-10-25T09:00:00Z'), token_number: 1, token_date: new Date('2025-10-25'), status: 'completed', payment_status: 'paid', appointment_fee: 2000.00, notes: 'Routine cardiac evaluation. Blood pressure normal.', extra: { reason: 'Routine Checkup' } },
    { id: 2n, clinic_id: 1n, patient_user_id: 18n, doctor_user_id: 6n, created_by: 13n, scheduled_at: new Date('2025-10-25T09:30:00Z'), token_number: 2, token_date: new Date('2025-10-25'), status: 'completed', payment_status: 'paid', appointment_fee: 2000.00, notes: 'ECG performed. Mild sinus tachycardia noted. Rest advised.', extra: { reason: 'Chest Discomfort' } },
    { id: 3n, clinic_id: 1n, patient_user_id: 23n, doctor_user_id: 12n, created_by: 13n, scheduled_at: new Date('2025-10-25T10:00:00Z'), token_number: 3, token_date: new Date('2025-10-25'), status: 'completed', payment_status: 'paid', appointment_fee: 1500.00, notes: 'General health screening. Vitamin D supplement prescribed.', extra: { reason: 'Fatigue and weakness' } },
    { id: 4n, clinic_id: 2n, patient_user_id: 19n, doctor_user_id: 7n, created_by: 14n, scheduled_at: new Date('2025-10-25T10:30:00Z'), token_number: 1, token_date: new Date('2025-10-25'), status: 'completed', payment_status: 'paid', appointment_fee: 1800.00, notes: 'Pediatric vaccination and growth monitoring. Healthy child.', extra: { reason: 'Child Vaccination' } },
    { id: 5n, clinic_id: 2n, patient_user_id: 20n, doctor_user_id: 8n, created_by: 14n, scheduled_at: new Date('2025-10-25T11:00:00Z'), token_number: 2, token_date: new Date('2025-10-25'), status: 'completed', payment_status: 'paid', appointment_fee: 2500.00, notes: 'Acne vulgaris consultation. Topical gel and oral antibiotics prescribed.', extra: { reason: 'Skin Rash' } },
    { id: 6n, clinic_id: 3n, patient_user_id: 21n, doctor_user_id: 9n, created_by: 15n, scheduled_at: new Date('2025-10-26T09:00:00Z'), token_number: 1, token_date: new Date('2025-10-26'), status: 'completed', payment_status: 'paid', appointment_fee: 1500.00, notes: 'Eye vision exam. Prescribed corrective lenses (-1.25 D).', extra: { reason: 'Blurry Vision' } },
    { id: 7n, clinic_id: 3n, patient_user_id: 22n, doctor_user_id: 9n, created_by: 15n, scheduled_at: new Date('2025-10-26T09:30:00Z'), token_number: 2, token_date: new Date('2025-10-26'), status: 'completed', payment_status: 'paid', appointment_fee: 1500.00, notes: 'Dry eyes syndrome. Hydrating eye drops prescribed.', extra: { reason: 'Eye Irritation' } },
    { id: 8n, clinic_id: 4n, patient_user_id: 25n, doctor_user_id: 10n, created_by: 16n, scheduled_at: new Date('2025-10-26T10:30:00Z'), token_number: 1, token_date: new Date('2025-10-26'), status: 'completed', payment_status: 'paid', appointment_fee: 3000.00, notes: 'Echocardiogram clear. Patient advised to reduce salt intake.', extra: { reason: 'Palpitations' } },
    { id: 9n, clinic_id: 5n, patient_user_id: 28n, doctor_user_id: 11n, created_by: 11n, scheduled_at: new Date('2025-10-26T11:00:00Z'), token_number: 1, token_date: new Date('2025-10-26'), status: 'completed', payment_status: 'paid', appointment_fee: 3500.00, notes: 'Dental cleaning and cavity filling completed successfully.', extra: { reason: 'Toothache' } },
    { id: 10n, clinic_id: 1n, patient_user_id: 26n, doctor_user_id: 6n, created_by: 13n, scheduled_at: new Date('2025-10-27T09:00:00Z'), token_number: 1, token_date: new Date('2025-10-27'), status: 'in_consult', payment_status: 'paid', appointment_fee: 2000.00, notes: 'Hypertension follow-up. Adjusting dosage of Amlodipine.', extra: { reason: 'Hypertension Followup' } },
    { id: 11n, clinic_id: 1n, patient_user_id: 30n, doctor_user_id: 12n, created_by: 13n, scheduled_at: new Date('2025-10-27T09:30:00Z'), token_number: 2, token_date: new Date('2025-10-27'), status: 'checked_in', payment_status: 'unpaid', appointment_fee: 1500.00, notes: 'Patient waiting for general physical consultation.', extra: { reason: 'Fever & Cold' } },
    { id: 12n, clinic_id: 2n, patient_user_id: 24n, doctor_user_id: 7n, created_by: 14n, scheduled_at: new Date('2025-10-27T10:00:00Z'), token_number: 1, token_date: new Date('2025-10-27'), status: 'scheduled', payment_status: 'unpaid', appointment_fee: 1800.00, notes: 'Pediatric consultation for allergic rhinitis.', extra: { reason: 'Seasonal Allergy' } },
    { id: 13n, clinic_id: 2n, patient_user_id: 20n, doctor_user_id: 8n, created_by: 14n, scheduled_at: new Date('2025-10-27T10:30:00Z'), token_number: 2, token_date: new Date('2025-10-27'), status: 'scheduled', payment_status: 'paid', appointment_fee: 2500.00, notes: 'Dermatology follow-up visit.', extra: { reason: 'Acne Checkup' } },
    { id: 14n, clinic_id: 3n, patient_user_id: 27n, doctor_user_id: 9n, created_by: 15n, scheduled_at: new Date('2025-10-27T11:00:00Z'), token_number: 1, token_date: new Date('2025-10-27'), status: 'scheduled', payment_status: 'unpaid', appointment_fee: 1500.00, notes: 'Slit-lamp exam scheduled.', extra: { reason: 'Redness in Left Eye' } },
    { id: 15n, clinic_id: 4n, patient_user_id: 29n, doctor_user_id: 10n, created_by: 16n, scheduled_at: new Date('2025-10-27T11:30:00Z'), token_number: 1, token_date: new Date('2025-10-27'), status: 'cancelled', payment_status: 'unpaid', appointment_fee: 3000.00, notes: 'Patient cancelled due to personal travel.', extra: { reason: 'Routine Cardiac Check' } },
    { id: 16n, clinic_id: 1n, patient_user_id: 17n, doctor_user_id: 6n, created_by: 13n, scheduled_at: new Date('2025-11-05T09:00:00Z'), token_number: 1, token_date: new Date('2025-11-05'), status: 'scheduled', payment_status: 'unpaid', appointment_fee: 2000.00, notes: 'Upcoming 2-week cardiac progress check.', extra: { reason: 'Cardiac Followup' } },
    { id: 17n, clinic_id: 1n, patient_user_id: 18n, doctor_user_id: 12n, created_by: 13n, scheduled_at: new Date('2025-11-05T09:30:00Z'), token_number: 2, token_date: new Date('2025-11-05'), status: 'scheduled', payment_status: 'unpaid', appointment_fee: 1500.00, notes: 'Upcoming blood panel lab review.', extra: { reason: 'Lab Report Review' } },
    { id: 18n, clinic_id: 2n, patient_user_id: 19n, doctor_user_id: 7n, created_by: 14n, scheduled_at: new Date('2025-11-05T10:00:00Z'), token_number: 1, token_date: new Date('2025-11-05'), status: 'scheduled', payment_status: 'unpaid', appointment_fee: 1800.00, notes: 'Child nutrition consultation.', extra: { reason: 'Dietary Advice' } },
    { id: 19n, clinic_id: 3n, patient_user_id: 21n, doctor_user_id: 9n, created_by: 15n, scheduled_at: new Date('2025-11-06T09:00:00Z'), token_number: 1, token_date: new Date('2025-11-06'), status: 'scheduled', payment_status: 'unpaid', appointment_fee: 1500.00, notes: 'Glaucoma screening.', extra: { reason: 'Pressure Test' } },
    { id: 20n, clinic_id: 5n, patient_user_id: 28n, doctor_user_id: 11n, created_by: 11n, scheduled_at: new Date('2025-11-06T10:30:00Z'), token_number: 1, token_date: new Date('2025-11-06'), status: 'scheduled', payment_status: 'unpaid', appointment_fee: 3500.00, notes: 'Orthodontic adjustment and braces tightening.', extra: { reason: 'Braces Check' } },
    // Demo Account Specific Appointments (For doctor@clinic.com, desk@clinic.com, patient@clinic.com)
    { id: 21n, clinic_id: 1n, patient_user_id: 34n, doctor_user_id: 32n, created_by: 33n, scheduled_at: new Date('2025-10-28T09:00:00Z'), token_number: 1, token_date: new Date('2025-10-28'), status: 'completed', payment_status: 'paid', appointment_fee: 2500.00, notes: 'Initial demo consultation. General health assessment complete.', extra: { reason: 'Routine Physical Exam' } },
    { id: 22n, clinic_id: 1n, patient_user_id: 17n, doctor_user_id: 32n, created_by: 33n, scheduled_at: new Date('2025-10-28T10:00:00Z'), token_number: 2, token_date: new Date('2025-10-28'), status: 'in_consult', payment_status: 'paid', appointment_fee: 2500.00, notes: 'Follow-up for lab tests review.', extra: { reason: 'Blood Test Results' } },
    { id: 23n, clinic_id: 1n, patient_user_id: 18n, doctor_user_id: 32n, created_by: 33n, scheduled_at: new Date('2025-10-28T11:00:00Z'), token_number: 3, token_date: new Date('2025-10-28'), status: 'checked_in', payment_status: 'unpaid', appointment_fee: 2500.00, notes: 'Patient checked in at front desk, awaiting doctor.', extra: { reason: 'General Checkup' } },
    { id: 24n, clinic_id: 1n, patient_user_id: 34n, doctor_user_id: 6n, created_by: 33n, scheduled_at: new Date('2025-11-10T10:00:00Z'), token_number: 1, token_date: new Date('2025-11-10'), status: 'scheduled', payment_status: 'unpaid', appointment_fee: 2000.00, notes: 'Upcoming demo appointment with cardiologist.', extra: { reason: 'Cardiology Followup' } },
  ];

  for (const app of appointmentsData) {
    await prisma.appointments.upsert({
      where: { id: app.id },
      update: app,
      create: app,
    });
  }

  // 10. CLINIC SALES
  console.log('Seeding clinic sales...');
  const salesData = [
    { id: 1n, clinic_id: 1n, appointment_id: 1n, patient_user_id: 17n, created_by: 13n, amount: 2000.00, currency: 'PKR', payment_method: 'cash', status: 'completed', recorded_at: new Date('2025-10-25T08:30:00Z'), notes: 'Payment for Appointment #1 - Dr. Waleed Ahmad' },
    { id: 2n, clinic_id: 1n, appointment_id: 2n, patient_user_id: 18n, created_by: 13n, amount: 2000.00, currency: 'PKR', payment_method: 'card', status: 'completed', recorded_at: new Date('2025-10-25T08:45:00Z'), notes: 'Payment for Appointment #2 - Dr. Waleed Ahmad' },
    { id: 3n, clinic_id: 1n, appointment_id: 3n, patient_user_id: 23n, created_by: 13n, amount: 1500.00, currency: 'PKR', payment_method: 'cash', status: 'completed', recorded_at: new Date('2025-10-25T09:15:00Z'), notes: 'Payment for Appointment #3 - Dr. Zainab Akhtar' },
    { id: 4n, clinic_id: 2n, appointment_id: 4n, patient_user_id: 19n, created_by: 14n, amount: 1800.00, currency: 'PKR', payment_method: 'mobile_wallet', status: 'completed', recorded_at: new Date('2025-10-25T09:30:00Z'), notes: 'Payment for Appointment #4 - Dr. Ayesha Malik' },
    { id: 5n, clinic_id: 2n, appointment_id: 5n, patient_user_id: 20n, created_by: 14n, amount: 2500.00, currency: 'PKR', payment_method: 'card', status: 'completed', recorded_at: new Date('2025-10-25T10:00:00Z'), notes: 'Payment for Appointment #5 - Dr. Bilawal Shah' },
    { id: 6n, clinic_id: 3n, appointment_id: 6n, patient_user_id: 21n, created_by: 15n, amount: 1500.00, currency: 'PKR', payment_method: 'cash', status: 'completed', recorded_at: new Date('2025-10-26T08:20:00Z'), notes: 'Payment for Appointment #6 - Dr. Shoaib Abbas' },
    { id: 7n, clinic_id: 3n, appointment_id: 7n, patient_user_id: 22n, created_by: 15n, amount: 1500.00, currency: 'PKR', payment_method: 'bank_transfer', status: 'completed', recorded_at: new Date('2025-10-26T08:50:00Z'), notes: 'Payment for Appointment #7 - Dr. Shoaib Abbas' },
    { id: 8n, clinic_id: 4n, appointment_id: 8n, patient_user_id: 25n, created_by: 16n, amount: 3000.00, currency: 'PKR', payment_method: 'card', status: 'completed', recorded_at: new Date('2025-10-26T09:40:00Z'), notes: 'Payment for Appointment #8 - Dr. Fatima Noor' },
    { id: 9n, clinic_id: 5n, appointment_id: 9n, patient_user_id: 28n, created_by: 11n, amount: 3500.00, currency: 'PKR', payment_method: 'cash', status: 'completed', recorded_at: new Date('2025-10-26T10:10:00Z'), notes: 'Payment for Appointment #9 - Dr. Hamza Raza' },
    { id: 10n, clinic_id: 1n, appointment_id: 10n, patient_user_id: 26n, created_by: 13n, amount: 2000.00, currency: 'PKR', payment_method: 'cash', status: 'completed', recorded_at: new Date('2025-10-27T08:30:00Z'), notes: 'Payment for Appointment #10 - Dr. Waleed Ahmad' },
    { id: 11n, clinic_id: 2n, appointment_id: 13n, patient_user_id: 20n, created_by: 14n, amount: 2500.00, currency: 'PKR', payment_method: 'card', status: 'completed', recorded_at: new Date('2025-10-27T09:15:00Z'), notes: 'Payment for Appointment #13 - Dr. Bilawal Shah' },
    { id: 12n, clinic_id: 1n, appointment_id: 21n, patient_user_id: 34n, created_by: 33n, amount: 2500.00, currency: 'PKR', payment_method: 'cash', status: 'completed', recorded_at: new Date('2025-10-28T08:30:00Z'), notes: 'Payment for Appointment #21 - Dr. General Doctor' },
    { id: 13n, clinic_id: 1n, appointment_id: 22n, patient_user_id: 17n, created_by: 33n, amount: 2500.00, currency: 'PKR', payment_method: 'card', status: 'completed', recorded_at: new Date('2025-10-28T09:45:00Z'), notes: 'Payment for Appointment #22 - Dr. General Doctor' },
  ];

  for (const sale of salesData) {
    await prisma.clinic_sales.upsert({
      where: { id: sale.id },
      update: sale,
      create: sale,
    });
  }

  // 11. CLINIC TOKEN COUNTERS
  console.log('Seeding clinic token counters...');
  const countersData = [
    { clinic_id: 1n, token_date: new Date('2025-10-25'), last_token: 3 },
    { clinic_id: 1n, token_date: new Date('2025-10-27'), last_token: 2 },
    { clinic_id: 1n, token_date: new Date('2025-11-05'), last_token: 2 },
    { clinic_id: 2n, token_date: new Date('2025-10-25'), last_token: 2 },
    { clinic_id: 2n, token_date: new Date('2025-10-27'), last_token: 2 },
    { clinic_id: 2n, token_date: new Date('2025-11-05'), last_token: 1 },
    { clinic_id: 3n, token_date: new Date('2025-10-26'), last_token: 2 },
    { clinic_id: 3n, token_date: new Date('2025-10-27'), last_token: 1 },
    { clinic_id: 3n, token_date: new Date('2025-11-06'), last_token: 1 },
    { clinic_id: 4n, token_date: new Date('2025-10-26'), last_token: 1 },
    { clinic_id: 4n, token_date: new Date('2025-10-27'), last_token: 1 },
    { clinic_id: 5n, token_date: new Date('2025-10-26'), last_token: 1 },
    { clinic_id: 5n, token_date: new Date('2025-11-06'), last_token: 1 },
  ];

  for (const counter of countersData) {
    await prisma.clinic_token_counters.upsert({
      where: {
        clinic_id_token_date: {
          clinic_id: counter.clinic_id,
          token_date: counter.token_date,
        },
      },
      update: counter,
      create: counter,
    });
  }

  // 12. SCHEDULE
  console.log('Seeding doctor schedules...');
  const scheduleData = [
    {
      schedule_id: 1,
      doctor_id: 6,
      clinic_id: 1,
      monday: { start_time: '09:00', end_time: '14:00', is_available: true, slot_duration: 30 },
      tuesday: { start_time: '09:00', end_time: '14:00', is_available: true, slot_duration: 30 },
      wednesday: { start_time: '09:00', end_time: '14:00', is_available: true, slot_duration: 30 },
      thursday: { start_time: '09:00', end_time: '14:00', is_available: true, slot_duration: 30 },
      friday: { start_time: '09:00', end_time: '12:30', is_available: true, slot_duration: 30 },
      saturday: { start_time: '10:00', end_time: '13:00', is_available: true, slot_duration: 30 },
      sunday: { start_time: null, end_time: null, is_available: false, slot_duration: 30 },
    },
    {
      schedule_id: 2,
      doctor_id: 12,
      clinic_id: 1,
      monday: { start_time: '14:00', end_time: '18:00', is_available: true, slot_duration: 20 },
      tuesday: { start_time: '14:00', end_time: '18:00', is_available: true, slot_duration: 20 },
      wednesday: { start_time: '14:00', end_time: '18:00', is_available: true, slot_duration: 20 },
      thursday: { start_time: '14:00', end_time: '18:00', is_available: true, slot_duration: 20 },
      friday: { start_time: '14:00', end_time: '18:00', is_available: true, slot_duration: 20 },
      saturday: { start_time: null, end_time: null, is_available: false, slot_duration: 20 },
      sunday: { start_time: null, end_time: null, is_available: false, slot_duration: 20 },
    },
    {
      schedule_id: 3,
      doctor_id: 7,
      clinic_id: 2,
      monday: { start_time: '09:00', end_time: '15:00', is_available: true, slot_duration: 30 },
      tuesday: { start_time: '09:00', end_time: '15:00', is_available: true, slot_duration: 30 },
      wednesday: { start_time: '09:00', end_time: '15:00', is_available: true, slot_duration: 30 },
      thursday: { start_time: '09:00', end_time: '15:00', is_available: true, slot_duration: 30 },
      friday: { start_time: '09:00', end_time: '13:00', is_available: true, slot_duration: 30 },
      saturday: { start_time: null, end_time: null, is_available: false, slot_duration: 30 },
      sunday: { start_time: null, end_time: null, is_available: false, slot_duration: 30 },
    },
    {
      schedule_id: 4,
      doctor_id: 8,
      clinic_id: 2,
      monday: { start_time: '15:00', end_time: '20:00', is_available: true, slot_duration: 30 },
      tuesday: { start_time: '15:00', end_time: '20:00', is_available: true, slot_duration: 30 },
      wednesday: { start_time: '15:00', end_time: '20:00', is_available: true, slot_duration: 30 },
      thursday: { start_time: '15:00', end_time: '20:00', is_available: true, slot_duration: 30 },
      friday: { start_time: '15:00', end_time: '20:00', is_available: true, slot_duration: 30 },
      saturday: { start_time: '16:00', end_time: '20:00', is_available: true, slot_duration: 30 },
      sunday: { start_time: null, end_time: null, is_available: false, slot_duration: 30 },
    },
    {
      schedule_id: 5,
      doctor_id: 9,
      clinic_id: 3,
      monday: { start_time: '09:00', end_time: '14:00', is_available: true, slot_duration: 20 },
      tuesday: { start_time: '09:00', end_time: '14:00', is_available: true, slot_duration: 20 },
      wednesday: { start_time: '09:00', end_time: '14:00', is_available: true, slot_duration: 20 },
      thursday: { start_time: '09:00', end_time: '14:00', is_available: true, slot_duration: 20 },
      friday: { start_time: '09:00', end_time: '12:30', is_available: true, slot_duration: 20 },
      saturday: { start_time: null, end_time: null, is_available: false, slot_duration: 20 },
      sunday: { start_time: null, end_time: null, is_available: false, slot_duration: 20 },
    },
    {
      schedule_id: 6,
      doctor_id: 10,
      clinic_id: 4,
      monday: { start_time: '10:00', end_time: '16:00', is_available: true, slot_duration: 30 },
      tuesday: { start_time: '10:00', end_time: '16:00', is_available: true, slot_duration: 30 },
      wednesday: { start_time: '10:00', end_time: '16:00', is_available: true, slot_duration: 30 },
      thursday: { start_time: '10:00', end_time: '16:00', is_available: true, slot_duration: 30 },
      friday: { start_time: '10:00', end_time: '14:00', is_available: true, slot_duration: 30 },
      saturday: { start_time: null, end_time: null, is_available: false, slot_duration: 30 },
      sunday: { start_time: null, end_time: null, is_available: false, slot_duration: 30 },
    },
    {
      schedule_id: 7,
      doctor_id: 11,
      clinic_id: 5,
      monday: { start_time: '11:00', end_time: '17:00', is_available: true, slot_duration: 30 },
      tuesday: { start_time: '11:00', end_time: '17:00', is_available: true, slot_duration: 30 },
      wednesday: { start_time: '11:00', end_time: '17:00', is_available: true, slot_duration: 30 },
      thursday: { start_time: '11:00', end_time: '17:00', is_available: true, slot_duration: 30 },
      friday: { start_time: '11:00', end_time: '17:00', is_available: true, slot_duration: 30 },
      saturday: { start_time: '11:00', end_time: '15:00', is_available: true, slot_duration: 30 },
      sunday: { start_time: null, end_time: null, is_available: false, slot_duration: 30 },
    },
  ];

  try {
    if (prisma.schedule) {
      for (const sched of scheduleData) {
        await prisma.schedule.upsert({
          where: { schedule_id: sched.schedule_id },
          update: sched,
          create: sched,
        });
      }
    }
  } catch (err) {
    console.log('⚠️ Skipping schedule table insertion (table not found in database)');
  }

  console.log('✅ Realistic data seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
