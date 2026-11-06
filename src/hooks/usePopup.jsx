import { useCallback, useMemo, useRef, useState } from 'react'

const CLOSED = { open: false, loading: false }

// Valores padrão de cada tipo de popup
const PRESETS = {
  info: { type: 'info', canConfirm: true, canCancel: false, confirmLabel: 'OK' },
  success: { type: 'success', canConfirm: true, canCancel: false, confirmLabel: 'OK' },
  warning: { type: 'warning', canConfirm: true, canCancel: false, confirmLabel: 'OK' },
  error: { type: 'error', canConfirm: true, canCancel: false, confirmLabel: 'Fechar' },
  confirm: { type: 'confirm', canConfirm: true, canCancel: true, confirmLabel: 'Confirmar', cancelLabel: 'Cancelar' },
  danger: {type: 'danger', canConfirm: true, canCancel: true, confirmLabel: 'Sim', cancelLabel: 'Não, cancelar'}
}

export function usePopup() {
  const [state, setState] = useState(CLOSED)
  const resolverRef = useRef(null)
  const optionsRef = useRef({})

  const close = useCallback((result = false) => {
    setState((s) => ({ ...s, open: false, loading: false }))
    resolverRef.current?.(result)
    resolverRef.current = null
  }, [])

  const show = useCallback((options = {}) => {
    resolverRef.current?.(false)

    const opts = typeof options === 'string' ? { text: options } : options
    const preset = PRESETS[opts.type] ?? PRESETS.info

    optionsRef.current = { ...preset, ...opts }
    setState({ ...CLOSED, open: true, ...optionsRef.current })

    return new Promise((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const handleConfirm = useCallback(async () => {
    const { onConfirm } = optionsRef.current
    if (!onConfirm) return close(true)

    try {
      setState((s) => ({ ...s, loading: true }))
      await onConfirm()
      close(true)
    } catch (err) {
      setState((s) => ({ ...s, loading: false }))
      console.error(err)
    }
  }, [close])

  const handleCancel = useCallback(() => {
    optionsRef.current.onCancel?.()
    close(false)
  }, [close])

  const shortcuts = useMemo(() => {
    const make = (type) => (opts) =>
      show(typeof opts === 'string' ? { type, text: opts } : { type, ...opts })
    return {
      info: make('info'),
      success: make('success'),
      warning: make('warning'),
      error: make('error'),
      confirm: make('confirm'),
      danger: make('danger')
    }
  }, [show])

  const props = {
    open: state.open,
    type: state.type,
    icon: state.icon,
    title: state.title,
    text: state.text,
    canConfirm: state.canConfirm,
    canCancel: state.canCancel,
    confirmLabel: state.confirmLabel,
    cancelLabel: state.cancelLabel,
    loading: state.loading,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
    onClose: handleCancel,
  }

  return { props, show, close, ...shortcuts }
}

export default usePopup