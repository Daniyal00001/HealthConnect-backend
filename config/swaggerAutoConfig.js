import expressJSDocSwagger from 'express-jsdoc-swagger';

const options = {
  info: {
    version: '1.0.0',
    title: 'Clinic Management System API',
    description: 'Auto-generated API documentation',
    contact: {
      name: 'API Support',
      email: 'support@clinicmanagement.com',
    },
  },
  security: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
  ],
  baseDir: process.cwd(),
  filesPattern: [
    './routes/**/*.js',
    './controllers/**/*.js',
  ],
  swaggerUIPath: '/api-docs',
  exposeSwaggerUI: true,
  exposeApiDocs: true,
  apiDocsPath: '/api/openapi.json',
};

export default function setupSwagger(app) {
  expressJSDocSwagger(app)(options);
  console.log('📚 Swagger docs initialized');
}