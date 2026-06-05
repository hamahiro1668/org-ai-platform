// Capability シードスクリプト
// 使い方:
//   DATABASE_URL=... ORG_ID=<org cuid> npx tsx packages/db-schema/prisma/seed-capabilities.ts
// ORG_ID 未指定なら最古の Organization に対して投入する。

import { PrismaClient, CapabilityStatus, CredentialStatus } from '@prisma/client';

const prisma = new PrismaClient();

type SeedCapability = {
  name: string;
  displayName: string;
  description: string;
  department: string;
  inputSchema: Record<string, unknown>;
  webhookPath: string;
  status: CapabilityStatus;
  providers: string[];
};

const SEED: SeedCapability[] = [
  {
    name: 'draft_email',
    displayName: 'メール下書き作成',
    description: '営業メール / ビジネスメールの本文を下書きする。送信はしない。受信先のヒントと目的から件名と本文を生成。',
    department: 'SALES',
    inputSchema: {
      type: 'object',
      required: ['recipientHint', 'purpose'],
      properties: {
        recipientHint: { type: 'string', description: '誰宛か (顧客名 / 役職)' },
        purpose: { type: 'string', description: 'メールの目的・要件' },
        toneHint: { type: 'string', description: '丁寧 / カジュアル / 強気 など', nullable: true },
      },
      additionalProperties: false,
    },
    webhookPath: 'cap-draft_email',
    status: 'ACTIVE',
    providers: [],
  },
  {
    name: 'send_email',
    displayName: 'メール送信',
    description: '指定された宛先・件名・本文でメールを実送信する。Gmail 接続が必要。',
    department: 'SALES',
    inputSchema: {
      type: 'object',
      required: ['to', 'subject', 'body'],
      properties: {
        to: { type: 'string', format: 'email' },
        subject: { type: 'string' },
        body: { type: 'string' },
        cc: { type: 'string', nullable: true },
      },
      additionalProperties: false,
    },
    webhookPath: 'cap-send_email',
    status: 'NEEDS_AUTH',
    providers: ['gmail'],
  },
  {
    name: 'post_to_x',
    displayName: 'X (Twitter) 投稿',
    description: 'X (旧 Twitter) にツイートを投稿する。X API 接続が必要。',
    department: 'MARKETING',
    inputSchema: {
      type: 'object',
      required: ['text'],
      properties: {
        text: { type: 'string', maxLength: 280 },
      },
      additionalProperties: false,
    },
    webhookPath: 'cap-post_to_x',
    status: 'NEEDS_AUTH',
    providers: ['x'],
  },
  {
    name: 'summarize_sheet',
    displayName: 'Googleスプレッドシート要約',
    description: '指定 ID の Google スプレッドシートを読んで内容を要約する。',
    department: 'ANALYTICS',
    inputSchema: {
      type: 'object',
      required: ['sheetId'],
      properties: {
        sheetId: { type: 'string' },
        range: { type: 'string', nullable: true },
      },
      additionalProperties: false,
    },
    webhookPath: 'cap-summarize_sheet',
    status: 'NEEDS_AUTH',
    providers: ['google_sheets'],
  },
  {
    name: 'notify_slack',
    displayName: 'Slack 通知',
    description: '指定チャンネルへ Slack メッセージを送る。管理者通知 / 未対応要望通知に内部利用される。',
    department: 'GENERAL',
    inputSchema: {
      type: 'object',
      required: ['channel', 'text'],
      properties: {
        channel: { type: 'string' },
        text: { type: 'string' },
      },
      additionalProperties: false,
    },
    webhookPath: 'cap-notify_slack',
    status: 'NEEDS_AUTH',
    providers: ['slack'],
  },
];

async function main(): Promise<void> {
  const orgId = process.env.ORG_ID ?? (await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } }))?.id;
  if (!orgId) {
    console.error('ERROR: Organization が 1 件もありません。先にユーザー登録で組織を作ってください。');
    process.exit(1);
  }
  console.log(`シード対象 orgId: ${orgId}`);

  for (const cap of SEED) {
    const existing = await prisma.capability.findUnique({
      where: { orgId_name: { orgId, name: cap.name } },
    });
    const data = {
      orgId,
      name: cap.name,
      displayName: cap.displayName,
      description: cap.description,
      department: cap.department,
      inputSchema: cap.inputSchema as object,
      status: cap.status,
      webhookPath: cap.webhookPath,
    };
    let capId: string;
    if (existing) {
      const updated = await prisma.capability.update({ where: { id: existing.id }, data });
      capId = updated.id;
      console.log(`  [update] ${cap.name}`);
    } else {
      const created = await prisma.capability.create({ data });
      capId = created.id;
      console.log(`  [create] ${cap.name}`);
    }
    for (const provider of cap.providers) {
      const existingCred = await prisma.requiredCredential.findFirst({
        where: { capabilityId: capId, provider },
      });
      if (!existingCred) {
        await prisma.requiredCredential.create({
          data: { capabilityId: capId, provider, status: 'DISCONNECTED' as CredentialStatus },
        });
        console.log(`     + cred ${provider}`);
      }
    }
  }
  console.log('シード完了。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
