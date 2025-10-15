import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDocs from "./src/docs/swagger.js";
import { disconnectPrisma } from "./src/middleware/disconnectprisma.Middleware.js";

import companiesRoutes from "./src/routes/companiesRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import statsRoutes from "./src/routes/statsCompRoutes.js";
import materialRoutes from "./src/routes/materialRoutes.js";
import requestRoutes from "./src/routes/request.Routes.js";
import departmentRoutes from "./src/routes/departmentRoutes.js";
import subscriptionRoutes from "./src/routes/subscriptionRoutes.js";

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
app.use(express.json());
app.use(disconnectPrisma);
 
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

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

export default app;
