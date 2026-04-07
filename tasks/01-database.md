# Task 01: データベース層

## 目標
Prisma + SQLiteでDB層を構築する。api-gatewayから使用する。

## 成果物

### 1. Prismaスキーマ
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/packages/db-schema/prisma/schema.prisma`

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         String   @default("OWNER") // OWNER | MEMBER | VIEWER
  orgId        String?
  org          Organization? @relation(fields: [orgId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  plan      String   @default("STARTER") // STARTER | PRO | MAX
  users     User[]
  sessions  ChatSession[]
  tasks     Task[]
  createdAt DateTime @default(now())
}

model ChatSession {
  id        String    @id @default(cuid())
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id])
  title     String?
  messages  Message[]
  createdAt DateTime  @default(now())
}

model Message {
  id         String      @id @default(cuid())
  sessionId  String
  session    ChatSession @relation(fields: [sessionId], references: [id])
  role       String      // user | assistant | system
  content    String
  department String?     // SALES | MARKETING | ACCOUNTING | GENERAL
  createdAt  DateTime    @default(now())
}

model Task {
  id         String   @id @default(cuid())
  orgId      String
  org        Organization @relation(fields: [orgId], references: [id])
  title      String
  status     String   @default("PENDING") // PENDING | RUNNING | DONE | FAILED
  department String
  input      String
  output     String?
  logs       TaskLog[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model TaskLog {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id])
  message   String
  level     String   @default("INFO") // INFO | WARN | ERROR
  createdAt DateTime @default(now())
}

model AILog {
  id         String   @id @default(cuid())
  orgId      String
  department String
  provider   String
  model      String
  inputText  String
  outputText String?
  tokens     Int?
  latencyMs  Int?
  riskScore  Float?
  createdAt  DateTime @default(now())
}

model RiskEvent {
  id          String   @id @default(cuid())
  orgId       String
  aiLogId     String?
  type        String   // PII_DETECTED | HARMFUL_CONTENT | ANOMALY
  description String
  severity    String   // LOW | MEDIUM | HIGH | CRITICAL
  resolved    Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

### 2. db-schema package.json
依存: `@prisma/client`, `prisma`

### 3. マイグレーションスクリプト
`packages/db-schema/scripts/migrate.sh` — `prisma migrate dev` 実行

### 4. シードデータ
`packages/db-schema/prisma/seed.ts`
- デモ組織: "Demo Corp"
- デモユーザー: admin@demo.com / password: demo1234

## 完了条件
- [ ] schema.prisma 作成済み
- [ ] `npx prisma generate` 成功
- [ ] `npx prisma migrate dev` 成功
- [ ] シードデータ投入可能
