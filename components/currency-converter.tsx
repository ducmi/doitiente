"use client"

// Client Component vì cần useState để lưu lựa chọn của user
import { useState } from "react"
import { ArrowLeftRight } from "lucide-react"

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

// Danh sách tiền tệ hard-code, sau này sẽ lấy từ API
const CURRENCIES = [
  { code: "USD", name: "Đô la Mỹ" },
  { code: "VND", name: "Việt Nam Đồng" },
  { code: "EUR", name: "Euro" },
  { code: "JPY", name: "Yên Nhật" },
  { code: "AUD", name: "Đô la Úc" },
]

export function CurrencyConverter() {
  // State lưu số tiền user nhập
  const [amount, setAmount] = useState("1")
  // State lưu tiền tệ nguồn (từ)
  const [fromCurrency, setFromCurrency] = useState("USD")
  // State lưu tiền tệ đích (sang)
  const [toCurrency, setToCurrency] = useState("VND")

  // Hoán đổi from ↔ to khi user bấm nút mũi tên
  function handleSwap() {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  return (
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg h-11"
          />
        </div>

        {/* --- Hàng chọn tiền tệ: From + nút swap + To --- */}
        <div className="flex items-end gap-2">
          {/* Dropdown "Từ" */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs text-muted-foreground">Từ</label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-full h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-medium">{c.code}</span>
                    <span className="ml-1.5 text-muted-foreground">{c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nút hoán đổi ở giữa */}
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
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs text-muted-foreground">Sang</label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-full h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-medium">{c.code}</span>
                    <span className="ml-1.5 text-muted-foreground">{c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>

      {/* --- Khu vực hiện kết quả (hard-code tạm) --- */}
      <CardFooter className="flex-col items-start gap-1">
        <p className="text-2xl font-semibold">
          {amount} {fromCurrency} =
        </p>
        <p className="text-3xl font-bold text-primary">
          25,000.00 {toCurrency}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tỷ giá tham khảo · Cập nhật lúc 08:00 SA
        </p>
      </CardFooter>
    </Card>
  )
}
