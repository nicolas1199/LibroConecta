import React from "react";

export default function LocationSelect({
  locations = [],
  value = "",
  onChange,
  error = "",
  label = "Ubicación",
  required = false,
  className = "",
}) {
  // Validar que locations sea un array válido
  const validLocations = Array.isArray(locations) ? locations : [];
  
  // Agrupar ubicaciones por región
  const groupedLocations = React.useMemo(() => {
    return validLocations.reduce((acc, location) => {
      // Validar que location tenga las propiedades necesarias
      if (location && location.region && location.comuna && location.location_id) {
        if (!acc[location.region]) {
          acc[location.region] = [];
        }
        acc[location.region].push(location);
      }
      return acc;
    }, {});
  }, [validLocations]);

  return (
    <div>
      <label className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        className={`form-control ${error ? "border-red-500" : ""} ${className}`}
      >
        <option value="">Selecciona tu ubicación</option>
        {Object.entries(groupedLocations).map(([region, locs]) => (
          <optgroup key={region} label={region}>
            {locs.map((location) => (
              <option key={location.location_id} value={location.location_id}>
                {location.comuna}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
} 