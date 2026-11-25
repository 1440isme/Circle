import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootIndexPage() {
  const cookieStore = await cookies();
  const hasToken =
    cookieStore.has('circle_access_token') ||
    cookieStore.has('circle_refresh_token');

  if (!hasToken) {
    redirect('/login');
  }

  redirect('/chat');
}

