import './globals.css'
import { Cairo } from 'next/font/google'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'

const primaryFont = Cairo({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-primary',
})

export const metadata = {
  title: 'سیستم مدیریت شرکت مسافرتی',
  description: 'سیستم مدیریت جامع برای شرکت‌های مسافرتی',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${primaryFont.variable} font-primary bg-gradient-to-br from-dark-primary via-dark-secondary to-blue-900/50 min-h-screen text-dark-text-primary`}>
        <div className="fixed inset-0 bg-[url('/images/bg-pattern.svg')] opacity-10 bg-repeat z-0 pointer-events-none"></div>
        <div className="relative z-10">
          {children}
        </div>
        <ToastContainer
          position="bottom-left"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={true}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </body>
    </html>
  )
}
