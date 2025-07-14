import jwt from "jsonwebtoken";
import { JWT } from "../config/configEnv.js";

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT.ACCESS_TOKEN_SECRET, {
    expiresIn: String(JWT.ACCESS_TOKEN_EXPIRES_IN),
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT.REFRESH_TOKEN_SECRET, {
    expiresIn: String(JWT.REFRESH_TOKEN_EXPIRES_IN),
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT.ACCESS_TOKEN_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT.REFRESH_TOKEN_SECRET);
};

export const generateTokens = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
  };
};
