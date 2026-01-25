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
          borderRadius: '50%',
          background: '#f0f0f0',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          width="80"
          height="80"
        >
          <defs>
            <linearGradient id="face-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <linearGradient id="headphone-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
          </defs>
          {/* Headphones */}
          <path
            d="M 25,45 A 25,25 0 0 1 75,45"
            stroke="url(#headphone-gradient)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="15" y="40" width="12" height="25" rx="6" fill="url(#headphone-gradient)" />
          <rect x="73" y="40" width="12" height="25" rx="6" fill="url(#headphone-gradient)" />

          {/* Face */}
          <rect x="25" y="25" width="50" height="50" rx="10" fill="url(#face-gradient)" />
          
          {/* Eyes */}
          <circle cx="42" cy="45" r="5" fill="white" />
          <circle cx="58" cy="45" r="5" fill="white" />
          <circle cx="42" cy="45" r="2" fill="black" />
          <circle cx="58" cy="45" r="2" fill="black" />

          {/* Smile */}
          <path d="M 40 60 Q 50 70 60 60" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>

        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
