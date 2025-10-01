import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Stock-Safe",
      version: "1.0.0",
      description: `
Documentação da API com autenticação JWT.

Esta API foi desenvolvida para gerenciamento de empresas, usuários e produtos, utilizando Node.js, Express e Prisma.

**Tipos de usuários:**

1. SUPER_ADMIN
   - Permissão máxima no sistema.
   - Pode criar, editar e excluir qualquer usuário ou empresa.
   - Acesso total a todas as rotas administrativas.
   - Responsável por gerenciar os COMPANY_ADMIN.

2. COMPANY_ADMIN
   - Administrador de uma empresa específica.
   - Pode gerenciar usuários internos da sua empresa.
   - Pode cadastrar, editar e remover produtos vinculados à empresa.
   - Não pode alterar dados de outras empresas ou criar SUPER_ADMINs.

3. USER (padrão)
   - Usuário comum vinculado a uma empresa.
   - Pode visualizar e editar apenas seus próprios dados.
   - Acesso limitado às rotas da API.
   - Não possui permissões administrativas.

**Autenticação:**
- O login gera um JWT Token que deve ser enviado no header de cada requisição:
  Authorization: Bearer <seu_token>
- O token é validado em cada rota protegida.
- O acesso às rotas varia conforme o tipo de usuário.
      `,
    },
    servers: [
      {
        url: "https://stock-back-vert.vercel.app",
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
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

export default swaggerDocs;
