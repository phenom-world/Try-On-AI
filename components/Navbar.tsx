import Image from 'next/image'
import Link from 'next/link'

import { ThemeSwitch } from './ui/theme-switch'

export default function Navbar() {
  return (
    <nav className="border-b dark:bg-[#0A0A0B] dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.webp"
              alt="Cloth AI Logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-xl font-bold dark:text-white">Tryon AI</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeSwitch />
          </div>
        </div>
      </div>
    </nav>
  )
}
