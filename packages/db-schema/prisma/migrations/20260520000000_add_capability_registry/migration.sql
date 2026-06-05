-- CreateEnum
CREATE TYPE "CapabilityStatus" AS ENUM ('ACTIVE', 'NEEDS_AUTH', 'DISABLED');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('CONNECTED', 'DISCONNECTED');

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "inputSchema" JSONB NOT NULL,
    "status" "CapabilityStatus" NOT NULL DEFAULT 'NEEDS_AUTH',
    "n8nWorkflowId" TEXT,
    "webhookPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequiredCredential" (
    "id" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "lastCheckedAt" TIMESTAMP(3),

    CONSTRAINT "RequiredCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityGap" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "rawRequest" TEXT NOT NULL,
    "inferredName" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapabilityGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "capabilityId" TEXT,
    "status" TEXT NOT NULL,
    "errorType" TEXT,
    "requestArgs" JSONB NOT NULL,
    "responseData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Capability_orgId_name_key" ON "Capability"("orgId", "name");

-- CreateIndex
CREATE INDEX "Capability_orgId_status_idx" ON "Capability"("orgId", "status");

-- CreateIndex
CREATE INDEX "RequiredCredential_capabilityId_idx" ON "RequiredCredential"("capabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityGap_orgId_inferredName_key" ON "CapabilityGap"("orgId", "inferredName");

-- CreateIndex
CREATE INDEX "CapabilityGap_orgId_createdAt_idx" ON "CapabilityGap"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "ExecutionLog_orgId_createdAt_idx" ON "ExecutionLog"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "ExecutionLog_capabilityId_idx" ON "ExecutionLog"("capabilityId");

-- AddForeignKey
ALTER TABLE "RequiredCredential" ADD CONSTRAINT "RequiredCredential_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;
