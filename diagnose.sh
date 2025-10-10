#!/bin/bash

echo "🔍 MCP Servers Diagnostic Script"
echo "=================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ERRORS=0
WARNINGS=0

# Function to check status
check_status() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        ERRORS=$((ERRORS + 1))
    fi
}

warn() {
    echo "⚠️  $1"
    WARNINGS=$((WARNINGS + 1))
}

echo "1. Checking Python version..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    echo "   Found: Python $PYTHON_VERSION"

    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

    if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 10 ]; then
        check_status 0 "Python version is 3.10 or higher"
    else
        check_status 1 "Python version must be 3.10+, found $PYTHON_VERSION"
        echo "   Install Python 3.12: brew install python@3.12"
    fi
else
    check_status 1 "Python 3 not found"
fi

# Check for Python 3.12 specifically
echo ""
echo "2. Checking for Python 3.12 (recommended)..."
if command -v python3.12 &> /dev/null; then
    check_status 0 "Python 3.12 found: $(python3.12 --version)"
else
    warn "Python 3.12 not found (install with: brew install python@3.12)"
fi

echo ""
echo "3. Checking virtual environments..."

for server in jira-mcp-server confluence-mcp-server azure-mcp-server; do
    echo "   Checking $server..."

    if [ -d "$server/venv" ]; then
        echo "      ✅ venv directory exists"

        # Check if venv has Python
        if [ -f "$server/venv/bin/python" ]; then
            VENV_PYTHON_VERSION=$("$server/venv/bin/python" --version 2>&1)
            echo "      ✅ venv Python: $VENV_PYTHON_VERSION"

            # Check if mcp is installed
            if "$server/venv/bin/python" -c "import mcp" 2>/dev/null; then
                echo "      ✅ mcp package installed"
            else
                echo "      ❌ mcp package NOT installed"
                ERRORS=$((ERRORS + 1))
                echo "         Fix: cd $server && source venv/bin/activate && pip install -r requirements.txt"
            fi

            # Check if server.py can be imported
            if [ -f "$server/server.py" ]; then
                cd "$server"
                if ./venv/bin/python -c "import server" 2>/dev/null; then
                    echo "      ✅ server.py imports successfully"
                else
                    echo "      ❌ server.py has import errors"
                    ERRORS=$((ERRORS + 1))
                    echo "         Run: cd $server && ./venv/bin/python server.py"
                fi
                cd "$SCRIPT_DIR"
            else
                echo "      ❌ server.py not found"
                ERRORS=$((ERRORS + 1))
            fi
        else
            echo "      ❌ venv/bin/python not found"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo "      ❌ venv directory NOT found"
        ERRORS=$((ERRORS + 1))
        echo "         Fix: cd $server && python3.12 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    fi
    echo ""
done

echo "4. Checking file permissions..."
for server in jira-mcp-server confluence-mcp-server azure-mcp-server; do
    if [ -f "$server/server.py" ]; then
        if [ -r "$server/server.py" ]; then
            echo "   ✅ $server/server.py is readable"
        else
            echo "   ❌ $server/server.py is NOT readable"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done

echo ""
echo "5. Checking Confluence environment variables..."
if [ -n "$CONFLUENCE_URL" ]; then
    check_status 0 "CONFLUENCE_URL is set: $CONFLUENCE_URL"
else
    warn "CONFLUENCE_URL not set (required for Confluence server)"
    echo "   Add to ~/.zshrc: export CONFLUENCE_URL=\"https://yourcompany.atlassian.net\""
fi

if [ -n "$CONFLUENCE_EMAIL" ]; then
    check_status 0 "CONFLUENCE_EMAIL is set"
else
    warn "CONFLUENCE_EMAIL not set (required for Confluence server)"
fi

if [ -n "$CONFLUENCE_API_TOKEN" ]; then
    check_status 0 "CONFLUENCE_API_TOKEN is set"
else
    warn "CONFLUENCE_API_TOKEN not set (required for Confluence server)"
fi

echo ""
echo "6. Checking prerequisite CLIs..."
if command -v acli &> /dev/null; then
    check_status 0 "acli installed (for Jira)"
else
    warn "acli not found (required for Jira server)"
    echo "   Install from: https://bobswift.atlassian.net/wiki/spaces/ACLI/overview"
fi

if command -v az &> /dev/null; then
    check_status 0 "Azure CLI installed"

    if az extension list 2>/dev/null | grep -q "azure-devops"; then
        check_status 0 "Azure DevOps extension installed"
    else
        warn "Azure DevOps extension not found"
        echo "   Install: az extension add --name azure-devops"
    fi
else
    warn "Azure CLI not found (required for Azure DevOps server)"
    echo "   Install from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli"
fi

echo ""
echo "=================================="
echo "📊 Diagnostic Summary"
echo "=================================="
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🎉 All checks passed! Your MCP servers should work."
    echo ""
    echo "📝 Next steps:"
    echo "1. Configure JetBrains Rider with these paths:"
    echo ""
    echo "   Jira:       $SCRIPT_DIR/jira-mcp-server/venv/bin/python"
    echo "   Confluence: $SCRIPT_DIR/confluence-mcp-server/venv/bin/python"
    echo "   Azure:      $SCRIPT_DIR/azure-mcp-server/venv/bin/python"
    echo ""
    echo "2. Restart JetBrains Rider"
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Setup is functional but has warnings."
    echo "   Review the warnings above and fix them for full functionality."
else
    echo "❌ Setup has errors that need to be fixed."
    echo "   Review the errors above and run ./setup.sh to fix most issues."
    echo ""
    echo "Quick fixes:"
    echo "  - Run: ./setup.sh (to set up everything)"
    echo "  - Or manually create venvs with: python3.12 -m venv venv"
fi

echo ""
