/**
 * @file Modal.jsx
 * @description Modal genérico e responsivo.
 */

import PropTypes from "prop-types";

export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4"
    >
      <div
        className="
          bg-white rounded-2xl shadow-xl
          w-full max-w-2xl max-h-[90vh]
          overflow-y-auto relative p-6 animate-fadeIn
        "
      >
        <button
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute top-3 right-3 text-gray-700 hover:text-red-500 font-bold text-2xl transition"
        >
          ✕
        </button>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
