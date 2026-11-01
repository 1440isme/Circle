-- CreateTable
CREATE TABLE "AnonymousPostReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousPostReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnonymousPostReaction_postId_idx" ON "AnonymousPostReaction"("postId");

-- CreateIndex
CREATE INDEX "AnonymousPostReaction_userId_idx" ON "AnonymousPostReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousPostReaction_postId_userId_emoji_key" ON "AnonymousPostReaction"("postId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "AnonymousPostReaction" ADD CONSTRAINT "AnonymousPostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "AnonymousPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousPostReaction" ADD CONSTRAINT "AnonymousPostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
