"use client"

import { useState, useEffect } from "react"
import { ArrowLeftRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// --- Kiểu dữ liệu ---

type Currency = {
  code: string
  name: string
}

type ConversionResult = {
  amount: number
  from: string
  to: string
  result: number
  rate: number
  date: string
}

// --- Helpers ---

// Format số thông minh theo độ lớn của value:
//   >= 1          → 2 decimal  → "25,432.50"
//   0.01..1       → 4 decimal  → "0.0393"
//   0.0001..0.01  → 6 decimal  → "0.000039"
//   0..0.0001     → 8 decimal  → "0.00003930"
//   0             → "0.00"
function formatNumber(value: number): string {
  if (value === 0) return "0.00"
  const decimals = value >= 1 ? 2 : value >= 0.01 ? 4 : value >= 0.0001 ? 6 : 8
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// Format ngày: "2025-04-19" → "19/04/2025"
function formatDate(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

// Giới hạn tối đa: 999 tỷ — an toàn với Number.MAX_SAFE_INTEGER, đủ cho mọi use case thực tế
const MAX_AMOUNT = 999_999_999_999

// --- Component chính ---

export function CurrencyConverter() {
  // Danh sách tiền tệ cho dropdown
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [currencyError, setCurrencyError] = useState<string | null>(null)

  // Giá trị người dùng nhập
  const [amount, setAmount] = useState("1")
  const [fromCurrency, setFromCurrency] = useState("USD")
  const [toCurrency, setToCurrency] = useState("VND")

  // Kết quả chuyển đổi
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [loadingResult, setLoadingResult] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)

  // --- Effect 1: Load danh sách tiền tệ khi component mount ---
  useEffect(() => {
    fetch("/api/currencies")
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi tải currencies")
        return res.json()
      })
      .then((data: Currency[]) => {
        setCurrencies(data)
      })
      .catch(() => {
        setCurrencyError("Không thể tải danh sách tiền tệ")
      })
      .finally(() => {
        setLoadingCurrencies(false)
      })
  }, []) // [] → chỉ chạy 1 lần khi mount

  // --- Effect 2: Debounce 500ms rồi fetch tỷ giá ---
  useEffect(() => {
    const numAmount = parseFloat(amount)

    // Edge case: amount rỗng, không phải số, hoặc = 0 → xoá kết quả, không fetch
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setResult(null)
      setLoadingResult(false)
      return
    }

    setLoadingResult(true)
    setConversionError(null)

    // ignore flag: tránh race condition khi nhiều request cùng bay
    // (user gõ nhanh → request cũ về sau request mới → không update state sai)
    let ignore = false

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ from: fromCurrency, to: toCurrency, amount })
        const res = await fetch(`/api/convert?${params}`)
        const data = await res.json()

        if (!res.ok) throw new Error(data.error || "Đã xảy ra lỗi")

        // Chỉ update state nếu effect này vẫn còn "sống"
        if (!ignore) {
          setResult(data as ConversionResult)
          setConversionError(null)
        }
      } catch (err) {
        if (!ignore) {
          setConversionError(err instanceof Error ? err.message : "Không thể kết nối")
          setResult(null)
        }
      } finally {
        if (!ignore) setLoadingResult(false)
      }
    }, 500)

    // Cleanup: huỷ timer cũ khi deps thay đổi trước 500ms
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [amount, fromCurrency, toCurrency]) // Chạy lại mỗi khi 1 trong 3 thay đổi

  // --- Handler: giới hạn và validate số tiền ---
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Cho phép rỗng (user đang xóa hết)
    if (raw === "") { setAmount(""); return }
    const num = parseFloat(raw)
    if (isNaN(num)) return
    // Clamp: âm → 0, vượt max → max
    if (num < 0) { setAmount("0"); return }
    if (num > MAX_AMOUNT) { setAmount(String(MAX_AMOUNT)); return }
    setAmount(raw)
  }

  // Hiện hint khi user chạm giới hạn (không dùng state riêng — tính trực tiếp)
  const showMaxHint = parseFloat(amount) >= MAX_AMOUNT

  // --- Handler: hoán đổi from ↔ to ---
  function handleSwap() {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  // --- Render dropdown currencies ---
  function renderCurrencyItems() {
    if (loadingCurrencies) {
      return (
        <SelectItem value="_loading" disabled>
          <Loader2 className="size-3.5 animate-spin" />
          Đang tải...
        </SelectItem>
      )
    }
    if (currencyError) {
      return (
        <SelectItem value="_error" disabled>
          {currencyError}
        </SelectItem>
      )
    }
    return currencies.map((c) => (
      <SelectItem key={c.code} value={c.code}>
        <span className="font-medium">{c.code}</span>
        <span className="ml-1.5 text-muted-foreground truncate max-w-[140px]">{c.name}</span>
      </SelectItem>
    ))
  }

  // Subtitle động: tính số currency khác VND sau khi load xong
  const otherCount = currencies.filter((c) => c.code !== "VND").length
  const subtitle = loadingCurrencies
    ? "Đang tải..."
    : currencyError
      ? "Chuyển đổi VND và các loại tiền tệ quốc tế"
      : `Chuyển đổi VND và ${otherCount} loại tiền tệ khác`

  return (
    <>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
      <Card className="w-full max-w-[500px]">
      <CardHeader>
        <CardTitle className="text-base text-muted-foreground font-normal">
          Chuyển đổi tiền tệ
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* --- Ô nhập số tiền --- */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Số tiền</label>
          <Input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={handleAmountChange}
            className="text-lg h-11"
            placeholder="Nhập số tiền..."
          />
          {/* Hint chỉ hiện khi chạm giới hạn — không popup, không gây khó chịu */}
          {showMaxHint && (
            <p className="text-xs text-muted-foreground">Tối đa 999,999,999,999</p>
          )}
        </div>

        {/* --- Hàng chọn tiền tệ: From + swap + To --- */}
        <div className="flex items-end gap-2">
          {/* Dropdown "Từ" */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <label className="text-xs text-muted-foreground">Từ</label>
            <Select
              value={fromCurrency}
              onValueChange={setFromCurrency}
              disabled={loadingCurrencies}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{renderCurrencyItems()}</SelectContent>
            </Select>
          </div>

          {/* Nút hoán đổi */}
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={handleSwap}
            aria-label="Hoán đổi tiền tệ"
          >
            <ArrowLeftRight className="size-4" />
          </Button>

          {/* Dropdown "Sang" */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <label className="text-xs text-muted-foreground">Sang</label>
            <Select
              value={toCurrency}
              onValueChange={setToCurrency}
              disabled={loadingCurrencies}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{renderCurrencyItems()}</SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>

      {/* --- Khu vực hiện kết quả --- */}
      <CardFooter className="flex-col items-start gap-1 min-h-[88px]">
        {/* Đang load */}
        {loadingResult && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Đang tính...</span>
          </div>
        )}

        {/* Lỗi */}
        {!loadingResult && conversionError && (
          <p className="text-sm text-destructive">{conversionError}</p>
        )}

        {/* Kết quả */}
        {!loadingResult && result && (
          <>
            {(() => {
              // Font size thích ứng theo độ dài chuỗi đã format
              const resultStr = formatNumber(result.result)
              const amountStr = formatNumber(result.amount)
              const resultClass =
                resultStr.length > 18 ? "text-xl font-bold text-primary" :
                resultStr.length > 12 ? "text-2xl font-bold text-primary" :
                                        "text-3xl font-bold text-primary"
              const amountClass =
                amountStr.length > 15 ? "text-lg font-semibold" : "text-2xl font-semibold"
              return (
                <>
                  {/* break-all: safety net khi số quá dài vẫn xuống dòng đúng chỗ */}
                  <p className={`${amountClass} w-full break-all`}>
                    {amountStr} {result.from} =
                  </p>
                  <p className={`${resultClass} w-full break-all`}>
                    {resultStr} {result.to}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    1 {result.from} = {formatNumber(result.rate)} {result.to}
                    {" · "}
                    Cập nhật: {formatDate(result.date)}
                  </p>
                </>
              )
            })()}
          </>
        )}

        {/* Chưa có gì (amount = 0 hoặc rỗng) */}
        {!loadingResult && !result && !conversionError && (
          <p className="text-sm text-muted-foreground">Nhập số tiền để xem kết quả</p>
        )}
      </CardFooter>
    </Card>
    </>
  )
}
