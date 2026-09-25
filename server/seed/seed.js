import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Branch from '../models/Branch.js';
import Person from '../models/Person.js';
import GarmentType from '../models/GarmentType.js';
import MeasurementField from '../models/MeasurementField.js';
import MeasurementTemplate from '../models/MeasurementTemplate.js';
import Measurement from '../models/Measurement.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();
dotenv.config({ path: '../.env' });

export const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('--- Starting Database Seeding ---');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Branch.deleteMany({}),
      Person.deleteMany({}),
      GarmentType.deleteMany({}),
      MeasurementField.deleteMany({}),
      MeasurementTemplate.deleteMany({}),
      Measurement.deleteMany({}),
      Order.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('Cleared existing collections.');

    // 1. Seed Users
    const users = await User.create([
      {
        name: 'Krishna (Super Admin)',
        email: 'admin@example.com',
        username: 'admin',
        password: 'Admin@123',
        role: 'super_admin',
        phone: '+91 98765 43210',
      },
      {
        name: 'Mehul Mehta (Admin)',
        email: 'mehul.admin@example.com',
        username: 'mehul',
        password: 'Admin@123',
        role: 'admin',
        phone: '+91 98765 43211',
      },
      {
        name: 'Suresh Tailor (Measurement Staff)',
        email: 'measurer@example.com',
        username: 'measurer',
        password: 'User@123',
        role: 'measurement_user',
        phone: '+91 98765 43212',
      },
      {
        name: 'Ramesh Production (Production Master)',
        email: 'production@example.com',
        username: 'production',
        password: 'User@123',
        role: 'production_user',
        phone: '+91 98765 43213',
      },
    ]);

    const adminUser = users[0];
    console.log(`Seeded ${users.length} users.`);

    // 2. Seed Organizations
    const sanjiviniOrg = await Organization.create({
      name: 'Sanjivini Hospital',
      code: 'SANJ01',
      type: 'Hospital',
      contactPerson: 'Dr. Kirit Shah',
      contactNumber: '+91 98250 11223',
      email: 'contact@sanjivinihospital.com',
      address: 'Race Course Road, Opp. Medical College',
      city: 'Vadodara',
      state: 'Gujarat',
      country: 'India',
      pincode: '390007',
      status: 'Active',
      notes: 'Leading multi-speciality hospital with 400+ staff uniforms requirement.',
    });

    const bankerOrg = await Organization.create({
      name: 'Banker Heart Hospital',
      code: 'BANK01',
      type: 'Hospital',
      contactPerson: 'Mr. Pranav Banker',
      contactNumber: '+91 98251 33445',
      email: 'admin@bankerheart.com',
      address: 'Near Old Padra Road',
      city: 'Vadodara',
      state: 'Gujarat',
      country: 'India',
      pincode: '390015',
      status: 'Active',
      notes: 'Cardiac institute uniform orders for doctors, nurses and support staff.',
    });

    const abcBankOrg = await Organization.create({
      name: 'ABC National Bank',
      code: 'ABCB01',
      type: 'Bank',
      contactPerson: 'Ms. Anita Saxena',
      contactNumber: '+91 98252 55667',
      email: 'hr@abcbank.co.in',
      address: 'Bandra Kurla Complex, C-54',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400051',
      status: 'Active',
      notes: 'Corporate attire and uniform suits for officers and tellers.',
    });

    const apexOrg = await Organization.create({
      name: 'Apex Manufacturing Industries',
      code: 'APEX01',
      type: 'Factory',
      contactPerson: 'Mr. Rajesh Gaekwad',
      contactNumber: '+91 98253 77889',
      email: 'procurement@apexind.com',
      address: 'GIDC Industrial Estate, Plot 108',
      city: 'Makarpura',
      state: 'Gujarat',
      country: 'India',
      pincode: '390010',
      status: 'Active',
      notes: 'Heavy duty boiler suits and factory worker uniforms.',
    });

    console.log('Seeded 4 organizations.');

    // 3. Seed Branches
    const branches = await Branch.create([
      {
        organization: sanjiviniOrg._id,
        name: 'Vadodara Branch',
        code: 'SANJ-BR-VAD',
        address: 'Race Course Main Campus',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
        contactPerson: 'Mr. Nilesh Joshi',
        contactNumber: '+91 98250 11224',
        email: 'vadodara@sanjivinihospital.com',
      },
      {
        organization: sanjiviniOrg._id,
        name: 'Ahmedabad Branch',
        code: 'SANJ-BR-AHM',
        address: 'SG Highway, Bodakdev',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380054',
        contactPerson: 'Dr. Mona Shah',
        contactNumber: '+91 98250 11225',
        email: 'ahmedabad@sanjivinihospital.com',
      },
      {
        organization: sanjiviniOrg._id,
        name: 'Main Central Campus',
        code: 'SANJ-BR-MAIN',
        address: 'Alkapuri Plaza',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390005',
        contactPerson: 'Mr. Devendra Parmar',
        contactNumber: '+91 98250 11226',
        email: 'central@sanjivinihospital.com',
      },
      {
        organization: bankerOrg._id,
        name: 'Main Campus',
        code: 'BANK-BR-MAIN',
        address: 'Old Padra Road',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390015',
        contactPerson: 'Mr. Tushar Dave',
        contactNumber: '+91 98251 33446',
        email: 'main@bankerheart.com',
      },
      {
        organization: abcBankOrg._id,
        name: 'BKC Corporate Headquarters',
        code: 'ABCB-BR-BKC',
        address: 'Tower 2, BKC',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        contactPerson: 'Mr. Sunil Shetty',
        contactNumber: '+91 98252 55668',
        email: 'bkc@abcbank.co.in',
      },
    ]);

    const sanjiviniVadodaraBranch = branches[0];
    const sanjiviniMainBranch = branches[2];
    const bankerMainBranch = branches[3];
    console.log(`Seeded ${branches.length} branches.`);

    // 4. Seed Measurement Field Masters
    const fieldDefinitions = [
      // Upper Body
      { name: 'Length', code: 'LENGTH', category: 'Upper Body', unit: 'Inch', description: 'Total garment length from shoulder to hem' },
      { name: 'Chest', code: 'CHEST', category: 'Upper Body', unit: 'Inch', description: 'Full circumference around widest part of chest' },
      { name: 'Bust', code: 'BUST', category: 'Upper Body', unit: 'Inch', description: 'Full bust measurement for women' },
      { name: 'Under Bust', code: 'UNDER_BUST', category: "Women's Measurements", unit: 'Inch', description: 'Under-bust ribcage circumference' },
      { name: 'Shoulder', code: 'SHOULDER', category: 'Upper Body', unit: 'Inch', description: 'Shoulder bone to shoulder bone across back' },
      { name: 'Sleeve Length', code: 'SLEEVE_LENGTH', category: 'Upper Body', unit: 'Inch', description: 'From shoulder tip to wrist bone' },
      { name: 'Half Sleeve', code: 'HALF_SLEEVE', category: 'Upper Body', unit: 'Inch', description: 'Shoulder to mid-bicep' },
      { name: 'Full Sleeve', code: 'FULL_SLEEVE', category: 'Upper Body', unit: 'Inch', description: 'Shoulder to cuff' },
      { name: 'Neck', code: 'NECK', category: 'Upper Body', unit: 'Inch', description: 'Collar circumference around base of neck' },
      { name: 'Armhole', code: 'ARMHOLE', category: 'Upper Body', unit: 'Inch', description: 'Armhole circumference around shoulder curve' },
      { name: 'Bicep', code: 'BICEP', category: 'Upper Body', unit: 'Inch', description: 'Around fullest bicep muscle' },
      { name: 'Cuff', code: 'CUFF', category: 'Upper Body', unit: 'Inch', description: 'Wrist cuff circumference' },
      { name: 'Front Length', code: 'FRONT_LENGTH', category: 'Upper Body', unit: 'Inch', description: 'Front collarbone to hem' },
      { name: 'Back Length', code: 'BACK_LENGTH', category: 'Upper Body', unit: 'Inch', description: 'Back neckline to hem' },

      // Lower Body
      { name: 'Pant Length', code: 'PANT_LENGTH', category: 'Lower Body', unit: 'Inch', description: 'Waistband to desired pant bottom hem' },
      { name: 'Waist', code: 'WAIST', category: 'Lower Body', unit: 'Inch', description: 'Circumference where trouser rests' },
      { name: 'Hip', code: 'HIP', category: 'Lower Body', unit: 'Inch', description: 'Fullest part of hips/seat' },
      { name: 'Thigh', code: 'THIGH', category: 'Lower Body', unit: 'Inch', description: 'Fullest part of upper leg' },
      { name: 'Knee', code: 'KNEE', category: 'Lower Body', unit: 'Inch', description: 'Circumference around knee' },
      { name: 'Bottom', code: 'BOTTOM', category: 'Lower Body', unit: 'Inch', description: 'Ankle opening hem circumference' },
      { name: 'Inseam', code: 'INSEAM', category: 'Lower Body', unit: 'Inch', description: 'Crotch seam to hem' },
      { name: 'Outseam', code: 'OUTSEAM', category: 'Lower Body', unit: 'Inch', description: 'Top of waistband down outside leg to floor' },
      { name: 'Rise', code: 'RISE', category: 'Lower Body', unit: 'Inch', description: 'Crotch to waistband height' },

      // Suit / Blazer
      { name: 'Coat Length', code: 'COAT_LENGTH', category: 'Suit / Blazer', unit: 'Inch', description: 'Blazer length from collar seam to hem' },
      { name: 'Back Width', code: 'BACK_WIDTH', category: 'Suit / Blazer', unit: 'Inch', description: 'Across back shoulder blades' },

      // Women's Specific
      { name: 'Kurti Length', code: 'KURTI_LENGTH', category: "Women's Measurements", unit: 'Inch', description: 'Shoulder to kurti hem' },
      { name: 'Dupatta Length', code: 'DUPATTA_LENGTH', category: "Women's Measurements", unit: 'Inch', description: 'Length of matching dupatta' },
    ];

    const fields = await MeasurementField.create(fieldDefinitions);
    console.log(`Seeded ${fields.length} measurement field masters.`);

    const fieldMap = {};
    fields.forEach((f) => {
      fieldMap[f.code] = f;
    });

    // 5. Seed Garment Types
    const garmentDefinitions = [
      // Professional / Uniform & Clothing
      { name: 'Shirt with Fabric', code: 'SHIRT_WITH_FABRIC', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Custom shirt including business fabric' },
      { name: 'Shirt without Fabric', code: 'SHIRT_WITHOUT_FABRIC', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Stitching only with client fabric' },
      { name: 'Pant with Fabric', code: 'PANT_WITH_FABRIC', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Custom trousers including fabric' },
      { name: 'Pant without Fabric', code: 'PANT_WITHOUT_FABRIC', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Trouser stitching only' },
      { name: 'Suit (2 Piece)', code: 'SUIT_2_PIECE', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Blazer and Trouser combination suit' },
      { name: 'Blazer', code: 'BLAZER', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Formal single or double breasted blazer' },
      { name: 'Waistcoat', code: 'WAISTCOAT', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Formal waistcoat / vest' },
      { name: 'Formal Shirt', code: 'FORMAL_SHIRT', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Executive formal shirt' },
      { name: 'Formal Trouser', code: 'FORMAL_TROUSER', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Slim or regular fit formal trousers' },
      { name: 'Kurta', code: 'KURTA', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Ethnic or uniform kurta' },
      { name: 'Kurta Pajama', code: 'KURTA_PAJAMA', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Complete traditional set' },
      { name: 'T-Shirt', code: 'T_SHIRT', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Round neck corporate/staff t-shirt' },
      { name: 'Polo T-Shirt', code: 'POLO_T_SHIRT', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Collared polo t-shirt' },
      { name: 'Jacket', code: 'JACKET', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Winter/safety jacket' },
      { name: 'Shorts', code: 'SHORTS', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Uniform or sports shorts' },
      { name: 'Track Pant', code: 'TRACK_PANT', category: 'Clothing', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Comfort athletic track pants' },

      // Uniforms
      { name: 'Boiler Suit', code: 'BOILER_SUIT', category: 'Uniform', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Industrial one-piece protective coverall' },
      { name: 'Apron', code: 'APRON', category: 'Uniform', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Hospitality & culinary chef apron' },
      { name: 'Lab Coat', code: 'LAB_COAT', category: 'Uniform', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Full length doctor / scientist lab coat' },
      { name: 'Hospital Coat', code: 'HOSPITAL_COAT', category: 'Uniform', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Short medical consultation coat' },
      { name: 'Scrubs', code: 'SCRUBS', category: 'Uniform', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Surgical OT scrub top and bottom' },
      { name: 'School Uniform', code: 'SCHOOL_UNIFORM', category: 'Uniform', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'School uniform set' },
      { name: 'Corporate Uniform', code: 'CORPORATE_UNIFORM', category: 'Uniform', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Corporate uniform ensemble' },
      { name: 'Security Uniform', code: 'SECURITY_UNIFORM', category: 'Uniform', applicableGenders: ['Male', 'Female', 'Unisex'], description: 'Security guard uniform shirt with epaulets and pants' },
    ];

    const garments = await GarmentType.create(garmentDefinitions);
    console.log(`Seeded ${garments.length} garment types.`);

    const garmentMap = {};
    garments.forEach((g) => {
      garmentMap[g.code] = g;
    });

    // 6. Seed Dynamic Measurement Templates
    const templates = await MeasurementTemplate.create([
      // Men's Shirt Template
      {
        name: "Men's Shirt",
        garment: garmentMap['SHIRT_WITH_FABRIC']._id,
        gender: 'Male',
        applicableTypes: ['Doctor', 'Nurse', 'Staff', 'Manager', 'Security', 'All'],
        fields: [
          { field: fieldMap['LENGTH']._id, isRequired: true, displayOrder: 1, unit: 'Inch', minVal: 20, maxVal: 45, helpText: 'From neck base to tail end' },
          { field: fieldMap['CHEST']._id, isRequired: true, displayOrder: 2, unit: 'Inch', minVal: 28, maxVal: 60, helpText: 'Under armpits around fullest chest' },
          { field: fieldMap['SHOULDER']._id, isRequired: true, displayOrder: 3, unit: 'Inch', minVal: 12, maxVal: 28, helpText: 'Shoulder seam to shoulder seam' },
          { field: fieldMap['SLEEVE_LENGTH']._id, isRequired: true, displayOrder: 4, unit: 'Inch', minVal: 18, maxVal: 34, helpText: 'Top of shoulder to wrist cuff' },
          { field: fieldMap['NECK']._id, isRequired: true, displayOrder: 5, unit: 'Inch', minVal: 12, maxVal: 24, helpText: 'Collar circumference' },
          { field: fieldMap['WAIST']._id, isRequired: true, displayOrder: 6, unit: 'Inch', minVal: 24, maxVal: 60, helpText: 'Stomach / waist line' },
          { field: fieldMap['BICEP']._id, isRequired: false, displayOrder: 7, unit: 'Inch', minVal: 10, maxVal: 26, helpText: 'Upper arm bicep' },
          { field: fieldMap['CUFF']._id, isRequired: false, displayOrder: 8, unit: 'Inch', minVal: 7, maxVal: 15, helpText: 'Wrist cuff opening' },
        ],
        description: 'Standard full measurement template for men shirts with dynamic fields.',
      },

      // Men's Pant Template
      {
        name: "Men's Pant / Trouser",
        garment: garmentMap['PANT_WITH_FABRIC']._id,
        gender: 'Male',
        applicableTypes: ['Doctor', 'Nurse', 'Staff', 'Manager', 'Security', 'All'],
        fields: [
          { field: fieldMap['PANT_LENGTH']._id, isRequired: true, displayOrder: 1, unit: 'Inch', minVal: 30, maxVal: 50, helpText: 'Waist to ankle bottom' },
          { field: fieldMap['WAIST']._id, isRequired: true, displayOrder: 2, unit: 'Inch', minVal: 24, maxVal: 60, helpText: 'Trouser waistband line' },
          { field: fieldMap['HIP']._id, isRequired: true, displayOrder: 3, unit: 'Inch', minVal: 28, maxVal: 65, helpText: 'Seat / fullest hip circumference' },
          { field: fieldMap['THIGH']._id, isRequired: true, displayOrder: 4, unit: 'Inch', minVal: 16, maxVal: 36, helpText: 'Upper thigh width' },
          { field: fieldMap['KNEE']._id, isRequired: false, displayOrder: 5, unit: 'Inch', minVal: 14, maxVal: 28, helpText: 'Knee circumference' },
          { field: fieldMap['BOTTOM']._id, isRequired: true, displayOrder: 6, unit: 'Inch', minVal: 12, maxVal: 24, helpText: 'Bottom ankle hem opening' },
          { field: fieldMap['INSEAM']._id, isRequired: false, displayOrder: 7, unit: 'Inch', minVal: 24, maxVal: 40, helpText: 'Inner crotch seam to bottom' },
        ],
        description: 'Standard trousers measurement template for men.',
      },

      // Women's Shirt Template
      {
        name: "Women's Shirt / Top",
        garment: garmentMap['SHIRT_WITH_FABRIC']._id,
        gender: 'Female',
        applicableTypes: ['Doctor', 'Nurse', 'Staff', 'Dietician', 'Manager', 'All'],
        fields: [
          { field: fieldMap['LENGTH']._id, isRequired: true, displayOrder: 1, unit: 'Inch', minVal: 20, maxVal: 40 },
          { field: fieldMap['BUST']._id, isRequired: true, displayOrder: 2, unit: 'Inch', minVal: 28, maxVal: 56 },
          { field: fieldMap['WAIST']._id, isRequired: true, displayOrder: 3, unit: 'Inch', minVal: 22, maxVal: 52 },
          { field: fieldMap['SHOULDER']._id, isRequired: true, displayOrder: 4, unit: 'Inch', minVal: 12, maxVal: 22 },
          { field: fieldMap['SLEEVE_LENGTH']._id, isRequired: true, displayOrder: 5, unit: 'Inch', minVal: 14, maxVal: 30 },
          { field: fieldMap['ARMHOLE']._id, isRequired: false, displayOrder: 6, unit: 'Inch', minVal: 12, maxVal: 26 },
        ],
        description: 'Tailored women shirt & tunic template.',
      },

      // Women's Pant Template
      {
        name: "Women's Trouser / Pant",
        garment: garmentMap['PANT_WITH_FABRIC']._id,
        gender: 'Female',
        applicableTypes: ['Doctor', 'Nurse', 'Staff', 'Dietician', 'All'],
        fields: [
          { field: fieldMap['PANT_LENGTH']._id, isRequired: true, displayOrder: 1, unit: 'Inch', minVal: 30, maxVal: 46 },
          { field: fieldMap['WAIST']._id, isRequired: true, displayOrder: 2, unit: 'Inch', minVal: 22, maxVal: 52 },
          { field: fieldMap['HIP']._id, isRequired: true, displayOrder: 3, unit: 'Inch', minVal: 28, maxVal: 60 },
          { field: fieldMap['THIGH']._id, isRequired: true, displayOrder: 4, unit: 'Inch', minVal: 16, maxVal: 34 },
          { field: fieldMap['BOTTOM']._id, isRequired: true, displayOrder: 5, unit: 'Inch', minVal: 10, maxVal: 22 },
        ],
        description: 'Tailored women trousers template.',
      },

      // Lab Coat Template
      {
        name: 'Doctor & Scientist Lab Coat',
        garment: garmentMap['LAB_COAT']._id,
        gender: 'Unisex',
        applicableTypes: ['Doctor', 'Lab Technician', 'Pharmacist', 'All'],
        fields: [
          { field: fieldMap['LENGTH']._id, isRequired: true, displayOrder: 1, unit: 'Inch', minVal: 34, maxVal: 52, helpText: 'Knee length coat' },
          { field: fieldMap['CHEST']._id, isRequired: true, displayOrder: 2, unit: 'Inch', minVal: 30, maxVal: 60 },
          { field: fieldMap['SHOULDER']._id, isRequired: true, displayOrder: 3, unit: 'Inch', minVal: 13, maxVal: 26 },
          { field: fieldMap['SLEEVE_LENGTH']._id, isRequired: true, displayOrder: 4, unit: 'Inch', minVal: 20, maxVal: 32 },
          { field: fieldMap['NECK']._id, isRequired: false, displayOrder: 5, unit: 'Inch', minVal: 13, maxVal: 24 },
        ],
        description: 'Overcoat template for medical and lab staff.',
      },

      // Scrubs Template
      {
        name: 'OT Medical Scrubs (Top & Bottom)',
        garment: garmentMap['SCRUBS']._id,
        gender: 'Unisex',
        applicableTypes: ['Doctor', 'Nurse', 'Surgeon', 'All'],
        fields: [
          { field: fieldMap['LENGTH']._id, isRequired: true, displayOrder: 1, unit: 'Inch', helpText: 'Scrub top length' },
          { field: fieldMap['CHEST']._id, isRequired: true, displayOrder: 2, unit: 'Inch', helpText: 'Scrub top chest' },
          { field: fieldMap['SHOULDER']._id, isRequired: true, displayOrder: 3, unit: 'Inch', helpText: 'Shoulder width' },
          { field: fieldMap['PANT_LENGTH']._id, isRequired: true, displayOrder: 4, unit: 'Inch', helpText: 'Scrub pant length' },
          { field: fieldMap['WAIST']._id, isRequired: true, displayOrder: 5, unit: 'Inch', helpText: 'Elastic waist circumference' },
          { field: fieldMap['HIP']._id, isRequired: true, displayOrder: 6, unit: 'Inch', helpText: 'Hip circumference' },
        ],
        description: 'Comfortable scrub set template.',
      },

      // Blazer Template
      {
        name: 'Executive Blazer / Suit Coat',
        garment: garmentMap['BLAZER']._id,
        gender: 'Unisex',
        applicableTypes: ['Doctor', 'Manager', 'Executive', 'All'],
        fields: [
          { field: fieldMap['COAT_LENGTH']._id, isRequired: true, displayOrder: 1, unit: 'Inch' },
          { field: fieldMap['CHEST']._id, isRequired: true, displayOrder: 2, unit: 'Inch' },
          { field: fieldMap['WAIST']._id, isRequired: true, displayOrder: 3, unit: 'Inch' },
          { field: fieldMap['SHOULDER']._id, isRequired: true, displayOrder: 4, unit: 'Inch' },
          { field: fieldMap['SLEEVE_LENGTH']._id, isRequired: true, displayOrder: 5, unit: 'Inch' },
          { field: fieldMap['BICEP']._id, isRequired: false, displayOrder: 6, unit: 'Inch' },
          { field: fieldMap['BACK_WIDTH']._id, isRequired: false, displayOrder: 7, unit: 'Inch' },
        ],
        description: 'Tailored blazer template.',
      },
    ]);

    console.log(`Seeded ${templates.length} measurement templates.`);

    // 7. Seed Persons
    const person1 = await Person.create({
      personId: 'SANJ-DOC-001',
      fullName: 'Dr. Rahul Shah',
      gender: 'Male',
      mobileNumber: '+91 98254 11001',
      email: 'rahul.shah@sanjivini.org',
      organization: sanjiviniOrg._id,
      branch: sanjiviniVadodaraBranch._id,
      department: 'Cardiology',
      designation: 'Senior Consultant Cardiologist',
      professionType: 'Doctor',
      notes: 'Prefers slightly loose fit for OT movement.',
    });

    const person2 = await Person.create({
      personId: 'SANJ-NUR-042',
      fullName: 'Priya Patel',
      gender: 'Female',
      mobileNumber: '+91 98254 11002',
      email: 'priya.patel@sanjivini.org',
      organization: sanjiviniOrg._id,
      branch: sanjiviniVadodaraBranch._id,
      department: 'ICU',
      designation: 'Head Nursing Officer',
      professionType: 'Nurse',
      notes: 'Scrubs require side deep pockets.',
    });

    const person3 = await Person.create({
      personId: 'BANK-MGR-007',
      fullName: 'Amit Sharma',
      gender: 'Male',
      mobileNumber: '+91 98254 11003',
      email: 'amit.sharma@bankerheart.com',
      organization: bankerOrg._id,
      branch: bankerMainBranch._id,
      department: 'Operations',
      designation: 'Hospital Administrator',
      professionType: 'Manager',
    });

    const person4 = await Person.create({
      personId: 'SANJ-SEC-012',
      fullName: 'Rajesh Verma',
      gender: 'Male',
      mobileNumber: '+91 98254 11004',
      organization: sanjiviniOrg._id,
      branch: sanjiviniMainBranch._id,
      department: 'Security Services',
      designation: 'Security Supervisor',
      professionType: 'Security',
    });

    const person5 = await Person.create({
      personId: 'BANK-DOC-019',
      fullName: 'Dr. Sneha Desai',
      gender: 'Female',
      mobileNumber: '+91 98254 11005',
      email: 'sneha.desai@bankerheart.com',
      organization: bankerOrg._id,
      branch: bankerMainBranch._id,
      department: 'Pediatrics',
      designation: 'Chief Pediatrician',
      professionType: 'Doctor',
    });

    console.log('Seeded 5 sample persons.');

    // 8. Seed Versioned Measurements for Rahul Shah
    // Version 1 (Earlier date)
    const rahulShirtV1 = await Measurement.create({
      measurementNumber: 'MEA-2609-0001',
      person: person1._id,
      organization: sanjiviniOrg._id,
      branch: sanjiviniVadodaraBranch._id,
      garment: garmentMap['SHIRT_WITH_FABRIC']._id,
      template: templates[0]._id,
      gender: 'Male',
      professionType: 'Doctor',
      unit: 'Inch',
      values: [
        { fieldCode: 'LENGTH', fieldName: 'Length', value: 30, unit: 'Inch' },
        { fieldCode: 'CHEST', fieldName: 'Chest', value: 40, unit: 'Inch' },
        { fieldCode: 'SHOULDER', fieldName: 'Shoulder', value: 18, unit: 'Inch' },
        { fieldCode: 'SLEEVE_LENGTH', fieldName: 'Sleeve Length', value: 24, unit: 'Inch' },
        { fieldCode: 'NECK', fieldName: 'Neck', value: 16, unit: 'Inch' },
        { fieldCode: 'WAIST', fieldName: 'Waist', value: 36, unit: 'Inch' },
      ],
      version: 1,
      isLatest: false,
      status: 'Archived',
      notes: 'Initial fitting on 25 May 2026',
      createdBy: adminUser._id,
      createdAt: new Date('2026-05-25T10:00:00Z'),
    });

    // Version 2 (Latest - Updated Chest & Waist)
    const rahulShirtV2 = await Measurement.create({
      measurementNumber: 'MEA-2609-0002',
      person: person1._id,
      organization: sanjiviniOrg._id,
      branch: sanjiviniVadodaraBranch._id,
      garment: garmentMap['SHIRT_WITH_FABRIC']._id,
      template: templates[0]._id,
      gender: 'Male',
      professionType: 'Doctor',
      unit: 'Inch',
      values: [
        { fieldCode: 'LENGTH', fieldName: 'Length', value: 30, unit: 'Inch' },
        { fieldCode: 'CHEST', fieldName: 'Chest', value: 42, unit: 'Inch' },
        { fieldCode: 'SHOULDER', fieldName: 'Shoulder', value: 18.5, unit: 'Inch' },
        { fieldCode: 'SLEEVE_LENGTH', fieldName: 'Sleeve Length', value: 24, unit: 'Inch' },
        { fieldCode: 'NECK', fieldName: 'Neck', value: 16.5, unit: 'Inch' },
        { fieldCode: 'WAIST', fieldName: 'Waist', value: 38, unit: 'Inch' },
        { fieldCode: 'BICEP', fieldName: 'Bicep', value: 14.5, unit: 'Inch' },
      ],
      version: 2,
      isLatest: true,
      previousVersion: rahulShirtV1._id,
      status: 'Active',
      notes: 'Updated fitting on 25 Sep 2026 - Chest 40 to 42, Waist 36 to 38',
      createdBy: adminUser._id,
      createdAt: new Date('2026-09-25T11:00:00Z'),
    });

    // Rahul Pant
    const rahulPant = await Measurement.create({
      measurementNumber: 'MEA-2609-0003',
      person: person1._id,
      organization: sanjiviniOrg._id,
      branch: sanjiviniVadodaraBranch._id,
      garment: garmentMap['PANT_WITH_FABRIC']._id,
      template: templates[1]._id,
      gender: 'Male',
      professionType: 'Doctor',
      unit: 'Inch',
      values: [
        { fieldCode: 'PANT_LENGTH', fieldName: 'Pant Length', value: 40, unit: 'Inch' },
        { fieldCode: 'WAIST', fieldName: 'Waist', value: 34, unit: 'Inch' },
        { fieldCode: 'HIP', fieldName: 'Hip', value: 40, unit: 'Inch' },
        { fieldCode: 'THIGH', fieldName: 'Thigh', value: 23, unit: 'Inch' },
        { fieldCode: 'BOTTOM', fieldName: 'Bottom', value: 15, unit: 'Inch' },
      ],
      version: 1,
      isLatest: true,
      status: 'Active',
      createdBy: adminUser._id,
    });

    // Priya Patel Scrubs
    const priyaScrubs = await Measurement.create({
      measurementNumber: 'MEA-2609-0004',
      person: person2._id,
      organization: sanjiviniOrg._id,
      branch: sanjiviniVadodaraBranch._id,
      garment: garmentMap['SCRUBS']._id,
      template: templates[5]._id,
      gender: 'Female',
      professionType: 'Nurse',
      unit: 'Inch',
      values: [
        { fieldCode: 'LENGTH', fieldName: 'Length', value: 28, unit: 'Inch' },
        { fieldCode: 'CHEST', fieldName: 'Chest', value: 36, unit: 'Inch' },
        { fieldCode: 'SHOULDER', fieldName: 'Shoulder', value: 15, unit: 'Inch' },
        { fieldCode: 'PANT_LENGTH', fieldName: 'Pant Length', value: 38, unit: 'Inch' },
        { fieldCode: 'WAIST', fieldName: 'Waist', value: 30, unit: 'Inch' },
        { fieldCode: 'HIP', fieldName: 'Hip', value: 38, unit: 'Inch' },
      ],
      version: 1,
      isLatest: true,
      status: 'Active',
      createdBy: adminUser._id,
    });

    console.log('Seeded sample measurements with version history.');

    // 9. Seed Orders
    await Order.create([
      {
        orderNumber: 'ORD-000001',
        organization: sanjiviniOrg._id,
        branch: sanjiviniVadodaraBranch._id,
        person: person1._id,
        items: [
          {
            garment: garmentMap['SHIRT_WITH_FABRIC']._id,
            measurement: rahulShirtV2._id,
            fabricRequired: '2.25 Meters',
            fabricProvidedByCustomer: false,
            quantity: 3,
            price: 1250,
            discount: 150,
            total: 3600,
            notes: 'Sky blue hospital doctor shirts with Sanjivini logo embroidery.',
          },
          {
            garment: garmentMap['PANT_WITH_FABRIC']._id,
            measurement: rahulPant._id,
            fabricRequired: '1.30 Meters',
            fabricProvidedByCustomer: false,
            quantity: 2,
            price: 1400,
            discount: 0,
            total: 2800,
            notes: 'Navy blue formal trousers.',
          },
        ],
        orderDate: new Date('2026-09-20T10:00:00Z'),
        deliveryDate: new Date('2026-10-05T18:00:00Z'),
        status: 'Stitching',
        totalAmount: 6400,
        notes: 'Priority order for new Cardiology department opening.',
        createdBy: adminUser._id,
      },
      {
        orderNumber: 'ORD-000002',
        organization: sanjiviniOrg._id,
        branch: sanjiviniVadodaraBranch._id,
        person: person2._id,
        items: [
          {
            garment: garmentMap['SCRUBS']._id,
            measurement: priyaScrubs._id,
            fabricRequired: '3.0 Meters',
            fabricProvidedByCustomer: false,
            quantity: 2,
            price: 1600,
            discount: 200,
            total: 3000,
            notes: 'Teal green OT scrub sets with name tag.',
          },
        ],
        orderDate: new Date('2026-09-22T12:00:00Z'),
        deliveryDate: new Date('2026-10-02T18:00:00Z'),
        status: 'Cutting',
        totalAmount: 3000,
        notes: 'ICU staff uniform requirements.',
        createdBy: adminUser._id,
      },
      {
        orderNumber: 'ORD-000003',
        organization: bankerOrg._id,
        branch: bankerMainBranch._id,
        person: person3._id,
        items: [
          {
            garment: garmentMap['BLAZER']._id,
            quantity: 1,
            price: 4500,
            discount: 500,
            total: 4000,
            notes: 'Navy blue corporate executive blazer.',
          },
        ],
        orderDate: new Date('2026-09-15T09:00:00Z'),
        deliveryDate: new Date('2026-09-28T18:00:00Z'),
        status: 'Ready',
        totalAmount: 4000,
        notes: 'Ready for final fitting and dispatch.',
        createdBy: adminUser._id,
      },
    ]);

    console.log('Seeded sample orders.');

    // 10. Seed Audit Logs
    await AuditLog.create([
      {
        user: adminUser._id,
        userName: adminUser.name,
        userEmail: adminUser.email,
        userRole: adminUser.role,
        action: 'VERSION_CREATE',
        module: 'Measurement',
        recordId: rahulShirtV2._id.toString(),
        description: `Admin Krishna updated Rahul Shah's shirt measurement. Chest: 40 -> 42, Waist: 36 -> 38`,
        prevValues: { chest: 40, waist: 36, version: 1 },
        newValues: { chest: 42, waist: 38, version: 2 },
      },
      {
        user: adminUser._id,
        userName: adminUser.name,
        userEmail: adminUser.email,
        userRole: adminUser.role,
        action: 'CREATE',
        module: 'Order',
        recordId: 'ORD-000001',
        description: 'Created order ORD-000001 for Dr. Rahul Shah (2 items)',
      },
    ]);

    console.log('--- Database Seeding Completed Successfully! ---');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
};

// If run directly via node seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    process.exit(0);
  })();
}
