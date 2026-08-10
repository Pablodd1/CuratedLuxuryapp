import { Layout } from './layout'

export function LoginPage({ mode = 'login' }: { mode?: 'login' | 'signup' }) {
  const isSignup = mode === 'signup'
  return (
    <Layout title={isSignup ? 'Sign Up · CuratedLux' : 'Sign In · CuratedLux'} active="account">
      <div class="max-w-md mx-auto py-8">
        <header class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/[0.08] border border-gold/20 mb-3">
            <i class="fas fa-gem text-gold text-xl"></i>
          </div>
          <h1 class="text-2xl font-serif font-bold text-gold mb-1">
            {isSignup ? 'Create CuratedLux account' : 'Welcome back'}
          </h1>
          <p class="text-sm text-white/50">
            {isSignup
              ? 'Persisted scans, history, and webhook exports.'
              : 'Sign in to access your scan history.'}
          </p>
        </header>

        <form id={`${mode}-form`} class="bg-card border border-gold/[0.08] rounded-xl p-6 space-y-4">
          {isSignup && (
            <div>
              <label class="block text-xs text-white/40 mb-1 uppercase tracking-wider">Display name</label>
              <input name="display_name" type="text" required minLength={2}
                class="w-full bg-black/30 border border-white/[0.06] rounded px-3 py-2 text-sm text-white focus:border-gold/50 focus:outline-none" />
            </div>
          )}
          <div>
            <label class="block text-xs text-white/40 mb-1 uppercase tracking-wider">Email</label>
            <input name="email" type="email" required
              class="w-full bg-black/30 border border-white/[0.06] rounded px-3 py-2 text-sm text-white focus:border-gold/50 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs text-white/40 mb-1 uppercase tracking-wider">Password</label>
            <input name="password" type="password" required minLength={8}
              class="w-full bg-black/30 border border-white/[0.06] rounded px-3 py-2 text-sm text-white focus:border-gold/50 focus:outline-none" />
            <p class="text-[10px] text-white/30 mt-1">Minimum 8 characters</p>
          </div>
          <button type="submit"
            class="w-full bg-gold text-black font-semibold py-2.5 rounded hover:bg-gold-light transition-colors">
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p class="text-center text-sm text-white/40 mt-4">
          {isSignup ? (
            <>Already have an account? <a href="/login" class="text-gold hover:text-gold-light">Sign in</a></>
          ) : (
            <>No account yet? <a href="/signup" class="text-gold hover:text-gold-light">Create one</a></>
          )}
        </p>

        <script>{`
          const form = document.getElementById('${mode}-form');
          if (form) {
            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              const btn = form.querySelector('button[type=submit]');
              btn.disabled = true;
              btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Working...';
              const data = Object.fromEntries(new FormData(form));
              try {
                const res = await fetch('/api/auth/${mode}', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                });
                if (!res.ok) {
                  const e = await res.json().catch(() => ({}));
                  throw new Error(e.message || e.error || 'Sign in failed');
                }
                window.location.href = '/account';
              } catch (err) {
                btn.disabled = false;
                btn.textContent = '${isSignup ? 'Create Account' : 'Sign In'}';
                const errBox = document.createElement('div');
                errBox.className = 'text-xs text-red-400 text-center mt-2';
                errBox.textContent = err.message;
                form.appendChild(errBox);
              }
            });
          }
        `}</script>
      </div>
    </Layout>
  )
}
