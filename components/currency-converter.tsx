"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus, X } from "lucide-react"

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

type Currency = { code: string; name: string }

// Mỗi currency đích có state riêng → loading/error per-row, không block toàn bộ UI
type Destination = {
  id: string
  currency: string
  result: number | null
  rate: number | null
  loading: boolean
  error: string | null
}

type MultiConvertResult = {
  to: string
  rate: number | null
  result: number | null
  error?: string
}

type MultiConvertResponse = {
  from: string
  amount: number
  date: string
  results: MultiConvertResult[]
}

// --- Helpers ---

function formatNumber(value: number): string {
  if (value === 0) return "0.00"
  const decimals = value >= 1 ? 2 : value >= 0.01 ? 4 : value >= 0.0001 ? 6 : 8
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const MAX_AMOUNT = 999_999_999_999
const MAX_DESTINATIONS = 5

// ID counter module-level — stable, không phụ thuộc crypto hay Date.now()
let _nextId = 0
const newId = () => String(++_nextId)

// --- Sub-component: kết quả 1 row ---
// Định nghĩa ngoài CurrencyConverter để React không remount khi parent re-render

function DestResult({ dest }: { dest: Destination }) {
  if (dest.loading) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Đang tính...
      </span>
    )
  }
  if (dest.error) {
    return <span className="text-xs text-destructive">{dest.error}</span>
  }
  if (dest.result === null) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  return (
    // tabular-nums: các chữ số chiếm cùng độ rộng → kết quả align đẹp giữa các row
    <span className="text-lg font-semibold tabular-nums break-all">
      {formatNumber(dest.result)} {dest.currency}
    </span>
  )
}

// --- Component chính ---

export function CurrencyConverter() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [currencyError, setCurrencyError] = useState<string | null>(null)

  const [amount, setAmount] = useState("1")
  const [sourceCurrency, setSourceCurrency] = useState("USD")

  // Default 3 currency đích — newId() gọi lúc state khởi tạo, mỗi id duy nhất
  const [destinations, setDestinations] = useState<Destination[]>(() => [
    { id: newId(), currency: "VND", result: null, rate: null, loading: false, error: null },
    { id: newId(), currency: "EUR", result: null, rate: null, loading: false, error: null },
    { id: newId(), currency: "AUD", result: null, rate: null, loading: false, error: null },
  ])

  const [convertDate, setConvertDate] = useState<string | null>(null)

  // --- Effect 1: Load danh sách tiền tệ ---
  useEffect(() => {
    fetch("/api/currencies")
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then((data: Currency[]) => setCurrencies(data))
      .catch(() => setCurrencyError("Không thể tải danh sách tiền tệ"))
      .finally(() => setLoadingCurrencies(false))
  }, [])

  // --- Effect 2: Debounce conversion ---
  // Dùng chuỗi "VND,EUR,AUD" làm dependency thay vì array object
  // → tránh re-run vô ích khi array ref thay đổi nhưng nội dung không đổi
  const destinationCodes = destinations.map(d => d.currency).join(",")

  useEffect(() => {
    const numAmount = parseFloat(amount)

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setDestinations(prev =>
        prev.map(d => ({ ...d, result: null, rate: null, error: null, loading: false }))
      )
      return
    }

    // Set tất cả row sang loading ngay lập tức (trước debounce)
    setDestinations(prev => prev.map(d => ({ ...d, loading: true, error: null })))

    // Snapshot tại thời điểm effect chạy — tránh stale closure trong setTimeout
    const toCodes = destinationCodes
    let ignore = false

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ from: sourceCurrency, amount, to: toCodes })
        const res = await fetch(`/api/convert-multi?${params}`)
        const data: MultiConvertResponse = await res.json()

        if (!res.ok) throw new Error((data as unknown as { error: string }).error || "Đã xảy ra lỗi")

        if (!ignore) {
          // Map kết quả về đúng row theo currency code
          const rMap = new Map(data.results.map(r => [r.to, r]))
          setDestinations(prev => prev.map(d => {
            const r = rMap.get(d.currency)
            if (!r) return { ...d, loading: false, error: "Không hỗ trợ" }
            if (r.error || r.result === null) return { ...d, loading: false, error: r.error ?? "Lỗi" }
            return { ...d, result: r.result, rate: r.rate, loading: false, error: null }
          }))
          setConvertDate(data.date)
        }
      } catch (err) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Không thể kết nối"
          setDestinations(prev => prev.map(d => ({ ...d, loading: false, error: msg })))
        }
      }
    }, 500)

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [amount, sourceCurrency, destinationCodes])

  // --- Handlers ---

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (raw === "") { setAmount(""); return }
    const num = parseFloat(raw)
    if (isNaN(num)) return
    if (num < 0) { setAmount("0"); return }
    if (num > MAX_AMOUNT) { setAmount(String(MAX_AMOUNT)); return }
    setAmount(raw)
  }

  const showMaxHint = parseFloat(amount) >= MAX_AMOUNT

  function updateDestCurrency(id: string, currency: string) {
    // Reset result khi đổi currency — sẽ fetch lại qua effect
    setDestinations(prev =>
      prev.map(d => d.id === id ? { ...d, currency, result: null, rate: null, error: null } : d)
    )
  }

  function removeDestination(id: string) {
    if (destinations.length <= 1) return // min 1
    setDestinations(prev => prev.filter(d => d.id !== id))
  }

  function addDestination() {
    if (destinations.length >= MAX_DESTINATIONS) return
    // Ưu tiên chọn currency chưa được dùng và khác source
    const usedCodes = new Set(destinations.map(d => d.currency))
    const defaultCurrency =
      currencies.find(c => c.code !== sourceCurrency && !usedCodes.has(c.code))?.code ??
      currencies.find(c => c.code !== sourceCurrency)?.code ??
      "USD"
    setDestinations(prev => [
      ...prev,
      { id: newId(), currency: defaultCurrency, result: null, rate: null, loading: false, error: null },
    ])
  }

  // --- Render dropdown ---

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
      return <SelectItem value="_error" disabled>{currencyError}</SelectItem>
    }
    return currencies.map(c => (
      <SelectItem key={c.code} value={c.code}>
        <span className="font-medium">{c.code}</span>
        <span className="ml-1.5 text-muted-foreground truncate max-w-[140px]">{c.name}</span>
      </SelectItem>
    ))
  }

  // --- Subtitle ---

  const otherCount = currencies.filter(c => c.code !== "VND").length
  const subtitle = loadingCurrencies
    ? "Đang tải..."
    : currencyError
      ? "Chuyển đổi VND và các loại tiền tệ quốc tế"
      : `Chuyển đổi VND và ${otherCount} loại tiền tệ khác`

  // Đếm tần suất mỗi currency để detect trùng
  const currencyCounts = destinations.reduce<Record<string, number>>((acc, d) => {
    acc[d.currency] = (acc[d.currency] ?? 0) + 1
    return acc
  }, {})

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
          {/* --- Nguồn: [Input amount] [From select] --- */}
          <div className="flex gap-2">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
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
              {showMaxHint && (
                <p className="text-xs text-muted-foreground">Tối đa 999,999,999,999</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 w-[130px] shrink-0">
              <label className="text-xs text-muted-foreground">Từ</label>
              <Select
                value={sourceCurrency}
                onValueChange={setSourceCurrency}
                disabled={loadingCurrencies}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{renderCurrencyItems()}</SelectContent>
              </Select>
            </div>
          </div>

          {/* --- Đích: danh sách destination rows --- */}
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-2">Sang</label>

            {destinations.map(dest => (
              <div key={dest.id} className="py-2.5 border-b last:border-b-0">
                {/* Hàng chính: [Select] [Kết quả — desktop] [X] */}
                <div className="flex items-center gap-2">
                  <Select
                    value={dest.currency}
                    onValueChange={v => updateDestCurrency(dest.id, v)}
                    disabled={loadingCurrencies}
                  >
                    {/* flex-1 trên mobile (chiếm hết trừ nút X), cố định 140px trên desktop */}
                    <SelectTrigger className="h-9 flex-1 sm:w-[140px] sm:flex-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>{renderCurrencyItems()}</SelectContent>
                  </Select>

                  {/* Kết quả — chỉ hiện trên desktop (sm+) */}
                  <div className="hidden sm:flex flex-1 justify-end">
                    <DestResult dest={dest} />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground"
                    onClick={() => removeDestination(dest.id)}
                    disabled={destinations.length <= 1}
                    aria-label={`Xóa ${dest.currency}`}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>

                {/* Kết quả — chỉ hiện trên mobile */}
                <div className="sm:hidden pt-1.5 pl-1">
                  <DestResult dest={dest} />
                </div>

                {/* Cảnh báo trùng currency */}
                {currencyCounts[dest.currency] > 1 && (
                  <p className="text-xs text-amber-500 pt-1">Trùng với hàng khác</p>
                )}
              </div>
            ))}

            {/* Nút thêm — full width mobile, auto-width desktop */}
            <Button
              variant="outline"
              className="w-full sm:w-auto sm:self-start mt-3 h-9 gap-1.5"
              onClick={addDestination}
              disabled={destinations.length >= MAX_DESTINATIONS}
            >
              <Plus className="size-4" />
              Thêm tiền tệ
            </Button>
          </div>
        </CardContent>

        {/* Footer: ngày cập nhật — chỉ hiện sau khi có kết quả đầu tiên */}
        {convertDate && (
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Cập nhật: {formatDate(convertDate)}
            </p>
          </CardFooter>
        )}
      </Card>
    </>
  )
}
