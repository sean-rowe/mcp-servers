#!/bin/bash

set -e

echo "🚀 Setting up Developer Workflow MCP Servers"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python - prefer python3.12, fall back to python3
PYTHON_CMD=""

if command -v python3.12 &> /dev/null; then
    PYTHON_CMD="python3.12"
    echo "✅ Found Python 3.12: $(python3.12 --version)"
elif command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

    if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 10 ]; then
        PYTHON_CMD="python3"
        echo "✅ Python $(python3 --version | cut -d' ' -f2)"
    else
        echo "❌ Python version must be 3.10 or higher. Current version: $(python3 --version)"
        echo "   Install Python 3.12: brew install python@3.12"
        exit 1
    fi
else
    echo "❌ Python 3 is not installed. Please install Python 3.10+ first."
    echo "   Install with: brew install python@3.12"
    exit 1
fi

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
echo "📝 Setting up Confluence environment variables..."
echo ""

# Detect shell configuration file
SHELL_CONFIG=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
fi

if [ -n "$SHELL_CONFIG" ]; then
    # Check if CONFLUENCE_URL is already configured
    if grep -q "CONFLUENCE_URL" "$SHELL_CONFIG"; then
        echo "✅ Confluence environment variables already configured in $SHELL_CONFIG"
    else
        echo "📝 Adding Confluence environment variables to $SHELL_CONFIG..."
        cat >> "$SHELL_CONFIG" << 'ENVEOF'

# MCP Confluence Server Configuration
# TODO: Update these values with your actual Confluence credentials
export CONFLUENCE_URL="https://yourcompany.atlassian.net"
export CONFLUENCE_EMAIL="your.email@company.com"
export CONFLUENCE_API_TOKEN="your_api_token_here"
ENVEOF
        echo "✅ Environment variables added to $SHELL_CONFIG"
        echo "⚠️  IMPORTANT: Edit $SHELL_CONFIG and update the Confluence values!"
        echo "   Then run: source $SHELL_CONFIG"
    fi
else
    echo "⚠️  Could not detect shell config file (.zshrc, .bashrc, or .bash_profile)"
    echo "   You'll need to manually add Confluence environment variables"
fi

echo ""
echo "📦 Setting up Python virtual environments..."
echo ""

# Create virtual environments and install dependencies for each server
for server in jira-mcp-server confluence-mcp-server azure-mcp-server; do
    echo "🔨 Setting up $server..."
    cd "$server"

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "   Creating virtual environment with $PYTHON_CMD..."
        $PYTHON_CMD -m venv venv
    fi

    # Activate virtual environment and install dependencies
    echo "   Installing dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    deactivate

    cd ..
    echo "✅ $server setup complete"
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
if [ -n "$SHELL_CONFIG" ] && ! grep -q "CONFLUENCE_URL.*yourcompany.atlassian.net" "$SHELL_CONFIG" 2>/dev/null; then
    echo "3. Edit your shell config and update Confluence credentials:"
    echo "   Open: $SHELL_CONFIG"
    echo "   Update the CONFLUENCE_URL, CONFLUENCE_EMAIL, and CONFLUENCE_API_TOKEN values"
    echo "   Then run: source $SHELL_CONFIG"
else
    echo "3. For Confluence, update the environment variables in your shell config:"
    echo "   Edit: $SHELL_CONFIG (already configured with placeholder values)"
fi
echo ""
echo "4. Add the following to your JetBrains Rider MCP configuration:"
echo "   (Click GitHub Copilot icon → Edit settings → MCP Servers section)"
echo ""
echo "{"
echo "  \"mcpServers\": {"
echo "    \"jira\": {"
echo "      \"command\": \"$(pwd)/jira-mcp-server/venv/bin/python\","
echo "      \"args\": [\"$(pwd)/jira-mcp-server/server.py\"]"
echo "    },"
echo "    \"confluence\": {"
echo "      \"command\": \"$(pwd)/confluence-mcp-server/venv/bin/python\","
echo "      \"args\": [\"$(pwd)/confluence-mcp-server/server.py\"]"
echo "    },"
echo "    \"azure-devops\": {"
echo "      \"command\": \"$(pwd)/azure-mcp-server/venv/bin/python\","
echo "      \"args\": [\"$(pwd)/azure-mcp-server/server.py\"]"
echo "    }"
echo "  }"
echo "}"
echo ""
echo "Note: Confluence env vars are in $SHELL_CONFIG (update them there)"
echo ""
echo "5. Restart JetBrains Rider"
echo ""
echo "📖 For more information, see README.md"
