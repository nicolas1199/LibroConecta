import { useState, useEffect } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PaymentDebug() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [allParams, setAllParams] = useState({});

  useEffect(() => {
    // Obtener todos los parámetros de la URL
    const params = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    setAllParams(params);
    
    console.log('🐛 PaymentDebug - Parámetros recibidos:', params);
    console.log('🐛 PaymentDebug - Location:', location);
  }, [searchParams, location]);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🐛 Payment Debug
            </h1>
            <p className="text-gray-600">
              Esta página muestra todos los parámetros recibidos de MercadoPago
            </p>
          </div>

          <div className="space-y-6">
            {/* Información de la URL */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">URL Actual:</h3>
              <code className="text-sm bg-gray-800 text-green-400 p-2 rounded block break-all">
                {window.location.href}
              </code>
            </div>

            {/* Parámetros de búsqueda */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Parámetros recibidos ({Object.keys(allParams).length}):
              </h3>
              
              {Object.keys(allParams).length === 0 ? (
                <p className="text-gray-500 italic">No se recibieron parámetros</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(allParams).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-mono text-sm bg-gray-800 text-yellow-400 px-2 py-1 rounded-l min-w-0 flex-shrink-0">
                        {key}:
                      </span>
                      <span className="font-mono text-sm bg-gray-800 text-white px-2 py-1 rounded-r flex-1 break-all">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información de contexto */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Información de contexto:
              </h3>
              <div className="space-y-1 text-sm">
                <div><strong>Pathname:</strong> {location.pathname}</div>
                <div><strong>Search:</strong> {location.search}</div>
                <div><strong>Hash:</strong> {location.hash || 'N/A'}</div>
                <div><strong>State:</strong> {JSON.stringify(location.state) || 'N/A'}</div>
                <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
              </div>
            </div>

            {/* Parámetros importantes para MercadoPago */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Parámetros de MercadoPago identificados:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Payment ID:</strong> {allParams.payment_id || 'N/A'}
                </div>
                <div>
                  <strong>Collection ID:</strong> {allParams.collection_id || 'N/A'}
                </div>
                <div>
                  <strong>Collection Status:</strong> {allParams.collection_status || 'N/A'}
                </div>
                <div>
                  <strong>Status:</strong> {allParams.status || 'N/A'}
                </div>
                <div>
                  <strong>External Reference:</strong> {allParams.external_reference || 'N/A'}
                </div>
                <div>
                  <strong>Payment Type:</strong> {allParams.payment_type || 'N/A'}
                </div>
                <div>
                  <strong>Merchant Order ID:</strong> {allParams.merchant_order_id || 'N/A'}
                </div>
                <div>
                  <strong>Preference ID:</strong> {allParams.preference_id || 'N/A'}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-4 pt-6 border-t">
              <Link
                to="/dashboard"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir al Dashboard
              </Link>
              
              {allParams.payment_id && (
                <Link
                  to={`/payment/success?payment_id=${allParams.payment_id}`}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Ver página de éxito
                </Link>
              )}
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(allParams, null, 2));
                  alert('Parámetros copiados al portapapeles');
                }}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Copiar parámetros
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
