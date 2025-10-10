# MCP Servers Troubleshooting Guide

This guide helps you fix the "spinning loading icon" and other common issues with the MCP servers in JetBrains Rider.

## Quick Diagnostic

**On the computer with the issue**, run the diagnostic script:

```bash
cd /path/to/github-copilot
./diagnose.sh
```

This will check:
- Python version (must be 3.10+)
- Virtual environments
- Dependencies installation
- File permissions
- Environment variables
- CLI tools (acli, az)

## Common Issues and Fixes

### Issue 1: Spinning Loading Icon (Most Common)

**Symptoms:** The GitHub Copilot MCP configuration page shows a spinning icon and servers never load.

**⚠️ Known Bug:** This is a known issue in the GitHub Copilot plugin for JetBrains IDEs. See [microsoft/copilot-intellij-feedback#636](https://github.com/microsoft/copilot-intellij-feedback/issues/636)

**🚀 Automated Fix (Recommended):**

Run the automated fix script that does everything for you:
```bash
./fix-mcp.sh
```

This script will:
1. ✅ Open GitHub settings for you to enable MCP
2. ✅ Check and create virtual environments if needed
3. ✅ Set up Confluence environment variables
4. ✅ Generate the correct Rider configuration file
5. ✅ Provide step-by-step instructions for Rider
6. ✅ Verify everything is set up correctly

**Manual Quick Fix:**

If you prefer to do it manually:

1. **Check Prerequisites:**
   - GitHub Copilot plugin v1.5.57+ installed in Rider
   - Valid Copilot license
   - If using Copilot Business/Enterprise: Org admin must enable "MCP servers in Copilot" policy

2. **Configure MCP in Rider (NOT on GitHub's website):**
   - Click GitHub Copilot icon (bottom right) → Open Chat
   - Switch to **Agent mode** (important!)
   - Click tools icon at bottom → "Configure your MCP server"
   - Click "Add MCP Tools" to open mcp.json
   - Add your server configuration
   - Save and restart Rider

3. **Check MCP logs in Rider:**
   - Help → Show Log in Finder (macOS) or Show Log in Explorer (Windows)
   - Look for MCP-related errors in idea.log or copilot.log
   - Common errors: server configuration issues, authentication problems

If that doesn't work, check these common causes:

**Common Causes:**

#### 1a. Python Version Too Old

The system Python is 3.9 or older, but MCP requires Python 3.10+.

**Check:**
```bash
python3 --version
```

**Fix:**
```bash
# Install Python 3.12 via Homebrew
brew install python@3.12

# Recreate virtual environments with Python 3.12
cd jira-mcp-server
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Repeat for confluence-mcp-server and azure-mcp-server
```

#### 1b. Virtual Environments Not Created

The `venv/` directories don't exist in the server folders.

**Check:**
```bash
ls -la */venv
```

**Fix:**
```bash
# Run the setup script
./setup.sh

# OR manually create each venv
cd jira-mcp-server
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
# Repeat for other servers
```

#### 1c. Dependencies Not Installed

The `mcp` package is missing from the virtual environment.

**Check:**
```bash
./jira-mcp-server/venv/bin/python -c "import mcp"
```

**Fix:**
```bash
cd jira-mcp-server
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
# Repeat for other servers
```

#### 1d. Wrong Python Path in Rider Configuration

The `command` in Rider's MCP config points to the wrong Python or doesn't use the venv.

**Check your Rider configuration:**
```json
{
  "mcpServers": {
    "jira": {
      "command": "/FULL/PATH/jira-mcp-server/venv/bin/python",
      "args": ["/FULL/PATH/jira-mcp-server/server.py"]
    }
  }
}
```

**Fix:**
- Use **absolute paths**, not relative paths
- Point to `venv/bin/python`, not system `python3`
- Run `./diagnose.sh` to see the correct paths
- After changing, **restart Rider**

#### 1e. Server Import Errors

The Python server has import errors or syntax errors.

**Check:**
```bash
cd jira-mcp-server
./venv/bin/python server.py
# Should show: "Jira MCP Server running on stdio"
# Press Ctrl+C to stop
```

**Fix:**
- If you see import errors, reinstall dependencies
- If you see syntax errors, the code may be corrupted - re-pull from git

### Issue 2: Confluence Server Not Working

**Symptoms:** Jira and Azure servers work, but Confluence doesn't.

**Cause:** Environment variables not set.

**Check:**
```bash
echo $CONFLUENCE_URL
echo $CONFLUENCE_EMAIL
echo $CONFLUENCE_API_TOKEN
```

**Fix:**

Option 1 - Add to shell config (done by setup.sh):
```bash
# Edit ~/.zshrc (or ~/.bashrc)
nano ~/.zshrc

# Add these lines:
export CONFLUENCE_URL="https://yourcompany.atlassian.net"
export CONFLUENCE_EMAIL="your.email@company.com"
export CONFLUENCE_API_TOKEN="your_api_token_here"

# Save and reload
source ~/.zshrc
```

Option 2 - Add to Rider config:
```json
{
  "mcpServers": {
    "confluence": {
      "command": "/path/to/confluence-mcp-server/venv/bin/python",
      "args": ["/path/to/confluence-mcp-server/server.py"],
      "env": {
        "CONFLUENCE_URL": "https://yourcompany.atlassian.net",
        "CONFLUENCE_EMAIL": "your.email@company.com",
        "CONFLUENCE_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

### Issue 3: "externally-managed-environment" Error

**Symptoms:** When running `pip install`, you see:
```
error: externally-managed-environment
```

**Cause:** Modern macOS/Linux protects the system Python.

**Fix:**
Use virtual environments (this is why the setup uses venv):
```bash
# Don't do this:
pip3 install mcp  # ❌ Won't work

# Do this instead:
cd jira-mcp-server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # ✅ Works
deactivate
```

### Issue 4: Servers Load but Don't Respond

**Symptoms:** Loading icon disappears, but tools don't work.

**Cause:** CLI tools (acli or az) not installed or not authenticated.

**Fix for Jira:**
```bash
# Check if acli is installed
acli --version

# If not installed, get it from:
# https://bobswift.atlassian.net/wiki/spaces/ACLI/overview

# Test acli connection
acli jira --action getServerInfo
```

**Fix for Azure DevOps:**
```bash
# Check if Azure CLI is installed
az --version

# Install if needed
brew install azure-cli

# Install Azure DevOps extension
az extension add --name azure-devops

# Login
az login
```

### Issue 5: Permission Denied Errors

**Symptoms:** Server won't start, permission errors in logs.

**Cause:** File permissions are incorrect.

**Fix:**
```bash
# Make server.py readable
chmod +r */server.py

# Make venv executables executable
chmod +x */venv/bin/*
```

### Issue 6: Rider Can't Find the Servers

**Symptoms:** Rider says "Failed to start MCP server" or "Command not found"

**Cause:** Paths in Rider configuration are wrong.

**Fix:**
1. Run `./diagnose.sh` to see the correct paths
2. Copy the exact paths it shows
3. In Rider, use **absolute paths** (starting with `/`)
4. Don't use `~` or `$HOME` - use the full path like `/Users/yourname/...`
5. Restart Rider after changing configuration

## Step-by-Step Reset (Nuclear Option)

If nothing else works, start from scratch:

```bash
cd /path/to/github-copilot

# 1. Remove old virtual environments
rm -rf */venv

# 2. Pull latest code
git pull origin main

# 3. Run setup script
./setup.sh

# 4. Run diagnostic
./diagnose.sh

# 5. Copy the paths from diagnostic output

# 6. Update Rider configuration with those exact paths

# 7. Restart Rider
```

## Checking Rider Logs for MCP Errors

The Copilot plugin doesn't show error messages in the UI (just a spinner), but logs contain the real errors:

**macOS:**
```bash
# Open logs folder
open ~/Library/Logs/JetBrains/Rider*/

# Or from Rider: Help → Show Log in Finder
```

**Windows:**
```bash
# From Rider: Help → Show Log in Explorer
```

**Linux:**
```bash
# Open logs folder
cd ~/.cache/JetBrains/Rider*/log/
```

**Look for files like:**
- `idea.log` - Main IDE log
- `copilot.log` - Copilot-specific errors

**Common error messages:**
- `Failed to start MCP server` - Check Python paths
- `Command not found` - Use absolute paths in config
- `Permission denied` - Check file permissions with `./diagnose.sh`
- `Import error` - Dependencies not installed in venv
- `Python version` - System Python too old

## Getting Help

If you're still stuck:

1. **Check GitHub Copilot settings:** https://github.com/settings/copilot/features (enable MCP)
2. Run `./diagnose.sh` and save the output
3. Check the Rider logs (see above) for MCP-related errors
4. Try running the server manually to see errors:
   ```bash
   cd jira-mcp-server
   ./venv/bin/python server.py
   ```
5. Check that you're using the right Python:
   ```bash
   ./venv/bin/python --version  # Should be 3.10+
   ```
6. Report issues at [microsoft/copilot-intellij-feedback](https://github.com/microsoft/copilot-intellij-feedback/issues)

## Quick Checklist

Before asking for help, verify:

- [ ] Python 3.10+ is installed (`python3 --version` or `python3.12 --version`)
- [ ] Virtual environments exist (`ls */venv`)
- [ ] Dependencies are installed (`./*/venv/bin/python -c "import mcp"`)
- [ ] Servers can import (`cd jira-mcp-server && ./venv/bin/python -c "import server"`)
- [ ] Rider config uses absolute paths to `venv/bin/python`
- [ ] Rider has been restarted after config changes
- [ ] For Confluence: environment variables are set
- [ ] For Jira: acli is installed and configured
- [ ] For Azure: az CLI is installed and authenticated

Run `./diagnose.sh` - it checks all of the above automatically!
