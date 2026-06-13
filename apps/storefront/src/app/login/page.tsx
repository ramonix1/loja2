import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-gray-500">Carregando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
