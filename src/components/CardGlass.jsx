import React from 'react'

export default function CardGlass({ className = '', children }) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl shadow-[0_8px_30px_rgb(2,6,23,0.3)] ${className}`}
    >
      {children}
    </div>
  )
}