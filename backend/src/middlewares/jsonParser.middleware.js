import { json, urlencoded } from "express";

const jsonParserMiddleware = [
  urlencoded({ extended: true, limit: "1mb" }),
  json({ limit: "1mb" }),
];

export default jsonParserMiddleware;
