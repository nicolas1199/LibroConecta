import { useState, useRef, useEffect } from "react";
import ChevronDown from "./icons/ChevronDown";

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  label,
  optional = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef(null);

  // Encontrar la opción seleccionada
  const selectedOption = options.find((option) => option.value === value);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manejar teclas
  const handleKeyDown = (event) => {
    if (!isOpen) {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        event.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}{" "}
          {optional && <span className="text-gray-400">(opcional)</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={toggleOpen}
          onKeyDown={handleKeyDown}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors text-base ${
            isOpen ? "ring-2 ring-blue-500 border-transparent" : ""
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            <ul className="py-1" role="listbox">
              {options.map((option, index) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    index === highlightedIndex
                      ? "bg-blue-50 text-blue-900"
                      : value === option.value
                        ? "bg-blue-100 text-blue-900 font-medium"
                        : "text-gray-900 hover:bg-gray-50"
                  }`}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <div className="flex items-center">
                    <span className="flex-1">{option.label}</span>
                    {option.description && (
                      <span className="text-sm text-gray-500 ml-2">
                        {option.description}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
