-- CreateTable
CREATE TABLE "PronunciationChallenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PronunciationChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PronunciationSentence" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "jpText" TEXT NOT NULL,
    "jpReading" TEXT NOT NULL,
    "furiganaHtml" TEXT,
    "enText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PronunciationSentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPronunciationChallengeProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPronunciationChallengeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PronunciationChallenge_orderIndex_key" ON "PronunciationChallenge"("orderIndex");

-- CreateIndex
CREATE INDEX "PronunciationSentence_challengeId_idx" ON "PronunciationSentence"("challengeId");

-- CreateIndex
CREATE INDEX "UserPronunciationChallengeProgress_userId_idx" ON "UserPronunciationChallengeProgress"("userId");

-- CreateIndex
CREATE INDEX "UserPronunciationChallengeProgress_challengeId_idx" ON "UserPronunciationChallengeProgress"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPronunciationChallengeProgress_userId_challengeId_key" ON "UserPronunciationChallengeProgress"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "PronunciationSentence" ADD CONSTRAINT "PronunciationSentence_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "PronunciationChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPronunciationChallengeProgress" ADD CONSTRAINT "UserPronunciationChallengeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPronunciationChallengeProgress" ADD CONSTRAINT "UserPronunciationChallengeProgress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "PronunciationChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
