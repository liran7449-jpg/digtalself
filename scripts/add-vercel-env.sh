#!/bin/bash
# 批量添加 Vercel 环境变量

cd /Users/ranli/Desktop/ranlee

# AI 配置
echo "ANTHROPIC_BASE_URL" | vercel env add ANTHROPIC_BASE_URL production <<EOF
https://api.deepseek.com/anthropic
EOF

echo "ANTHROPIC_AUTH_TOKEN" | vercel env add ANTHROPIC_AUTH_TOKEN production <<EOF
sk-d080330d6ecc402f9a7d18458da40c6e
EOF

echo "ANTHROPIC_MODEL" | vercel env add ANTHROPIC_MODEL production <<EOF
deepseek-v4-pro
EOF

# Session Secret
echo "SESSION_SECRET" | vercel env add SESSION_SECRET production <<EOF
JhU1VrbjtkuqEShmcAFMl2IPGzWPF3IkdXt+sdQwKjk=
EOF

# 数据库（用 POSTGRES_URL_NON_POOLING，迁移需要）
echo "DATABASE_URL" | vercel env add DATABASE_URL production <<EOF
postgres://postgres.gjqzjozwycbedvuqdzms:RdpXcVPrscWeRB7z@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
EOF

echo "✓ 环境变量配置完成"
