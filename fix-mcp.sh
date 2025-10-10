#!/bin/bash

echo "🔧 MCP Configuration Fix Script"
echo "================================"
echo ""
echo "This script will help you fix the 'spinning loading icon' issue"
echo "by automating the steps from GitHub issue #636"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ERRORS=0

# Step 1: Check prerequisites
echo "📋 Step 1: Check Prerequisites"
echo "=============================="
echo ""
echo "⚠️  IMPORTANT: MCP is configured IN JETBRAINS RIDER, not on GitHub's website"
echo ""
echo "Before continuing, make sure you have:"
echo "  1. ✅ GitHub Copilot plugin v1.5.57+ in Rider"
echo "  2. ✅ Valid Copilot license"
echo "  3. ✅ If using Copilot Business/Enterprise: Your admin must enable"
echo "        'MCP servers in Copilot' policy"
echo ""
echo "To check your Copilot plugin version:"
echo "  Rider → Settings → Plugins → GitHub Copilot → Check version"
echo ""
read -p "Press ENTER when you've verified the above..."
echo ""

# Step 2: Check Python and virtual environments
echo "📋 Step 2: Checking Server Setup"
echo "================================"
echo ""

# Detect Python
PYTHON_CMD=""
if command -v python3.12 &> /dev/null; then
    PYTHON_CMD="python3.12"
    echo "✅ Found Python 3.12"
elif command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

    if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 10 ]; then
        PYTHON_CMD="python3"
        echo "✅ Found Python $PYTHON_VERSION"
    else
        echo "❌ Python version must be 3.10+, found $PYTHON_VERSION"
        echo "   Install: brew install python@3.12"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ Python 3 not found"
    echo "   Install: brew install python@3.12"
    ERRORS=$((ERRORS + 1))
fi

# Check/create virtual environments
if [ -n "$PYTHON_CMD" ]; then
    for server in jira-mcp-server confluence-mcp-server azure-mcp-server; do
        if [ ! -d "$server/venv" ]; then
            echo "⚙️  Creating virtual environment for $server..."
            cd "$server"
            $PYTHON_CMD -m venv venv
            source venv/bin/activate
            pip install --upgrade pip > /dev/null 2>&1
            pip install -r requirements.txt > /dev/null 2>&1
            deactivate
            cd "$SCRIPT_DIR"
            echo "✅ $server virtual environment created"
        else
            echo "✅ $server virtual environment exists"
        fi
    done
fi

echo ""

# Step 3: Check Confluence environment variables
echo "📋 Step 3: Checking Confluence Environment Variables"
echo "===================================================="
echo ""

NEED_ENV_SETUP=0
if [ -z "$CONFLUENCE_URL" ] || [ "$CONFLUENCE_URL" == "https://yourcompany.atlassian.net" ]; then
    echo "⚠️  CONFLUENCE_URL not configured"
    NEED_ENV_SETUP=1
fi

if [ $NEED_ENV_SETUP -eq 1 ]; then
    echo ""
    echo "Setting up Confluence environment variables..."

    # Detect shell config
    SHELL_CONFIG=""
    if [ -f "$HOME/.zshrc" ]; then
        SHELL_CONFIG="$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
        SHELL_CONFIG="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
        SHELL_CONFIG="$HOME/.bash_profile"
    fi

    if [ -n "$SHELL_CONFIG" ]; then
        if ! grep -q "CONFLUENCE_URL" "$SHELL_CONFIG"; then
            echo "   Adding Confluence env vars to $SHELL_CONFIG..."
            cat >> "$SHELL_CONFIG" << 'ENVEOF'

# MCP Confluence Server Configuration
# TODO: Update these values with your actual Confluence credentials
export CONFLUENCE_URL="https://yourcompany.atlassian.net"
export CONFLUENCE_EMAIL="your.email@company.com"
export CONFLUENCE_API_TOKEN="your_api_token_here"
ENVEOF
            echo "✅ Environment variables added to $SHELL_CONFIG"
            echo "   ⚠️  IMPORTANT: Edit $SHELL_CONFIG and update the values!"
        else
            echo "✅ Confluence env vars already in $SHELL_CONFIG"
        fi
    fi
else
    echo "✅ Confluence environment variables are set"
fi

echo ""

# Step 4: Generate Rider MCP Configuration
echo "📋 Step 4: Generating Rider MCP Configuration"
echo "============================================="
echo ""

if [ $ERRORS -gt 0 ]; then
    echo "❌ Cannot generate configuration due to errors above"
    echo "   Please fix the errors and run this script again"
    exit 1
fi

CONFIG_FILE="$SCRIPT_DIR/rider-mcp-config.json"

cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "jira": {
      "command": "$SCRIPT_DIR/jira-mcp-server/venv/bin/python",
      "args": ["$SCRIPT_DIR/jira-mcp-server/server.py"]
    },
    "confluence": {
      "command": "$SCRIPT_DIR/confluence-mcp-server/venv/bin/python",
      "args": ["$SCRIPT_DIR/confluence-mcp-server/server.py"]
    },
    "azure-devops": {
      "command": "$SCRIPT_DIR/azure-mcp-server/venv/bin/python",
      "args": ["$SCRIPT_DIR/azure-mcp-server/server.py"]
    }
  }
}
EOF

echo "✅ Configuration file generated: $CONFIG_FILE"
echo ""
echo "📋 Configuration content:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$CONFIG_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 5: Instructions for Rider
echo "📋 Step 5: Configure MCP in JetBrains Rider"
echo "==========================================="
echo ""
echo "🔍 ACTION REQUIRED - Follow these steps IN RIDER:"
echo ""
echo "1. Open JetBrains Rider"
echo ""
echo "2. Click the GitHub Copilot icon (bottom right corner)"
echo ""
echo "3. Select 'Open Chat'"
echo ""
echo "4. Make sure you're in AGENT MODE (not regular chat)"
echo "   - Look for 'Agent' toggle or mode switcher"
echo ""
echo "5. Click the TOOLS ICON at the bottom of the chat window"
echo "   - This is labeled 'Configure your MCP server'"
echo ""
echo "6. Click 'Add MCP Tools'"
echo "   - This will open mcp.json file"
echo ""
echo "7. Paste the configuration from: $CONFIG_FILE"
echo "   - Or copy it from the output above"
echo ""
echo "8. Save the mcp.json file"
echo ""
echo "9. RESTART Rider completely"
echo ""
echo "💡 TIP: Copy the config to clipboard with:"
if command -v pbcopy &> /dev/null; then
    echo "   cat $CONFIG_FILE | pbcopy"
elif command -v xclip &> /dev/null; then
    echo "   cat $CONFIG_FILE | xclip -selection clipboard"
fi
echo ""

read -p "Press ENTER when you've configured Rider and restarted it..."
echo ""

# Step 6: Final verification
echo "📋 Step 6: Verification"
echo "======================"
echo ""
echo "After restarting Rider:"
echo "  ✅ The spinning loading icon should be gone"
echo "  ✅ You should see your MCP servers listed"
echo "  ✅ You should be able to use tools like jira_get_story, etc."
echo ""
echo "If you still see a spinning icon:"
echo "  1. Check Rider logs: Help → Show Log in Finder/Explorer"
echo "  2. Look for MCP-related errors in idea.log or copilot.log"
echo "  3. Run ./diagnose.sh to check for other issues"
echo "  4. See TROUBLESHOOTING.md for more help"
echo ""
echo "✨ Configuration complete!"
echo ""
echo "📖 For more information:"
echo "   - Run: ./diagnose.sh (to check system status)"
echo "   - Read: TROUBLESHOOTING.md (for detailed help)"
echo "   - Issue: https://github.com/microsoft/copilot-intellij-feedback/issues/636"
echo ""
