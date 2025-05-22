import session from "express-session";
import { COOKIE_KEY } from "../config/configEnv.js";

const sessionMiddleware = session({
  secret: COOKIE_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Cambiar a true si usas HTTPS
    httpOnly: true,
    sameSite: "strict",
  },
});

export default sessionMiddleware;
