// Server Component — không cần "use client"
import { CurrencyConverter } from "@/components/currency-converter"
import { ThemeToggle } from "@/components/theme-toggle"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    // Fragment vì cần main + footer cùng level dưới body
    <>
      {/* relative để ThemeToggle dùng absolute positioning không tham gia flex flow */}
      <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
        {/* Toggle góc trên phải */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Tiêu đề */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            doivnd
          </h1>
        </div>

        {/* Card chuyển đổi (Client Component) */}
        <CurrencyConverter />
      </main>

      {/* Footer ngoài main — body là flex-col, main flex-1 đẩy footer xuống đáy */}
      <Footer />
    </>
  )
}
