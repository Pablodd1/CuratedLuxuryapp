import { Layout } from './layout'

export function ResetPasswordPage() {
  return (
    <Layout title="Reset Password — CuratedLux">
      <main class="min-h-[80vh] flex items-center justify-center px-4">
        <div class="w-full max-w-md">
          <div class="bg-black border border-[#8a1c2c] rounded-lg p-8 shadow-2xl shadow-[#8a1c2c]/10">
            <h2 class="text-2xl font-bold text-[#8a1c2c] mb-2">Reset Password</h2>
            <p class="text-gray-400 text-sm mb-6">Enter your new password below.</p>

            <div id="reset-error" class="hidden bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded p-3 mb-4"></div>
            <div id="reset-success" class="hidden bg-green-900/30 border border-green-500/50 text-green-300 text-sm rounded p-3 mb-4"></div>

            <form id="reset-form" onsubmit="event.preventDefault(); handleReset();">
              <div class="mb-4">
                <label class="block text-gray-400 text-xs uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  id="r_password"
                  required
                  minlength="8"
                  placeholder="Min 8 characters"
                  class="w-full bg-gray-900 border border-[#8a1c2c]/30 rounded px-3 py-2.5 text-white placeholder-gray-600 focus:border-[#8a1c2c] focus:outline-none focus:ring-1 focus:ring-[#8a1c2c]/30 transition text-sm"
                />
              </div>
              <button
                type="submit"
                id="reset-btn"
                class="w-full bg-[#8a1c2c] text-black font-semibold rounded px-4 py-2.5 hover:bg-[#a3223a] transition text-sm disabled:opacity-50"
              >
                Reset Password
              </button>
            </form>

            <p class="text-gray-600 text-xs text-center mt-6">
              <a href="/login" class="text-[#8a1c2c] hover:text-[#a3223a] transition">Back to sign in</a>
            </p>
          </div>
        </div>
      </main>

      <script
        dangerouslySetInnerHTML={{
          __html: `
        (function() {
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get('token');

          if (!token) {
            document.getElementById('reset-error').textContent = 'Missing reset token. Please use the link from your email.';
            document.getElementById('reset-error').classList.remove('hidden');
            document.getElementById('reset-form').classList.add('hidden');
            return;
          }

          window.handleReset = async function() {
            const password = document.getElementById('r_password').value;
            const btn = document.getElementById('reset-btn');
            const errEl = document.getElementById('reset-error');
            const successEl = document.getElementById('reset-success');

            errEl.classList.add('hidden');
            successEl.classList.add('hidden');

            if (password.length < 8) {
              errEl.textContent = 'Password must be at least 8 characters.';
              errEl.classList.remove('hidden');
              return;
            }

            btn.disabled = true;
            btn.textContent = 'Resetting...';

            try {
              const res = await fetch('/api/auth/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token, password: password }),
              });
              const data = await res.json();
              if (res.ok) {
                successEl.classList.remove('hidden');
                successEl.innerHTML = data.message + ' <a href="/login" class="underline text-[#a3223a]">Sign in now</a>';
                document.getElementById('reset-form').classList.add('hidden');
              } else {
                errEl.textContent = data.message || 'Reset failed. The link may have expired.';
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.textContent = 'Reset Password';
              }
            } catch (e) {
              errEl.textContent = 'Network error. Please try again.';
              errEl.classList.remove('hidden');
              btn.disabled = false;
              btn.textContent = 'Reset Password';
            }
          };
        })();
        `,
        }}
      />
    </Layout>
  )
}
