import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    // create 10 challenges
    const challenges = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
            prisma.pronunciationChallenge.upsert({
                where: { orderIndex: i + 1 },
                update: { title: `Basics ${i + 1}` },
                create: { orderIndex: i + 1, title: `Basics ${i + 1}` },
            })
        )
    );

    const base = [
        { jpText: "私はりんごです。", jpReading: "わたしはりんごです", enText: "I am an apple." },
        { jpText: "今日はいい天気です。", jpReading: "きょうはいいてんきです", enText: "The weather is nice today." },
        { jpText: "水をください。", jpReading: "みずをください", enText: "Water, please." },
        { jpText: "駅はどこですか。", jpReading: "えきはどこですか", enText: "Where is the station?" },
        { jpText: "もう一度言ってください。", jpReading: "もういちどいってください", enText: "Please say it again." },
        { jpText: "明日会いましょう。", jpReading: "あしたあいましょう", enText: "Let's meet tomorrow." },
        { jpText: "すみません、遅れました。", jpReading: "すみませんおくれました", enText: "Sorry, I'm late." },
        { jpText: "コーヒーが好きです。", jpReading: "こーひーがすきです", enText: "I like coffee." },
        { jpText: "日本語を勉強しています。", jpReading: "にほんごをべんきょうしています", enText: "I am studying Japanese." },
        { jpText: "これは何ですか。", jpReading: "これはなんですか", enText: "What is this?" },
    ];

    for (const c of challenges) {
        for (const s of base) {
            await prisma.pronunciationSentence.create({
                data: { challengeId: c.id, ...s },
            });
        }
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
