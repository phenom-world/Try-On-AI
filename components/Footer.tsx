import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0A0A0B]">
      <div className="container mx-auto px-4 py-6">
        <div className="flex sm:flex-row flex-col justify-center items-center gap-2 sm:gap-4">
          <p className="text-sm text-blue-600 dark:text-[#3B82F6] order-2 sm:order-none">
            © {new Date().getFullYear()} Try-on AI
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            Crafted with{' '}
            <span className="inline-block animate-pulse text-red-500">❤️</span>{' '}
            by{' '}
            <Link
              href=""
              target="_blank"
              className="text-blue-600 hover:text-blue-500 dark:text-[#3B82F6] dark:hover:text-[#60A5FA] transition-colors duration-200"
            >
              Wakeel Kehinde
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
