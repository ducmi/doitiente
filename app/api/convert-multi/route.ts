import { getCachedRates } from "@/lib/exchange-rates"

// Kiểu trả về cho mỗi currency trong kết quả
type ConvertResult = {
  to: string
  rate: number | null
  result: number | null
  error?: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const from = searchParams.get("from")
  const amountStr = searchParams.get("amount")
  const toStr = searchParams.get("to") // "VND,EUR,AUD"

  if (!from || !amountStr || !toStr) {
    return Response.json({ error: "Thiếu tham số: from, amount, to" }, { status: 400 })
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount < 0) {
    return Response.json({ error: "Số tiền không hợp lệ" }, { status: 400 })
  }

  // Parse danh sách currency đích, bỏ giá trị trống
  const toCurrencies = toStr.split(",").map(s => s.trim()).filter(Boolean)
  if (toCurrencies.length === 0 || toCurrencies.length > 5) {
    return Response.json({ error: "to phải có 1-5 currencies" }, { status: 400 })
  }

  const fromLower = from.toLowerCase()
  const today = new Date().toISOString().split("T")[0]

  try {
    // Một lần gọi getCachedRates(fromLower) → trả về ALL tỷ giá cho base này
    // Tính kết quả cho tất cả destination currencies mà không cần thêm request nào
    const data = await getCachedRates(fromLower)
    const ratesForBase = data[fromLower] as Record<string, number> | undefined

    if (!ratesForBase) {
      return Response.json({ error: `Currency not supported: ${from.toUpperCase()}` }, { status: 404 })
    }

    const results: ConvertResult[] = toCurrencies.map(to => {
      const toLower = to.toLowerCase()

      // Cùng currency → tỷ giá 1:1
      if (fromLower === toLower) {
        return { to: to.toUpperCase(), rate: 1, result: amount }
      }

      const rate = ratesForBase[toLower]
      if (rate === undefined) {
        return { to: to.toUpperCase(), rate: null, result: null, error: `Không hỗ trợ ${to.toUpperCase()}` }
      }

      return { to: to.toUpperCase(), rate, result: amount * rate }
    })

    return Response.json({
      from: from.toUpperCase(),
      amount,
      date: (data.date as string) ?? today,
      results,
    })
  } catch (err) {
    console.error("[/api/convert-multi]", err)
    return Response.json({ error: "Không thể lấy tỷ giá" }, { status: 500 })
  }
}
