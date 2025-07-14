import jwt from "jsonwebtoken";
import { JWT } from "../config/configEnv.js";

export const generateAccessToken = (payload) => {
  const secret = JWT.ACCESS_TOKEN_SECRET;
  const expiresIn = JWT.ACCESS_TOKEN_EXPIRES_IN;

  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET no está configurado");
  }

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  });
};

export const generateRefreshToken = (payload) => {
  const secret = JWT.REFRESH_TOKEN_SECRET;
  const expiresIn = JWT.REFRESH_TOKEN_EXPIRES_IN || "7d";

  if (!secret) {
    throw new Error("REFRESH_TOKEN_SECRET no está configurado");
  }

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  });
};

export const verifyAccessToken = (token) => {
  const secret = JWT.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET no está configurado");
  }
  return jwt.verify(token, secret);
};

export const verifyRefreshToken = (token) => {
  const secret = JWT.REFRESH_TOKEN_SECRET;
  if (!secret) {
    throw new Error("REFRESH_TOKEN_SECRET no está configurado");
  }
  return jwt.verify(token, secret);
};

export const generateTokens = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
  };
};
