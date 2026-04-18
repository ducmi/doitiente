import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// metadataBase bắt buộc để Next.js resolve URL tương đối trong openGraph, sitemap...
// Thiếu → Next.js warning khi build
export const metadata: Metadata = {
  metadataBase: new URL("https://doivnd.com"),
  title: {
    // default: dùng khi không có page-level title
    // template: page con đặt title "Foo" → trình duyệt thấy "Foo | doivnd"
    default: "doivnd — Chuyển đổi tiền tệ VND và 61+ loại tiền tệ",
    template: "%s | doivnd",
  },
  description:
    "Công cụ chuyển đổi tiền tệ miễn phí, cập nhật tỷ giá hàng ngày. Đổi VND sang USD, EUR, JPY, AUD và 61+ loại tiền tệ khác.",
  keywords: [
    "đổi tiền",
    "chuyển đổi tiền tệ",
    "tỷ giá",
    "VND",
    "USD",
    "currency converter",
    "exchange rate",
  ],
  authors: [{ name: "Minh" }],

  // Favicon dùng emoji qua SVG data URL — không cần file ảnh
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💵</text></svg>",
      },
    ],
  },

  openGraph: {
    title: "doivnd — Chuyển đổi tiền tệ VND",
    description: "Công cụ chuyển đổi tiền tệ miễn phí, cập nhật tỷ giá hàng ngày.",
    url: "https://doivnd.com",
    siteName: "doivnd",
    locale: "vi_VN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "doivnd — Chuyển đổi tiền tệ VND",
    description: "Công cụ chuyển đổi tiền tệ miễn phí, cập nhật tỷ giá hàng ngày.",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: next-themes inject script trước hydration để set class "dark"
    // → server render không có class, client hydrate có class → React warning mismatch
    // → suppressHydrationWarning bỏ qua mismatch trên chính thẻ <html>, không ảnh hưởng children
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {/* Analytics đặt ngoài ThemeProvider — không cần theme context */}
        <Analytics />
      </body>
    </html>
  )
}
