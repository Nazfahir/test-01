import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { uxCopy } from '@/copy/ux';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export default async function HomePage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(data.user);

  return (
    <Card>
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">{uxCopy.home.title}</h1>
        <p className="text-sm text-gray-600">{uxCopy.home.subtitle}</p>
        <div className="space-y-2 text-sm">
          <Link className="block font-semibold text-primary" href="/rooms/create">
            {uxCopy.home.createRoomCta}
          </Link>
          <Link className="block font-semibold text-primary" href="/rooms/join">
            {uxCopy.home.joinRoomCta}
          </Link>
          {isLoggedIn ? (
            <Link className="block font-semibold text-primary" href="/profile">
              {uxCopy.home.profileCta}
            </Link>
          ) : (
            <>
              <Link className="block font-semibold text-primary" href="/auth/register">
                {uxCopy.home.registerCta}
              </Link>
              <Link className="block font-semibold text-primary" href="/auth/login">
                {uxCopy.home.loginCta}
              </Link>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
