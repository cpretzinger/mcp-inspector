#!/bin/bash

echo "🧹 DEBO GIT DETOX INITIATED..."

# 🔥 Add common junk to .gitignore
cat <<EOL >> .gitignore
node_modules/
.env
.DS_Store
dist/
.next/
out/
build/
coverage/
*.log
*.sqlite
*.bak
EOL

# 💀 Unstage those bad boys from Git (but keep local)
git rm -r --cached node_modules/ .env .DS_Store dist/ .next/ out/ build/ coverage/ || true