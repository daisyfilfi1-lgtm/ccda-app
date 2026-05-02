import { createBrowserClient, createServerClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createServerSideClient(cookieStr?: string) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (!cookieStr) return undefined
          for (const c of cookieStr.split('; ')) {
            const eq = c.indexOf('=')
            if (eq > 0 && c.substring(0, eq) === name) {
              return decodeURIComponent(c.substring(eq + 1))
            }
          }
          return undefined
        },
        set() {},
        remove() {},
      },
    }
  )
}
