// Server Component — không cần "use client" vì không có state hay event
import { CurrencyConverter } from "@/components/currency-converter"

export default function Home() {
  return (
    // Căn giữa màn hình theo cả chiều dọc và ngang
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
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
