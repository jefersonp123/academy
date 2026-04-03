import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Club Deportivo PWA API',
    description: 'API limits, endpoints, and schema documentation for Club Deportivo PWA',
    version: '1.0.0',
  },
  host: 'localhost:3001',
  basePath: '/api/v1',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Enter token in format (Bearer <token>)',
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const outputFile = './swagger_output.json';
const routes = ['./src/app/app.js']; // Point to your entry or router file

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc).then(() => {
  console.log('Swagger documentation generated successfully!');
});
