import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';
import { storeMutedClass } from '@/lib/store-styles';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={<p className={storeMutedClass('text-center')}>Carregando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
