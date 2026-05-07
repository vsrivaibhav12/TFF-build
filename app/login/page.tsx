import { Suspense } from 'react';
import LoginForm from './login-form';

export const metadata = {
  title: 'Sign in — The Fiscal Fulcrum',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-zinc-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-2xl font-bold tracking-tight text-zinc-900">
            The <span className="text-teal-600">Fiscal Fulcrum</span>
          </div>
          <p className="text-sm text-zinc-500 mt-2">Portal sign-in</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-zinc-400">
          Authorised users only. All sessions are logged.
        </p>
      </div>
    </main>
  );
}
