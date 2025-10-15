import express from "express";
import authRoutes from "./routes/auth.js";
const app = express();
app.use(express.json());
// Mount all /api/auth/* requests to authRoutes
app.use("/api/auth", authRoutes);
app.listen(3000, () => console.log("Server running on port 3000"));
//# sourceMappingURL=index.js.map