-- CreateTable
CREATE TABLE "WheelFolder" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WheelFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WheelFolder_circleId_createdAt_idx" ON "WheelFolder"("circleId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WheelFolder_createdById_idx" ON "WheelFolder"("createdById");

-- AddForeignKey
ALTER TABLE "WheelFolder" ADD CONSTRAINT "WheelFolder_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WheelFolder" ADD CONSTRAINT "WheelFolder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "CircleMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
