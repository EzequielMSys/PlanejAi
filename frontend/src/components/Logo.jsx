import { motion } from 'framer-motion'

export default function Logo({ className = 'w-9 h-9' }) {
  return (
    <motion.div
      whileHover={{ rotate: 15, scale: 1.1 }}
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#9394CF] to-[#4B4C9D] shadow-lg ${className}`}
    >
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1.5">
        <rect x="4" y="4" width="12" height="12" rx="3" fill="white" opacity="0.9" />
        <rect x="24" y="4" width="12" height="12" rx="3" fill="white" opacity="0.7" />
        <rect x="4" y="24" width="12" height="12" rx="3" fill="white" opacity="0.7" />
        <rect x="24" y="24" width="12" height="12" rx="3" fill="white" opacity="0.9" />
      </svg>
    </motion.div>
  )
}