#!/bin/bash

set -e

echo "🚀 Setting up Developer Workflow MCP Servers"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm -v)"

# Check acli (optional for Jira)
if command -v acli &> /dev/null; then
    echo "✅ acli installed"
else
    echo "⚠️  acli not found (required for Jira server)"
    echo "   Install from: https://bobswift.atlassian.net/wiki/spaces/ACLI/overview"
fi

# Check az CLI (optional for Azure DevOps)
if command -v az &> /dev/null; then
    echo "✅ Azure CLI installed"

    # Check for Azure DevOps extension
    if az extension list | grep -q "azure-devops"; then
        echo "✅ Azure DevOps extension installed"
    else
        echo "⚠️  Azure DevOps extension not installed"
        echo "   Installing Azure DevOps extension..."
        az extension add --name azure-devops
        echo "✅ Azure DevOps extension installed"
    fi
else
    echo "⚠️  Azure CLI not found (required for Azure DevOps server)"
    echo "   Install from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli"
fi

echo ""
echo "📦 Installing dependencies and building servers..."
echo ""

# Build Jira MCP Server
echo "🔨 Building Jira MCP Server..."
cd jira-mcp-server
npm install
npm run build
echo "✅ Jira MCP Server built successfully"
cd ..

echo ""

# Build Azure DevOps MCP Server
echo "🔨 Building Azure DevOps MCP Server..."
cd azure-mcp-server
npm install
npm run build
echo "✅ Azure DevOps MCP Server built successfully"
cd ..

echo ""
echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Configure acli for Jira (if not already done):"
echo "   acli jira --server \"https://yourcompany.atlassian.net\" --user \"your-email@company.com\" --password \"your-api-token\""
echo ""
echo "2. Login to Azure (if not already done):"
echo "   az login"
echo ""
echo "3. Add the following to your JetBrains Rider MCP configuration:"
echo "   (Click GitHub Copilot icon → Edit settings → MCP Servers section)"
echo ""
echo "{"
echo "  \"mcpServers\": {"
echo "    \"jira\": {"
echo "      \"command\": \"node\","
echo "      \"args\": [\"$(pwd)/jira-mcp-server/dist/index.js\"]"
echo "    },"
echo "    \"azure-devops\": {"
echo "      \"command\": \"node\","
echo "      \"args\": [\"$(pwd)/azure-mcp-server/dist/index.js\"]"
echo "    }"
echo "  }"
echo "}"
echo ""
echo "4. Restart JetBrains Rider"
echo ""
echo "📖 For more information, see README.md"
