import Link from "next/link";
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

function Tile({
	title,
	desc,
	href,
	enabled,
}: {
	title: string;
	desc: string;
	href?: string;
	enabled: boolean;
}) {
	const base = "rounded-2xl border bg-white p-5 shadow-sm";
	if (!enabled) {
		return (
			<div className={`${base} opacity-60`}>
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
					<span className="text-xs rounded-full border px-2 py-1">Coming soon</span>
				
				</div>
				<p className="mt-2 text-sm text-neutral-800">{desc}</p>
			</div>
		)
	}

	return (
		<Link href={href ?? "#"} className={`${base} hover:shadow translation`}>
			<h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
			<p className="mt-2 text-sm text-neutral-600">{desc}</p>
		</Link>
	);
}

export default async function DashboardPage() {
	const session = await getServerSession();
	if (!session) redirect('/login');

	return (
		<main className="min-h-screen bg-[#faf7f0] p-6">
			<header className="mb-6">
				<h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
				<p className="text-sm text-neutral-600">Signed in as {session.user?.email}</p>
			</header>

			<div className="grid gap-4 sm:grid-cols-2">
				<Tile
					title="WaniKani Refresher"
					desc="Review Kanji that you already have unlocked"
					href="/practice/wanikani/setup"
					enabled={true}
				/>
				<Tile
					title="Verb Conjugation"
					desc="Conjugate ichidan, godan, and irregular verbs "
					href=""
					enabled={false}
				/>
				<Tile
					title="Pronunciation"
					desc="Practice speaking Japanese sentences"
					href="/practice/pronunciation/setup"
					enabled={true}
				/>
				<Tile
					title="Sentence Translation"
					desc="Type English translations of Japanese sentences"
					href=""
					enabled={false}
				/>
			</div>
		</main>
	);
}
