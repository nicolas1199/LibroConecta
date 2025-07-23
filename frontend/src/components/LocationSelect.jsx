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
  // Agrupar ubicaciones por región
  const groupedLocations = React.useMemo(() => {
    return locations.reduce((acc, location) => {
      if (!acc[location.region]) {
        acc[location.region] = [];
      }
      acc[location.region].push(location);
      return acc;
    }, {});
  }, [locations]);

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