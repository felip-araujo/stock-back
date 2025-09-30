import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token não fornecido!" });
  }

  const token = authHeader.split(" ")[1]; // formato: "Bearer token"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "seusegredo");
    req.user = decoded; // { id, role, companyId }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido!" });
  }
};
