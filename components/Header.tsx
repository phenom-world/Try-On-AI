'use client'

import { ThemeSwitch } from '../components/ui/theme-switch'

const Header = () => {
  return (
    <header className="h-[70px] sticky top-0 z-50 bg-white dark:bg-black flex w-full right-0 items-center justify-between lg:justify-end mx-auto border-b mb-2">
      <div className="hidden lg:flex items-center gap-3">
        <ThemeSwitch />
      </div>
    </header>
  )
}

export default Header
