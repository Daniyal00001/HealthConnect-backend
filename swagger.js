import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Clinic Management System API',
    description: 'Comprehensive API for managing multi-clinic healthcare operations',
    version: '1.0.0',
    contact: {
      email: 'support@clinicmanagement.com'
    }
  },
  host: 'localhost:5000',
  basePath: '/',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your JWT token in the format: Bearer <token>'
    }
  },
  security: [{
    bearerAuth: []
  }],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Super Admin',
      description: 'System-wide administration endpoints'
    },
    {
      name: 'Clinic Management',
      description: 'Clinic owner operations for managing doctors and staff'
    },
    {
      name: 'Doctor Operations',
      description: 'Doctor appointments and payment tracking'
    },
    {
      name: 'Front Desk',
      description: 'Front desk staff operations and dashboard'
    },
    {
      name: 'Patient Management',
      description: 'Patient registration and management'
    }
  ],
  definitions: {
    User: {
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
      role: 'clinic_owner',
      status: 'active'
    },
    Clinic: {
      id: 'clinic_1',
      name: 'City Health Center',
      address: '123 Main Street, Lahore',
      phone: '+92-300-1234567',
      email: 'info@cityhealthcenter.com',
      status: 'active'
    },
    Doctor: {
      id: 'doc_1',
      name: 'Dr. Ahmed Khan',
      email: 'ahmed@clinic.com',
      phone: '+92-321-9876543',
      specialization: 'Cardiology',
      consultationFee: 2000,
      experience: 10,
      status: 'active'
    },
    Patient: {
      id: 'patient_1',
      name: 'Ali Hassan',
      age: 35,
      gender: 'male',
      phone: '+92-300-9876543',
      email: 'ali@example.com',
      address: 'House 45, Block C, Lahore'
    },
    Appointment: {
      id: 'appt_1',
      patientId: 'patient_1',
      doctorId: 'doc_1',
      date: '2025-11-10',
      time: '10:00',
      reason: 'Regular checkup',
      status: 'scheduled'
    },
    Error: {
      success: false,
      error: 'Error message',
      code: 'ERROR_CODE'
    }
  }
};

const outputFile = './openapi.json';
const routes = ['./server.js'];

// Generate the OpenAPI JSON
swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc).then(({ success }) => {
  if (success) {
    console.log('✅ OpenAPI JSON generated successfully at ./openapi.json');
    console.log('🚀 Run your server and visit:');
    console.log('   📚 Swagger UI: http://localhost:5000/api-docs');
    console.log('   📖 Redoc: http://localhost:5000/docs');
    console.log('   📄 OpenAPI JSON: http://localhost:5000/api/openapi.json');
  } else {
    console.error('❌ Failed to generate OpenAPI JSON');
  }
});