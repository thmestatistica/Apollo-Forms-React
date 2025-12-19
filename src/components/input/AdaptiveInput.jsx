import React, { useEffect, useRef, useMemo } from "react";

/**
 * AdaptiveInput
 * Renders an <input> for short text and switches to an auto-growing <textarea>
 * when content exceeds a character threshold or contains newlines.
 */
function AdaptiveInput({
  value,
  onChange,
  disabled = false,
  placeholder,
  className,
  maxChars = 50,
  ariaLabel,
}) {
  const val = value ?? "";
  const textareaRef = useRef(null);

  const shouldTextarea = useMemo(() => {
    if (typeof val !== "string") return false;
    return val.length > maxChars || val.includes("\n");
  }, [val, maxChars]);

  useEffect(() => {
    if (shouldTextarea && textareaRef.current) {
      const ta = textareaRef.current;
      // Auto-grow to fit content
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [val, shouldTextarea]);

  const baseClass =
    className ||
    "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200";

  if (shouldTextarea) {
    return (
      <textarea
        ref={textareaRef}
        className={`${baseClass} overflow-hidden resize-none`}
        value={val}
        onChange={(e) => onChange?.(e.target.value)}
        onInput={(e) => {
          const ta = e.currentTarget;
          ta.style.height = "auto";
          ta.style.height = `${ta.scrollHeight}px`;
        }}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        aria-label={ariaLabel}
        style={{ overflow: "hidden", resize: "none" }}
      />
    );
  }

  return (
    <input
      type="text"
      className={baseClass}
      value={val}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
    />
  );
}

export default AdaptiveInput;
