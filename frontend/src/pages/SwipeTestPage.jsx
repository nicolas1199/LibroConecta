import { useState } from "react";
import { motion } from "framer-motion";
import AutoMatchNotification from "../components/AutoMatchNotification";
import Heart from "../components/icons/Heart";
import Users from "../components/icons/Users";
import BookOpen from "../components/icons/BookOpen";
import ArrowLeft from "../components/icons/ArrowLeft";
import { useNavigate } from "react-router-dom";

export default function SwipeTestPage() {
  const navigate = useNavigate();
  const [activeNotification, setActiveNotification] = useState(null);

  // Datos de prueba para diferentes escenarios
  const testScenarios = [
    {
      id: 1,
      name: "Match Simple",
      description: "Match básico con un libro",
      autoMatchData: {
        created: true,
        match: {
          match_id: 1,
          user_id_1: "user-1",
          user_id_2: "user-2",
          User1: {
            user_id: "user-1",
            first_name: "Ana",
            last_name: "García",
            email: "ana@example.com"
          },
          User2: {
            user_id: "user-2",
            first_name: "Carlos",
            last_name: "López",
            email: "carlos@example.com"
          }
        },
        trigger_info: {
          trigger_book: "Cien años de soledad",
          books_count: 1
        }
      }
    },
    {
      id: 2,
      name: "Match con Múltiples Libros",
      description: "Match con varios libros en común",
      autoMatchData: {
        created: true,
        match: {
          match_id: 2,
          user_id_1: "user-1",
          user_id_2: "user-3",
          User1: {
            user_id: "user-1",
            first_name: "María",
            last_name: "Rodríguez",
            email: "maria@example.com"
          },
          User2: {
            user_id: "user-3",
            first_name: "Alejandro",
            last_name: "Martín",
            email: "alejandro@example.com"
          }
        },
        trigger_info: {
          trigger_book: "El Principito",
          books_count: 5
        }
      }
    },
    {
      id: 3,
      name: "Match con Nombres Largos",
      description: "Probar con nombres más largos",
      autoMatchData: {
        created: true,
        match: {
          match_id: 3,
          user_id_1: "user-1",
          user_id_2: "user-4",
          User1: {
            user_id: "user-1",
            first_name: "Isabella",
            last_name: "Fernández-Vázquez",
            email: "isabella.fernandez@example.com"
          },
          User2: {
            user_id: "user-4",
            first_name: "Sebastián",
            last_name: "García-Montenegro",
            email: "sebastian.garcia@example.com"
          }
        },
        trigger_info: {
          trigger_book: "Don Quijote de la Mancha - Edición Conmemorativa",
          books_count: 3
        }
      }
    },
    {
      id: 4,
      name: "Match Fallido",
      description: "Simular cuando no se crea match",
      autoMatchData: {
        created: false,
        reason: "No hay likes mutuos suficientes"
      }
    }
  ];

  const handleTestNotification = (scenario) => {
    if (scenario.autoMatchData.created) {
      setActiveNotification(scenario.autoMatchData);
    } else {
      // Para casos fallidos, mostrar una notificación temporal
      alert(`❌ ${scenario.name}: ${scenario.autoMatchData.reason}`);
    }
  };

  const handleCloseNotification = () => {
    setActiveNotification(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/swipe')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver a Swipe</span>
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🧪 Página de Pruebas - Auto Match
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Prueba diferentes escenarios de auto-match sin necesidad de múltiples cuentas.
              Haz clic en cualquier escenario para ver la notificación correspondiente.
            </p>
          </div>
        </div>

        {/* Información del sistema */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                ¿Cómo funciona el Auto-Match?
              </h3>
              <ul className="space-y-1 text-blue-800 text-sm">
                <li>• Cuando dos usuarios se dan &ldquo;like&rdquo; mutuamente, se crea automáticamente un match</li>
                <li>• La notificación aparece inmediatamente después del like</li>
                <li>• Se muestra información del otro usuario y el libro que activó el match</li>
                <li>• Si hay múltiples libros en común, se indica la cantidad total</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Escenarios de prueba */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {testScenarios.map((scenario) => (
            <motion.div
              key={scenario.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-white rounded-xl shadow-md border-2 p-6 cursor-pointer transition-all duration-200 ${
                scenario.autoMatchData.created
                  ? 'border-green-200 hover:border-green-300 hover:shadow-lg'
                  : 'border-red-200 hover:border-red-300 hover:shadow-lg'
              }`}
              onClick={() => handleTestNotification(scenario)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${
                    scenario.autoMatchData.created
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}>
                    {scenario.autoMatchData.created ? (
                      <Heart className="h-6 w-6 text-green-600" />
                    ) : (
                      <Users className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {scenario.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {scenario.description}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  scenario.autoMatchData.created
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {scenario.autoMatchData.created ? 'Éxito' : 'Fallo'}
                </span>
              </div>

              {/* Preview de datos */}
              {scenario.autoMatchData.created && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">
                      {scenario.autoMatchData.match.User2.first_name} {scenario.autoMatchData.match.User2.last_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      &ldquo;{scenario.autoMatchData.trigger_info.trigger_book}&rdquo;
                    </span>
                  </div>
                  {scenario.autoMatchData.trigger_info.books_count > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      +{scenario.autoMatchData.trigger_info.books_count - 1} libro{scenario.autoMatchData.trigger_info.books_count > 2 ? 's' : ''} más
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">
                  ▶ Haz clic para probar
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Instrucciones adicionales */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-lg">⚡</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Consejos para las pruebas
              </h3>
              <ul className="space-y-1 text-yellow-800 text-sm">
                <li>• Prueba cada escenario para verificar diferentes comportamientos</li>
                <li>• Observa cómo cambia la UI con nombres largos y múltiples libros</li>
                <li>• Verifica que la navegación a Matches funcione correctamente</li>
                <li>• Comprueba el auto-close después de 8 segundos</li>
                <li>• Testa la responsividad en diferentes tamaños de pantalla</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Estado del sistema */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">
              Sistema de Auto-Match activo
            </span>
          </div>
        </div>
      </div>

      {/* Componente de notificación */}
      {activeNotification && (
        <AutoMatchNotification
          autoMatchData={activeNotification}
          onClose={handleCloseNotification}
        />
      )}
    </div>
  );
}
