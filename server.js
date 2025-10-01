import express from "express";
import cors from "cors";
import companiesRoutes from "./src/routes/companiesRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/companies", companiesRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/product", productRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
