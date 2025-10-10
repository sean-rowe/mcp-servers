# Quick Start Guide

Get up and running in 5 minutes!

## Installation

```bash
# Run the setup script
./setup.sh
```

## Configuration

### Option 1: Automatic Configuration (Recommended)

The setup script will print the exact configuration you need. Copy it and:

1. Open JetBrains Rider
2. Click the **GitHub Copilot icon** (top right)
3. Select **Edit settings**
4. Scroll to **MCP Servers** section
5. Paste the configuration
6. Click **Save**
7. Restart Rider

### Option 2: Manual Configuration

Create or edit your MCP configuration file:

**Location:** Settings → Tools → AI Assistant → Model Context Protocol (MCP)

**Configuration:**
```json
{
  "servers": {
    "jira": {
      "command": "/full/path/to/jira-mcp-server/venv/bin/python",
      "args": ["/full/path/to/jira-mcp-server/server.py"]
    },
    "azure-devops": {
      "command": "/full/path/to/azure-mcp-server/venv/bin/python",
      "args": ["/full/path/to/azure-mcp-server/server.py"]
    }
  }
}
```

Replace `/full/path/to/` with the actual path where you cloned this repository.

## First Steps

### Test Jira Integration

Open GitHub Copilot Chat in Rider and try:

```
Show me all my Jira issues that are in progress
```

or

```
Get details for story PROJ-123
```

### Test Azure DevOps Integration

```
List all repositories in MyProject in myorg organization
```

or

```
Show me my active pull requests in MyRepo
```

## Common Tasks

### Morning Workflow
```
1. List my Jira issues in "In Progress"
2. Show my active PRs
3. Get current sprint information
```

### Start Working on Story
```
1. Get details for PROJ-456
2. Transition PROJ-456 to "In Progress"
3. Get clone URL for the repository
```

### Create Pull Request
```
1. Create a PR from feature/my-feature to main with title "Add feature"
2. Add reviewers john@company.com, jane@company.com
3. Add comment to PROJ-456: "PR created: link"
```

### Complete Story
```
1. Get PR details for PR #42
2. Approve PR #42
3. Complete PR #42 and delete source branch
4. Transition PROJ-456 to "Done"
```

## Troubleshooting

### MCP Servers Not Showing Up

**Check 1:** Are the paths correct?
```bash
# Verify files exist
ls -la /path/to/jira-mcp-server/dist/index.js
ls -la /path/to/azure-mcp-server/dist/index.js
```

**Check 2:** Are the servers built?
```bash
cd jira-mcp-server && npm run build
cd ../azure-mcp-server && npm run build
```

**Check 3:** Restart Rider
After any configuration changes, restart JetBrains Rider.

**Check 4:** View Logs
Check Rider's logs for MCP-related errors:
- macOS: `~/Library/Logs/JetBrains/Rider[VERSION]/idea.log`
- Windows: `%USERPROFILE%\AppData\Local\JetBrains\Rider[VERSION]\log\idea.log`
- Linux: `~/.cache/JetBrains/Rider[VERSION]/log/idea.log`

### Jira Not Working

```bash
# Test acli
acli --version

# Test Jira connection
acli jira --action getServerInfo

# Reconfigure if needed
acli jira --server "https://yourcompany.atlassian.net" --user "email@company.com" --password "your-api-token"
```

### Azure DevOps Not Working

```bash
# Test Azure CLI
az --version

# Check extension
az extension list | grep azure-devops

# Install extension if missing
az extension add --name azure-devops

# Login
az login

# Set defaults (optional but helpful)
az devops configure --defaults organization=https://dev.azure.com/yourorg project=YourProject
```

## Pro Tips

### 1. Set Azure Defaults

Save typing by setting defaults:
```bash
az devops configure --defaults \
  organization=https://dev.azure.com/yourorg \
  project=YourProject
```

Then you can omit these parameters in your requests.

### 2. Use JQL Shortcuts

Create aliases for common Jira queries:
- "my issues" → `assignee = currentUser() AND status != Done`
- "sprint issues" → `sprint in openSprints() AND assignee = currentUser()`
- "bugs" → `type = Bug AND status = Open`

### 3. Chain Commands

You can ask Copilot to do multiple things in sequence:
```
Get details for PROJ-123, then transition it to "In Progress",
then create a feature branch called feature/proj-123
```

### 4. Use Natural Language

You don't need to know the exact tool names. Just describe what you want:
```
"Show me what my team is working on in the current sprint"
"Create a PR for my changes"
"What's the status of that bug I was assigned yesterday?"
```

## Next Steps

- Read the full [README.md](README.md) for all available tools
- Check individual server READMEs for detailed tool documentation:
  - [Jira MCP Server](jira-mcp-server/README.md)
  - [Azure DevOps MCP Server](azure-mcp-server/README.md)
- Customize the servers by adding your own tools

## Getting Help

If you run into issues:

1. Check the troubleshooting section above
2. Verify prerequisites are installed correctly
3. Check the logs in Rider
4. Test the CLI tools directly (acli, az)
5. Ensure you have proper permissions in Jira/Azure DevOps

Happy coding! 🚀
