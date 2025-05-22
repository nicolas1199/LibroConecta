import cors from "cors";
import { CORS_ORIGIN } from "../config/configEnv.js";

const corsMiddleware = cors({
  credentials: true,
  origin: CORS_ORIGIN,
});

export default corsMiddleware;
