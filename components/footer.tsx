// Server Component — không có state hay event, không cần "use client"
export function Footer() {
  return (
    <footer className="border-t py-6 px-4">
      <div className="mx-auto max-w-xl text-center space-y-1.5">
        {/* Nguồn dữ liệu — transparency với user */}
        <p className="text-xs text-muted-foreground">
          Nguồn tỷ giá:{" "}
          <a
            href="https://github.com/fawazahmed0/exchange-api"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Currency-API (fawazahmed0/exchange-api)
          </a>{" "}
          — cập nhật hàng ngày
        </p>

        {/* Disclaimer pháp lý — quan trọng để tránh hiểu lầm */}
        <p className="text-xs text-muted-foreground">
          Tỷ giá tham khảo, không phải tỷ giá giao dịch chính thức.
          Vui lòng xác nhận với ngân hàng trước khi giao dịch.
        </p>

        <p className="text-xs text-muted-foreground">© 2026 doivnd</p>
      </div>
    </footer>
  )
}
