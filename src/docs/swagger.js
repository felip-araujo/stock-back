import swaggerJsdoc from "swagger-jsdoc";

// Configurações básicas do Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Stock-Safe",
      version: "1.0.0",
      description: "Documentação da API com autenticação JWT",
    },
    servers: [
      {
        url: "http://localhost:3000", // URL base da sua API
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Aqui você diz onde estão os arquivos de rotas que terão comentários JSDoc
  apis: ["./src/routes/*.js"],
};

// Gera a documentação
const swaggerDocs = swaggerJsdoc(swaggerOptions);

export default swaggerDocs;
