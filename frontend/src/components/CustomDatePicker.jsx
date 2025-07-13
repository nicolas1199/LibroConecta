import React, { forwardRef } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import Calendar from "./icons/Calendar";

// Registrar la localización en español
registerLocale("es", es);

// Componente personalizado para el input
const CustomInput = forwardRef((props, ref) => {
  const { value, onClick, placeholder, label, optional } = props;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}{" "}
          {optional && <span className="text-gray-400">(opcional)</span>}
        </label>
      )}
      <button
        type="button"
        onClick={onClick}
        ref={ref}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors"
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {value || placeholder}
        </span>
        <Calendar className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
});

CustomInput.displayName = "CustomInput";

export default function CustomDatePicker(props) {
  const {
    selected,
    onChange,
    placeholder = "Seleccionar fecha",
    label,
    optional = false,
    maxDate,
    minDate,
  } = props;

  // Convertir string a Date si es necesario
  const selectedDate = selected ? new Date(selected) : null;

  const handleChange = (date) => {
    if (date) {
      // Convertir a formato YYYY-MM-DD para compatibilidad
      const formattedDate = date.toISOString().split("T")[0];
      onChange(formattedDate);
    } else {
      onChange("");
    }
  };

  return (
    <div className="relative">
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        customInput={
          <CustomInput
            placeholder={placeholder}
            label={label}
            optional={optional}
          />
        }
        maxDate={maxDate}
        minDate={minDate}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        popperProps={{
          strategy: "fixed",
        }}
        calendarClassName="custom-calendar"
        dayClassName={(date) =>
          date.getDay() === 0 || date.getDay() === 6 ? "weekend-day" : "weekday"
        }
        locale="es"
        dateFormat="dd 'de' MMMM 'de' yyyy"
        showMonthDropdown={false}
        showYearDropdown={false}
        dropdownMode="select"
        yearDropdownItemNumber={50}
        scrollableYearDropdown
        isClearable
      />

      {/* Estilos CSS para el calendario */}
      <style>{`
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
        
        .react-datepicker-wrapper {
          width: 100%;
        }
        
        .custom-calendar {
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          font-family: inherit;
          z-index: 9999;
          position: relative;
        }
        
        .react-datepicker__header {
          background-color: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 0.75rem 0.75rem 0 0;
          padding: 1rem;
          position: relative;
        }
        
        .react-datepicker__current-month {
          font-weight: 600;
          color: #1f2937;
          font-size: 1rem;
          margin: 0;
          text-align: center;
          line-height: 1.5;
        }
        
        .react-datepicker__day-names {
          margin-top: 0.5rem;
        }
        
        .react-datepicker__day-name {
          color: #6b7280;
          font-weight: 500;
          font-size: 0.875rem;
          width: 2.5rem;
          line-height: 2.5rem;
        }
        
        .react-datepicker__day {
          width: 2.5rem;
          line-height: 2.5rem;
          margin: 0.125rem;
          border-radius: 0.5rem;
          color: #374151;
          font-weight: 500;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        
        .react-datepicker__day:hover {
          background-color: #dbeafe;
          color: #1d4ed8;
        }
        
        .react-datepicker__day--selected {
          background-color: #3b82f6 !important;
          color: white !important;
          font-weight: 600;
        }
        
        .react-datepicker__day--today {
          background-color: #fef3c7;
          color: #92400e;
          font-weight: 600;
        }
        
        .react-datepicker__day--outside-month {
          color: #d1d5db;
        }
        
        .react-datepicker__navigation {
          border: none;
          background: none;
          top: 1rem;
          width: 2rem;
          height: 2rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .react-datepicker__navigation:hover {
          background-color: #e5e7eb;
        }
        
        .react-datepicker__navigation--previous {
          left: 1rem;
        }
        
        .react-datepicker__navigation--next {
          right: 1rem;
        }
        
        .react-datepicker__navigation-icon::before {
          border-color: #6b7280;
          border-width: 2px 2px 0 0;
          width: 6px;
          height: 6px;
          border-radius: 0;
        }
        
        .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #374151;
        }
        
        .react-datepicker__month-container {
          background-color: white;
          border-radius: 0 0 0.75rem 0.75rem;
        }
        
        .react-datepicker__month {
          padding: 1rem;
        }
        
        .react-datepicker__dropdown {
          background-color: white;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .react-datepicker__dropdown-container {
          z-index: 50;
        }
        
        .weekend-day {
          color: #dc2626;
        }
        
        .weekday {
          color: #374151;
        }
      `}</style>
    </div>
  );
}
