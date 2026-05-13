#!/bin/bash
# 本番 Neon に Owner アカウントを 1 件作成する。
# パスワードは履歴・画面に残らないよう -s で読み取り、一時 env 変数経由で ts-node に渡す。
set -e

cd "$(dirname "$0")/.."

if [ ! -f .env.vercel.production ]; then
  echo "❌ .env.vercel.production がありません。先に vercel env pull を実行してください。"
  exit 1
fi

set -a
source .env.vercel.production
set +a

read -p "組織名 (例: My Corp): " ORG_NAME
read -p "ユーザー名 (例: 山田 太郎): " USER_NAME
read -p "メールアドレス: " EMAIL
read -s -p "パスワード (8文字以上): " PASSWORD
echo ""
read -s -p "パスワード (確認): " PASSWORD2
echo ""

if [ "$PASSWORD" != "$PASSWORD2" ]; then
  echo "❌ パスワードが一致しません"
  exit 1
fi

if [ ${#PASSWORD} -lt 8 ]; then
  echo "❌ パスワードは8文字以上必要です"
  exit 1
fi

export _ORG_NAME="$ORG_NAME"
export _USER_NAME="$USER_NAME"
export _EMAIL="$EMAIL"
export _PASSWORD="$PASSWORD"

cd packages/db-schema
npx ts-node -e '
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
const prisma = new PrismaClient();
(async () => {
  const passwordHash = await bcrypt.hash(process.env._PASSWORD!, 10);
  const org = await prisma.organization.create({
    data: { name: process.env._ORG_NAME!, plan: "STARTER" },
  });
  await prisma.user.create({
    data: {
      email: process.env._EMAIL!,
      passwordHash,
      name: process.env._USER_NAME!,
      role: "OWNER",
      orgId: org.id,
    },
  });
  console.log("\n✅ 作成完了");
  console.log("  Organization:", org.name, "(id:", org.id, ", plan: STARTER)");
  console.log("  User:", process.env._EMAIL, "(role: OWNER)");
})().catch(e => { console.error("❌", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
'
