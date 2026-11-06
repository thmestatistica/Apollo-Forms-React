import React from 'react'
import { Modal } from '../modal/Modal'
import {
  FaInfo,
  FaCheck,
  FaExclamationTriangle,
  FaTimes,
  FaQuestion,
  FaSkull,
} from 'react-icons/fa'

// Classes escritas por extenso para o Tailwind conseguir detectá-las
export const POPUP_TYPES = {
  info: {
    icon: FaInfo,
    badge: 'bg-blue-100 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-400',
  },
  success: {
    icon: FaCheck,
    badge: 'bg-green-100 text-green-600',
    button: 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-400',
  },
  warning: {
    icon: FaExclamationTriangle,
    badge: 'bg-amber-100 text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-400',
  },
  error: {
    icon: FaTimes,
    badge: 'bg-red-100 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-400',
  },
  confirm: {
    icon: FaQuestion,
    badge: 'bg-slate-100 text-slate-600',
    button: 'bg-slate-800 hover:bg-slate-900 focus-visible:ring-slate-400',
  },
  danger: {
    icon: FaSkull,
    badge: 'bg-rose-100 text-rose-600',
    button: 'bg-linear-to-r from-rose-800 to-orange-300 hover:bg-rose-900 focus-visible:ring-rose-400'
  }
}

function Popup({
  open,
  onClose,
  type = 'info',
  icon,
  title,
  text = 'Info',
  onConfirm,
  onCancel,
  canConfirm = false,
  canCancel = false,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
}) {
  const style = POPUP_TYPES[type] ?? POPUP_TYPES.info
  const IconComponent = icon ?? style.icon

  // Se o usuário não passar onCancel, cancelar apenas fecha
  const handleCancel = onCancel ?? onClose

  return (
    <Modal isOpen={open} onClose={onClose} bare>
      <div
        role={type === 'error' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        className="w-full max-w-md rounded-xl shadow-xl"
      >
        <div className="flex gap-4 bg-white p-6 rounded-t-xl">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.badge}`}
          >
            <IconComponent aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="mb-1 text-base font-semibold text-slate-900">
                {title}
              </h2>
            )}

            {typeof text === 'string' ? (
              <p className="text-sm leading-relaxed text-slate-600">{text}</p>
            ) : (
              text
            )}
          </div>
        </div>

        {(canCancel || canConfirm) && (
          <div className="flex justify-end gap-2 bg-slate-100 p-6 rounded-b-xl">
            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            )}

            {canConfirm && (
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60 ${style.button}`}
              >
                {loading ? 'Aguarde…' : confirmLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default Popup