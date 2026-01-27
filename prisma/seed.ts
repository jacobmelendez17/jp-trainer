import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type Sentence = { jpText: string; jpReading: string; enText: string };

type ChallengeSeed = {
    orderIndex: number;
    title: string;
    isLocked: boolean;
    isTest?: boolean;
    sentences: Sentence[];
};

const testChallenge: ChallengeSeed = {
    orderIndex: 1,
    title: "Test (2 sentences)",
    isLocked: false,
    isTest: true,
    sentences: [
        { jpText: "私は、りんごです。", jpReading: "わたしはりんごです", enText: "I am an apple." },
        { jpText: "みずをください。", jpReading: "みずをください", enText: "Water, please." },
    ],
};

const unlockedBasics: ChallengeSeed[] = [
    {
        orderIndex: 2,
        title: "Basics 1 — Greetings",
        isLocked: false,
        sentences: [
            { jpText: "こんにちは。", jpReading: "こんにちは", enText: "Hello." },
            { jpText: "おはようございます。", jpReading: "おはようございます", enText: "Good morning." },
            { jpText: "こんばんは。", jpReading: "こんばんは", enText: "Good evening." },
            { jpText: "はじめまして。", jpReading: "はじめまして", enText: "Nice to meet you." },
            { jpText: "よろしくお願いします。", jpReading: "よろしくおねがいします", enText: "Please treat me well." },
            { jpText: "お元気ですか。", jpReading: "おげんきですか", enText: "How are you?" },
            { jpText: "元気です。", jpReading: "げんきです", enText: "I'm good." },
            { jpText: "ありがとうございます。", jpReading: "ありがとうございます", enText: "Thank you." },
            { jpText: "どういたしまして。", jpReading: "どういたしまして", enText: "You're welcome." },
            { jpText: "さようなら。", jpReading: "さようなら", enText: "Goodbye." },
        ],
    },
    {
        orderIndex: 3,
        title: "Basics 2 — Polite essentials",
        isLocked: false,
        sentences: [
            { jpText: "すみません。", jpReading: "すみません", enText: "Excuse me / Sorry." },
            { jpText: "ごめんなさい。", jpReading: "ごめんなさい", enText: "I'm sorry." },
            { jpText: "お願いします。", jpReading: "おねがいします", enText: "Please." },
            { jpText: "もう一度言ってください。", jpReading: "もういちどいってください", enText: "Please say it again." },
            { jpText: "ゆっくり話してください。", jpReading: "ゆっくりはなしてください", enText: "Please speak slowly." },
            { jpText: "大丈夫です。", jpReading: "だいじょうぶです", enText: "It’s okay." },
            { jpText: "わかりました。", jpReading: "わかりました", enText: "I understand." },
            { jpText: "わかりません。", jpReading: "わかりません", enText: "I don’t understand." },
            { jpText: "はい。", jpReading: "はい", enText: "Yes." },
            { jpText: "いいえ。", jpReading: "いいえ", enText: "No." },
        ],
    },
    {
        orderIndex: 4,
        title: "Basics 3 — Simple statements",
        isLocked: false,
        sentences: [
            { jpText: "私は学生です。", jpReading: "わたしはがくせいです", enText: "I am a student." },
            { jpText: "私はアメリカ人です。", jpReading: "わたしはあめりかじんです", enText: "I am American." },
            { jpText: "日本語を勉強しています。", jpReading: "にほんごをべんきょうしています", enText: "I’m studying Japanese." },
            { jpText: "これは何ですか。", jpReading: "これはなんですか", enText: "What is this?" },
            { jpText: "それは私のです。", jpReading: "それはわたしのです", enText: "That’s mine." },
            { jpText: "今日はいい天気です。", jpReading: "きょうはいいてんきです", enText: "The weather is nice today." },
            { jpText: "私は疲れています。", jpReading: "わたしはつかれています", enText: "I’m tired." },
            { jpText: "今、忙しいです。", jpReading: "いまいそがしいです", enText: "I’m busy right now." },
            { jpText: "時間があります。", jpReading: "じかんがあります", enText: "I have time." },
            { jpText: "大丈夫です。", jpReading: "だいじょうぶです", enText: "I’m okay." },
        ],
    },
    {
        orderIndex: 5,
        title: "Basics 4 — Getting around",
        isLocked: false,
        sentences: [
            { jpText: "駅はどこですか。", jpReading: "えきはどこですか", enText: "Where is the station?" },
            { jpText: "ここはどこですか。", jpReading: "ここはどこですか", enText: "Where am I?" },
            { jpText: "右です。", jpReading: "みぎです", enText: "It’s to the right." },
            { jpText: "左です。", jpReading: "ひだりです", enText: "It’s to the left." },
            { jpText: "まっすぐ行ってください。", jpReading: "まっすぐいってください", enText: "Please go straight." },
            { jpText: "止まってください。", jpReading: "とまってください", enText: "Please stop." },
            { jpText: "助けてください。", jpReading: "たすけてください", enText: "Please help me." },
            { jpText: "トイレはどこですか。", jpReading: "といれはどこですか", enText: "Where is the bathroom?" },
            { jpText: "出口はどこですか。", jpReading: "でぐちはどこですか", enText: "Where is the exit?" },
            { jpText: "入口はどこですか。", jpReading: "いりぐちはどこですか", enText: "Where is the entrance?" },
        ],
    },
    {
        orderIndex: 6,
        title: "Basics 5 — Food & ordering",
        isLocked: false,
        sentences: [
            { jpText: "これをください。", jpReading: "これをください", enText: "This, please." },
            { jpText: "水をください。", jpReading: "みずをください", enText: "Water, please." },
            { jpText: "メニューをください。", jpReading: "めにゅーをください", enText: "Menu, please." },
            { jpText: "いくらですか。", jpReading: "いくらですか", enText: "How much is it?" },
            { jpText: "おいしいです。", jpReading: "おいしいです", enText: "It’s delicious." },
            { jpText: "辛いです。", jpReading: "からいです", enText: "It’s spicy." },
            { jpText: "これが欲しいです。", jpReading: "これがほしいです", enText: "I want this." },
            { jpText: "お願いします。", jpReading: "おねがいします", enText: "Please." },
            { jpText: "ありがとうございます。", jpReading: "ありがとうございます", enText: "Thank you." },
            { jpText: "ごちそうさまでした。", jpReading: "ごちそうさまでした", enText: "Thanks for the meal." },
        ],
    },
];

const locked: ChallengeSeed[] = Array.from({ length: 10 }, (_, i) => ({
    orderIndex: 7 + i,
    title: `Locked ${i + 1}`,
    isLocked: true,
    sentences: [
        { jpText: "今日は忙しいです。", jpReading: "きょうはいそがしいです", enText: "I’m busy today." },
        { jpText: "明日会いましょう。", jpReading: "あしたあいましょう", enText: "Let’s meet tomorrow." },
        { jpText: "今、時間がありますか。", jpReading: "いまじかんがありますか", enText: "Do you have time now?" },
        { jpText: "大丈夫ですか。", jpReading: "だいじょうぶですか", enText: "Are you okay?" },
        { jpText: "ちょっと待ってください。", jpReading: "ちょっとまってください", enText: "Please wait a moment." },
        { jpText: "写真を撮ってください。", jpReading: "しゃしんをとってください", enText: "Please take a photo." },
        { jpText: "もう一度言ってください。", jpReading: "もういちどいってください", enText: "Please say it again." },
        { jpText: "ゆっくり話してください。", jpReading: "ゆっくりはなしてください", enText: "Please speak slowly." },
        { jpText: "英語を話せますか。", jpReading: "えいごをはなせますか", enText: "Can you speak English?" },
        { jpText: "日本語を少し話せます。", jpReading: "にほんごをすこしはなせます", enText: "I can speak a little Japanese." },
    ],
}));

async function main() {
    await prisma.userPronunciationChallengeProgress.deleteMany({});
    await prisma.pronunciationSentence.deleteMany({});
    await prisma.pronunciationChallenge.deleteMany({});

    const all = [testChallenge, ...unlockedBasics, ...locked];

    for (const c of all) {
        const created = await prisma.pronunciationChallenge.create({
            data: {
                orderIndex: c.orderIndex,
                title: c.title,
                isLocked: c.isLocked,
                isTest: c.isTest ?? false,
            },
        });

        await prisma.pronunciationSentence.createMany({
            data: c.sentences.map((s) => ({ challengeId: created.id, ...s })),
        });
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
