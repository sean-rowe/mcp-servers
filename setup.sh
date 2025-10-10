#!/bin/bash

set -e

echo "🚀 Setting up Developer Workflow MCP Servers"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]); then
    echo "❌ Python version must be 3.10 or higher. Current version: $(python3 --version)"
    exit 1
fi
echo "✅ Python $(python3 --version | cut -d' ' -f2)"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip first."
    exit 1
fi
echo "✅ pip $(pip3 --version | cut -d' ' -f2)"

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
    if az extension list 2>/dev/null | grep -q "azure-devops"; then
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
echo "📦 Installing Python dependencies..."
echo ""

# Install dependencies for each server
for server in jira-mcp-server confluence-mcp-server azure-mcp-server; do
    echo "🔨 Installing dependencies for $server..."
    cd "$server"
    pip3 install -r requirements.txt
    cd ..
    echo "✅ $server dependencies installed"
    echo ""
done

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
echo "3. For Confluence, set environment variables (or add to your shell profile):"
echo "   export CONFLUENCE_URL=\"https://yourcompany.atlassian.net\""
echo "   export CONFLUENCE_EMAIL=\"your.email@company.com\""
echo "   export CONFLUENCE_API_TOKEN=\"your_api_token\""
echo ""
echo "4. Add the following to your JetBrains Rider MCP configuration:"
echo "   (Click GitHub Copilot icon → Edit settings → MCP Servers section)"
echo ""
echo "{"
echo "  \"mcpServers\": {"
echo "    \"jira\": {"
echo "      \"command\": \"python3\","
echo "      \"args\": [\"$(pwd)/jira-mcp-server/server.py\"]"
echo "    },"
echo "    \"confluence\": {"
echo "      \"command\": \"python3\","
echo "      \"args\": [\"$(pwd)/confluence-mcp-server/server.py\"],"
echo "      \"env\": {"
echo "        \"CONFLUENCE_URL\": \"https://yourcompany.atlassian.net\","
echo "        \"CONFLUENCE_EMAIL\": \"your.email@company.com\","
echo "        \"CONFLUENCE_API_TOKEN\": \"your_api_token_here\""
echo "      }"
echo "    },"
echo "    \"azure-devops\": {"
echo "      \"command\": \"python3\","
echo "      \"args\": [\"$(pwd)/azure-mcp-server/server.py\"]"
echo "    }"
echo "  }"
echo "}"
echo ""
echo "5. Restart JetBrains Rider"
echo ""
echo "📖 For more information, see README.md"
