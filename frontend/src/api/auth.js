import api from "./api";

export const login = async (identifier, password) => {
  const res = await api.post("/auth/login", { identifier, password });
  return res.data;
};

export const register = async (data) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};
