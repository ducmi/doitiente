"use client"

// Wrapper mỏng để dùng next-themes trong Server Component layout.tsx
// layout.tsx là Server Component → không thể import ThemeProvider trực tiếp
// Giải pháp: file này có "use client", layout import file này
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
