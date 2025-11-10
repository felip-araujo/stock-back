import express, { application } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDocs from "./src/docs/swagger.js";

import companiesRoutes from "./src/routes/companiesRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import statsRoutes from "./src/routes/statsCompRoutes.js";
import materialRoutes from "./src/routes/materialRoutes.js";
import requestRoutes from "./src/routes/request.Routes.js";
import departmentRoutes from "./src/routes/departmentRoutes.js";
import subscriptionRoutes from "./src/routes/subscriptionRoutes.js";
import webHookRoutes from "./src/routes/webHookRoutes.js";
import saleRoutes from "./src/routes/saleRoutes.js";
import contatoRoutes from "./src/routes/contato.Routes.js";
import cancelRoutes from "./src/routes/cancelRoutes.js";
import inviteRoutes from "./src/routes/inviteRoutes.js"
import registerRoutes from "./src/routes/registerRoutes.js"
import { verificarTrialsExpirados } from "./src/services/trialService.js";
import analyticsRoutes from "./src/routes/analyticsRoutes.js"
import analiticStats from "./src/routes/superStatsRoutes.js"


import {searchMiddleware} from "./src/middleware/searchMiddleware.js"

const app = express();




const swaggerOptions = {
  customCssUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js",
  ],
};

app.use(cors());
// app.use(cors({ origin: "https://stocksafe.vercel.app" }));

// Middleware para parsear JSON, mas deixar raw para webhooks
app.use("/stripe", webHookRoutes);
app.use(express.json());



// const searchConfig = {
//   materiais: { model: "Material", fields: ["nome", "descricao", "categoria"] },
//   usuarios: { model: "user", fields: ["nome", "email"] },
//   produtos: { model: "produto", fields: ["nome", "descricao", "codigo"] },
// };

// app.use(searchMiddleware(searchConfig));


app.use("/companies", companiesRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/product", productRoutes);
app.use("/department", departmentRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerOptions));
app.use("/dashstats", statsRoutes);
app.use("/material", materialRoutes);
app.use("/requisicao", requestRoutes);
app.use("/subscription", subscriptionRoutes);
app.use("/sale", saleRoutes);
app.use("/contato", contatoRoutes);
app.use("/cancelar", cancelRoutes);
app.use("/invite", inviteRoutes)
app.use("/register", registerRoutes)
app.use("/analytics", analyticsRoutes )
app.use("/analytics/stats", analiticStats )

verificarTrialsExpirados()



app.listen(3000, () => {
  console.log("Server running on port 3000");
});

export default app;
