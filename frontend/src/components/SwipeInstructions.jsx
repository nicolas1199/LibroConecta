import { motion } from "framer-motion";
import PropTypes from "prop-types";

export default function SwipeInstructions({ onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Cómo usar LibroSwipe
        </h3>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">👆</span>
            <span>Arrastra las tarjetas hacia los lados para evaluar</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-2xl">❤️</span>
            <span>Desliza <strong>derecha</strong> o presiona <kbd className="px-2 py-1 bg-gray-100 rounded">→</kbd> para &quot;Me gusta&quot;</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-2xl">👎</span>
            <span>Desliza <strong>izquierda</strong> o presiona <kbd className="px-2 py-1 bg-gray-100 rounded">←</kbd> para &quot;No me gusta&quot;</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🔘</span>
            <span>Usa los botones de abajo si prefieres tocar</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚡</span>
            <span>¡Arrastra rápido! La velocidad también cuenta</span>
          </div>
        </div>
        
        <button
          onClick={onDismiss}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          ¡Entendido!
        </button>
      </div>
    </motion.div>
  );
}

SwipeInstructions.propTypes = {
  onDismiss: PropTypes.func.isRequired,
};
