import React, { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, size = 'medium', closeOnOverlayClick = true, closeOnEsc = true }) {
  if (!isOpen) return null

  const sizeClasses = {
    small: 'modal-small',
    medium: 'modal-medium',
    large: 'modal-large',
    xlarge: 'modal-xlarge',
    full: 'modal-full'
  }

  const handleOverlayClick = () => {
    if (closeOnOverlayClick && onClose) onClose()
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        if (closeOnEsc && onClose) onClose()
        else e.stopPropagation()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [closeOnEsc, onClose])

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-content ${sizeClasses[size]}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}
