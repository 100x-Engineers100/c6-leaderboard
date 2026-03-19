import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_LEADERBOARD_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_LEADERBOARD_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/admin/login`)
  }

  const { data: adminRow } = await supabase
    .from('admin_emails')
    .select('email')
    .eq('email', data.user.email)
    .single()

  if (!adminRow) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/404`)
  }

  return NextResponse.redirect(`${origin}/admin`)
}
