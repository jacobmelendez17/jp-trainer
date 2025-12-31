'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [msg, setMsg] = useState('');

	async function doSignup() {
		setMsg('Creating account...');
		const res = await fetch('/api/auth/signup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		const data = await res.json();
		if (!res.ok) return setMsg(data?.error ?? 'Signup failed');
		setMsg('Account created. Now sign in.');
	}

	async function doCredentialsSignIn() {
		setMsg('Signing in...');
		await signIn('credentials', {
			email,
			password,
			redirect: true,
			callbackUrl: '/dashboard'
		});
	}

	return (
		<main className="grid min-h-screen place-items-center bg-[#faf7f0] p-6">
			<div className="w-full max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
				<h1 className="text-center text-2xl font-semibold text-neutral-800">JP Trainer</h1>

				<div className="space-y-2">
					<button
						className="w-full rounded-xl border border-black px-4 py-2 text-black hover:bg-neutral-200"
						onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
					>
						Continue with GitHub
					</button>
					<button
						className="w-full rounded-xl border border-black px-4 py-2 text-black hover:bg-neutral-200"
						onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
					>
						Continue with Google
					</button>
				</div>

				<div className="text-center text-xs text-neutral-600">or</div>

				<input
					className="w-full rounded-xl border border-black px-3 py-2 text-black"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				<input
					className="w-full rounded-xl border border-black px-3 py-2 text-black"
					placeholder="Password (8+ chars)"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>

				<div className="flex gap-2">
					<button
						className="flex-1 rounded-xl border border-black px-4 py-2 text-black hover:bg-neutral-200"
						onClick={doSignup}
					>
						Sign up
					</button>
					<button
						className="flex-1 rounded-xl bg-black px-4 py-2 text-white hover:opacity-100"
						onClick={doCredentialsSignIn}
					>
						Sign in
					</button>
				</div>

				{msg ? <p className="text-sm text-neutral-600">{msg}</p> : null}
			</div>
		</main>
	);
}
