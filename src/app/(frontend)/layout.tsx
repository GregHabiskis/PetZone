import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Noto_Sans_Bengali } from 'next/font/google'
import { Footer } from '@/components/footer'
import { GlobalActions } from '@/components/global-actions'
import { Header } from '@/components/header'
import { StoreProvider } from '@/components/store-provider'
import '../globals.css'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-ui' })
const bengali = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-bn' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: { default: 'Pet Zone — Pet Food, Accessories & Care in Bangladesh', template: '%s | Pet Zone' },
  description: 'Authentic pet food, medicine, accessories and trusted vet care across Bangladesh.',
  openGraph: { siteName: 'Pet Zone', type: 'website', locale: 'en_BD', alternateLocale: 'bn_BD' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${jakarta.variable} ${bengali.variable}`} suppressHydrationWarning><body><StoreProvider><Header /><main>{children}</main><Footer /><GlobalActions /></StoreProvider></body></html>
}
