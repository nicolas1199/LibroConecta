import { completeExchangeService, getExchangeInfoService } from "../services/Exchange.service.js";
import { createResponse } from "../utils/responses.util.js";

// Completar un intercambio
export const completeExchange = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { match_id } = req.params;

    const result = await completeExchangeService(match_id, user_id);

    return res.json(
      createResponse(
        200,
        "Intercambio completado exitosamente",
        result,
        null
      )
    );
  } catch (error) {
    console.error("Error al completar intercambio:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "Error interno del servidor", null, error.message)
      );
  }
};

// Obtener información del intercambio
export const getExchangeInfo = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { match_id } = req.params;

    const exchangeInfo = await getExchangeInfoService(match_id, user_id);

    return res.json(
      createResponse(
        200,
        "Información del intercambio obtenida exitosamente",
        exchangeInfo,
        null
      )
    );
  } catch (error) {
    console.error("Error al obtener información del intercambio:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "Error interno del servidor", null, error.message)
      );
  }
};
