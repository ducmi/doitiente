// Server Component — không cần "use client"
import { CurrencyConverter } from "@/components/currency-converter"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    // relative để ThemeToggle dùng absolute positioning không ảnh hưởng centering
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      {/* Toggle góc trên phải — absolute không tham gia vào flex flow */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* --- Tiêu đề trang --- */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          doitiente
        </h1>
      </div>

      {/* --- Card chuyển đổi (Client Component) --- */}
      <CurrencyConverter />
    </main>
  )
}
