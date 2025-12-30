export default function LoginPage() {
	return (
		<main className="grid min-h-screen place-items-center bg-[#faf7f0]">
			<div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
				<h1 className="text-2xl font-semibold">JP Trainer</h1>
				<p className="mt-1 text-sm text-neutral-600">Sign in to continue</p>

				<div className="mt-6 space-y-3">
					<button className="w-full rounded-xl border px-4 py-2">Continue with Google</button>
					<button className="w-full rounded-xl border px-4 py-2">Continue with GitHub</button>

					<div className="text-center text-xs text-neutral-400">or</div>

					<input className="w-full rounded-xl border px-3 py-2" placeholder="Email" />
					<input
						className="w-full rounded-xl border px-3 py-2"
						placeholder="Password"
						type="password"
					/>
					<button className="w-full rounded-xl bg-black px-4 py-2 text-white">Sign in</button>
				</div>
			</div>
		</main>
	);
}
