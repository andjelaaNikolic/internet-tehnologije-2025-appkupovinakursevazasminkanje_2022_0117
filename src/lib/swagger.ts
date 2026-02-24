import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api', 
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API za kupovinu kurseva šminkanja',
        version: '1.0.0',
        description: 'Dokumentacija API-ja',
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          CSRFToken: {
            type: 'apiKey',
            in: 'header',
            name: 'x-csrf-token',
            description: 'CSRF zaštita token - obavezan za POST, PUT, PATCH, DELETE zahteve',
          },
        },
      },
    },
  });
  return spec;
};