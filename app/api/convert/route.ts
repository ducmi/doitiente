import { getCachedRates } from "@/lib/exchange-rates"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const amountStr = searchParams.get("amount")

  if (!from || !to || !amountStr) {
    return Response.json({ error: "Thiếu tham số: from, to, amount" }, { status: 400 })
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount < 0) {
    return Response.json({ error: "Số tiền không hợp lệ" }, { status: 400 })
  }

  if (from.toUpperCase() === to.toUpperCase()) {
    const today = new Date().toISOString().split("T")[0]
    return Response.json({ amount, from: from.toUpperCase(), to: to.toUpperCase(), result: amount, rate: 1, date: today })
  }

  const fromLower = from.toLowerCase()
  const toLower = to.toLowerCase()

  try {
    const data = await getCachedRates(fromLower)
    const ratesForBase = data[fromLower] as Record<string, number> | undefined

    if (!ratesForBase) {
      return Response.json({ error: `Currency not supported: ${from.toUpperCase()}` }, { status: 404 })
    }

    const rate = ratesForBase[toLower]
    if (rate === undefined) {
      return Response.json({ error: `Currency not supported: ${to.toUpperCase()}` }, { status: 404 })
    }

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
