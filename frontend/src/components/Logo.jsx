import { motion } from 'framer-motion'

export default function Logo({ className = 'w-9 h-9' }) {
  return (
    <motion.div
      whileHover={{ rotate: -3, scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      className={`inline-flex items-center justify-center overflow-hidden rounded-[28%] bg-[#6157D9] shadow-lg shadow-indigo-300/30 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <path d="M0 0h48v48H0z" fill="url(#brand-gradient)" />
        <path d="M12 14.5c4.6-1.2 8.6-.25 12 2.85 3.4-3.1 7.4-4.05 12-2.85v20.2c-4.55-1.08-8.55-.05-12 3.1-3.45-3.15-7.45-4.18-12-3.1V14.5Z" fill="white" fillOpacity=".96" />
        <path d="M24 17.4v20.1M16 20.5c2.45-.17 4.45.43 6 1.8M32 20.5c-2.45-.17-4.45.43-6 1.8M16 25c2.45-.17 4.45.43 6 1.8M32 25c-2.45-.17-4.45.43-6 1.8" stroke="#6D3BD1" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m36.5 8 .95 2.55L40 11.5l-2.55.95L36.5 15l-.95-2.55L33 11.5l2.55-.95L36.5 8Z" fill="#F4EEFF" />
        <defs>
          <linearGradient id="brand-gradient" x1="5" y1="4" x2="43" y2="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A878EF" />
            <stop offset="1" stopColor="#6D3BD1" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}
