import { unstable_cache } from "next/cache"

// Currency-API trả về toàn bộ tỷ giá cho một đồng tiền gốc
// { "date": "2025-04-19", "usd": { "vnd": 25389.5, "eur": 0.92, ... } }
type CurrencyApiResponse = {
  date: string
  [base: string]: Record<string, number> | string // base là key động (vd: "usd")
}

const BASE_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies"

// Cache theo from (lowercase) — một call cho "usd.json" trả về TẤT CẢ tỷ giá theo USD
// → 100 user tra USD→VND và USD→EUR vẫn chỉ là 1 request/giờ thay vì 2
const getCachedRates = unstable_cache(
  async (fromLower: string): Promise<CurrencyApiResponse> => {
    const res = await fetch(`${BASE_URL}/${fromLower}.json`)

    if (!res.ok) {
      throw new Error(`Currency-API trả về ${res.status} cho base=${fromLower}`)
    }

    return res.json()
  },
  ["exchange-rate"],
  { revalidate: 3600 } // Cache 1 giờ
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const amountStr = searchParams.get("amount")

  // Validate: thiếu param → 400
  if (!from || !to || !amountStr) {
    return Response.json({ error: "Thiếu tham số: from, to, amount" }, { status: 400 })
  }

  const amount = parseFloat(amountStr)

  // Validate: không phải số hợp lệ → 400
  if (isNaN(amount) || amount < 0) {
    return Response.json({ error: "Số tiền không hợp lệ" }, { status: 400 })
  }

  // Edge case: cùng đơn vị → tỷ giá 1:1, không cần gọi API
  if (from.toUpperCase() === to.toUpperCase()) {
    const today = new Date().toISOString().split("T")[0]
    return Response.json({
      amount,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      result: amount,
      rate: 1,
      date: today,
    })
  }

  // Currency-API dùng lowercase — normalize trước khi gọi
  const fromLower = from.toLowerCase()
  const toLower = to.toLowerCase()

  try {
    const data = await getCachedRates(fromLower)

    // data[fromLower] là object chứa tất cả tỷ giá, vd: data["usd"]["vnd"] = 25389.5
    const ratesForBase = data[fromLower] as Record<string, number> | undefined

    if (!ratesForBase) {
      return Response.json(
        { error: `Currency not supported: ${from.toUpperCase()}` },
        { status: 404 }
      )
    }

    const rate = ratesForBase[toLower]

    if (rate === undefined) {
      return Response.json(
        { error: `Currency not supported: ${to.toUpperCase()}` },
        { status: 404 }
      )
    }

    // Trả về UPPERCASE để consistent với frontend
    return Response.json({
      amount,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      result: amount * rate,
      rate,
      date: data.date as string,
    })
  } catch (err) {
    console.error("[/api/convert]", err)
    return Response.json({ error: "Không thể lấy tỷ giá" }, { status: 500 })
  }
}
