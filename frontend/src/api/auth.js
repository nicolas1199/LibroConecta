import api from "./api"

export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password })
  return res.data
}

export const register = async (data) => {
  const res = await api.post("/auth/register", data)
  return res.data
}

// Función para obtener el perfil del usuario
export const getUserProfile = async () => {
  try {
    const response = await api.get("/auth/profile");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Función para actualizar el perfil del usuario
export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put("/auth/profile", profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Función para obtener el perfil de cualquier usuario por ID
export const getUserProfileById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
