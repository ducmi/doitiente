// force-static: route không dùng request params → Next.js cache toàn bộ response
export const dynamic = "force-static"
// Revalidate sau 24 giờ — danh sách tiền tệ thay đổi rất hiếm
export const revalidate = 86400

const CURRENCIES_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json"

// Whitelist ISO 4217 fiat currencies — loại bỏ crypto và các code lạ từ Currency-API
// Set dùng O(1) lookup, hiệu quả hơn Array.includes khi filter 200+ currencies
const FIAT_WHITELIST = new Set([
  "usd", "eur", "vnd", "jpy", "gbp", "aud", "cad", "chf", "cny", "hkd",
  "sgd", "thb", "krw", "inr", "idr", "myr", "php", "twd", "nzd", "sek",
  "nok", "dkk", "pln", "czk", "huf", "ron", "bgn", "hrk", "rub", "try",
  "zar", "ils", "aed", "sar", "egp", "mxn", "brl", "ars", "clp", "cop",
  "pen", "uyu", "xof", "xaf", "bdt", "lkr", "npr", "pkr", "kzt", "uzs",
  "mnt", "khr", "lak", "mmk", "bnd", "fjd", "wst", "top", "pgk", "sbd",
  "vuv", "xpf",
])

export async function GET() {
  try {
    const res = await fetch(CURRENCIES_URL)

    if (!res.ok) {
      throw new Error(`Currency-API trả về ${res.status}`)
    }

    // Currency-API trả về keys lowercase: { "usd": "US Dollar", "vnd": "Vietnamese đồng", ... }
    // Tên có thể chứa ký tự Unicode (đồng, €...) — JSON.parse xử lý đúng UTF-8 tự động
    const data: Record<string, string> = await res.json()

    // Lọc chỉ giữ fiat, rồi UPPERCASE code để giữ convention hiển thị (USD, VND, EUR...)
    const currencies = Object.entries(data)
      .filter(([code]) => FIAT_WHITELIST.has(code))
      .map(([code, name]) => ({ code: code.toUpperCase(), name }))
      .sort((a, b) => a.code.localeCompare(b.code))

    return Response.json(currencies)
  } catch (err) {
    console.error("[/api/currencies]", err)
    return Response.json(
      { error: "Không thể tải danh sách tiền tệ" },
      { status: 500 }
    )
  }
}
