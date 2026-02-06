import React, { useMemo, useRef, useState, useEffect } from "react";

const EditableSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Selecione...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const displayValue = value || "";
  const textareaRef = useRef(null);
  const baseHeight = 34;

  const filteredOptions = useMemo(() => {
    const filtro = (value || "").trim().toLowerCase();
    if (!filtro) return options;
    return options.filter((opt) => opt.toLowerCase().includes(filtro));
  }, [options, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, baseHeight)}px`;
  }, [displayValue]);

  return (
    <div ref={wrapperRef} className="relative">
      <textarea
        ref={textareaRef}
        className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg py-1.5 pl-3 pr-8 cursor-text outline-none focus:border-apollo-300 hover:border-apollo-300 transition-colors w-full leading-[1.25rem] resize-none block"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => {
          onChange?.(e.target.value);
          setIsOpen(true);
        }}
        onInput={(e) => {
          const ta = e.currentTarget;
          ta.style.height = "auto";
          ta.style.height = `${Math.max(ta.scrollHeight, baseHeight)}px`;
        }}
        onFocus={() => setIsOpen(true)}
        rows={1}
        style={{ height: `${baseHeight}px`, minHeight: `${baseHeight}px`, lineHeight: "20px", resize: "none" }}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 text-xs">▼</div>

      {isOpen && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <button
                type="button"
                key={opt}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-apollo-50 transition-colors"
                onClick={() => {
                  onChange?.(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-400">Nenhum resultado</div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditableSelect;
