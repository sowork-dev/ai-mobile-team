#!/bin/bash
# AI Mobile Team - Deploy Script
# 部署到 mobileteam.sowork.ai (Azure VM: 20.189.116.148)

set -e

# 配置
SSH_HOST="20.189.116.148"
SSH_USER="azureuser"
APP_DIR="/home/azureuser/ai-mobile-team"
PM2_NAME="ai-mobile-team"

echo "🚀 Deploying AI Mobile Team..."

# 1. Build locally
echo "📦 Building..."
pnpm build

# 2. SSH and deploy
echo "🔄 Deploying to $SSH_HOST..."

ssh $SSH_USER@$SSH_HOST << 'EOF'
  cd /home/azureuser

  # Clone or pull
  if [ ! -d "ai-mobile-team" ]; then
    git clone https://github.com/sowork-dev/ai-mobile-team.git
  fi

  cd ai-mobile-team
  git pull origin main

  # Install deps
  pnpm install --frozen-lockfile

  # Build
  pnpm build

  # Restart with PM2
  pm2 restart ai-mobile-team 2>/dev/null || pm2 start dist/index.js --name ai-mobile-team

  echo "✅ Deployed successfully!"
EOF

echo "🎉 Deployment complete!"
echo "🔗 URL: https://mobileteam.sowork.ai"
