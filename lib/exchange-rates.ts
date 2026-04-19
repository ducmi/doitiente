import { unstable_cache } from "next/cache"

// Kiểu dữ liệu Currency-API trả về cho /v1/currencies/{base}.json
// { "date": "2025-04-19", "usd": { "vnd": 25389.5, "eur": 0.92, ... } }
export type CurrencyApiResponse = {
  date: string
  [base: string]: Record<string, number> | string
}

export const BASE_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies"

// Một instance duy nhất — cả /api/convert và /api/convert-multi dùng chung cache entry
// Cache key = ["exchange-rate"] + fromLower → tất cả user tra cùng base trong 1h dùng 1 request
export const getCachedRates = unstable_cache(
  async (fromLower: string): Promise<CurrencyApiResponse> => {
    const res = await fetch(`${BASE_URL}/${fromLower}.json`)
    if (!res.ok) throw new Error(`Currency-API trả về ${res.status} cho base=${fromLower}`)
    return res.json()
  },
  ["exchange-rate"],
  { revalidate: 3600 }
)
