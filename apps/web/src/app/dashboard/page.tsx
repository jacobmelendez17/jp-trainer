import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
	const session = await getServerSession();
	if (!session) redirect('/login');

	return (
		<main className="p=6">
			<h1 className="text-2xl font-semibold">Dashboard</h1>
			<p className="text-neutral-6-- mt-2">Signed in</p>
		</main>
	);
}
