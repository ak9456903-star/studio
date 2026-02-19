import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#020617',
          borderRadius: '8px',
          border: '1px solid #00d4ff',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          width="24"
          height="24"
        >
          <defs>
            <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#0055ff" />
            </linearGradient>
          </defs>
          {/* Futuristic Tech Mask / Hood Icon */}
          <path
            d="M 50,10 L 80,30 L 80,70 L 50,90 L 20,70 L 20,30 Z"
            stroke="url(#glow)"
            strokeWidth="4"
            fill="none"
          />
          <rect x="35" y="40" width="10" height="4" rx="1" fill="#00d4ff" />
          <rect x="55" y="40" width="10" height="4" rx="1" fill="#00d4ff" />
          <path d="M 40 65 L 60 65" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}