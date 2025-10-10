#!/bin/bash

echo "🔧 MCP Configuration Installer"
echo "================================"
echo ""
echo "This script bypasses the spinning UI by creating the MCP configuration"
echo "file directly on disk."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Step 1: Check if virtual environments exist
echo "📋 Step 1: Checking Virtual Environments"
echo "========================================="
echo ""

MISSING_VENV=0
for server in jira-mcp-server confluence-mcp-server azure-mcp-server; do
    if [ ! -d "$server/venv" ]; then
        echo "❌ $server/venv not found"
        MISSING_VENV=1
    else
        echo "✅ $server/venv exists"
    fi
done

if [ $MISSING_VENV -eq 1 ]; then
    echo ""
    echo "⚠️  Virtual environments are missing. Run ./setup.sh first:"
    echo "   ./setup.sh"
    exit 1
fi

echo ""

# Step 2: Create .vscode directory
echo "📋 Step 2: Creating .vscode Directory"
echo "======================================"
echo ""

mkdir -p "$SCRIPT_DIR/.vscode"
echo "✅ Created $SCRIPT_DIR/.vscode/"
echo ""

# Step 3: Create mcp.json configuration
echo "📋 Step 3: Creating MCP Configuration"
echo "====================================="
echo ""

MCP_CONFIG="$SCRIPT_DIR/.vscode/mcp.json"

cat > "$MCP_CONFIG" << EOF
{
  "servers": {
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

echo "✅ Created MCP configuration file:"
echo "   $MCP_CONFIG"
echo ""
echo "📄 Configuration content:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$MCP_CONFIG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 4: Instructions
echo "📋 Step 4: Next Steps"
echo "====================="
echo ""
echo "✅ MCP configuration has been installed!"
echo ""
echo "The configuration file has been created at:"
echo "   $MCP_CONFIG"
echo ""
echo "This bypasses the Rider UI completely. JetBrains Copilot plugin will"
echo "automatically detect and use this file."
echo ""
echo "🔍 IMPORTANT NEXT STEPS:"
echo ""
echo "1. Make sure you're using this project directory in Rider"
echo "   (the directory containing .vscode/mcp.json)"
echo ""
echo "2. COMPLETELY RESTART JetBrains Rider"
echo "   - Don't just reload - do a full quit and restart"
echo ""
echo "3. After restart, the spinning icon should be GONE"
echo ""
echo "4. Open GitHub Copilot chat and switch to Agent mode"
echo ""
echo "5. Your MCP tools should now be available:"
echo "   - jira_get_story"
echo "   - jira_list_stories"
echo "   - confluence_search"
echo "   - azure_list_repos"
echo "   - etc."
echo ""
echo "📖 If it still doesn't work:"
echo ""
echo "1. Check Rider logs: Help → Show Log in Finder/Explorer"
echo "   Look for errors mentioning mcp.json or MCP servers"
echo ""
echo "2. Verify prerequisites:"
echo "   - GitHub Copilot plugin v1.5.57+ installed"
echo "   - Valid Copilot license"
echo "   - For orgs: Admin enabled 'MCP servers in Copilot' policy"
echo ""
echo "3. Run diagnostics:"
echo "   ./diagnose.sh"
echo ""
echo "4. Check TROUBLESHOOTING.md for more help"
echo ""
