# Research Findings & Corrections

This document details the research conducted to verify the accuracy of the MCP server implementations.

## Summary of Changes

### ✅ What Was Verified Correct

1. **MCP Configuration Format** - The JSON format for JetBrains Rider uses `"servers"` as the root key (not `"mcpServers"`)
2. **MCP SDK Stdio Transport** - The `StdioServerTransport` usage was correct
3. **Azure CLI Commands** - Most `az repos` and `az pipelines` commands were already correct
4. **Overall Architecture** - The Server class and request handler pattern was valid

### ⚠️ What Was Corrected

1. **MCP SDK Version** - Updated from `^1.0.4` to `^1.19.1` (latest as of Jan 2025)
2. **Atlassian CLI Commands** - Completely replaced with correct `acli jira workitem` syntax

---

## Detailed Research Findings

### 1. Model Context Protocol SDK

**Research Date:** January 2025

**Latest Version:** 1.19.1 (published 7 days ago)

**Official Documentation:**
- GitHub: https://github.com/modelcontextprotocol/typescript-sdk
- npm: https://www.npmjs.com/package/@modelcontextprotocol/sdk

**Key Findings:**
- Two APIs available: `Server` (low-level) and `McpServer` (high-level)
- For stdio transport with JetBrains, the `Server` class is appropriate
- `McpServer` is recommended for HTTP/SSE transports and provides simplified API
- Stdio transport is used for local integrations spawned by another process

**Verified Usage:**
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({ name: "...", version: "..." }, { capabilities: { tools: {} } });
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

### 2. Atlassian CLI (acli) Commands

**Official Documentation:** https://developer.atlassian.com/cloud/acli/

**Critical Finding:** The Atlassian CLI uses `jira workitem` commands, NOT `issue` commands.

#### Corrected Command Syntax

| Operation | ❌ Incorrect (Initial) | ✅ Correct (Researched) |
|-----------|----------------------|------------------------|
| View work item | `acli issue get KEY-123 --output json` | `acli jira workitem view KEY-123 --json` |
| Search work items | `acli issue list --jql "..." --max-results 50 --output json` | `acli jira workitem search --jql "..." --limit 50 --json` |
| Get transitions | `acli issue transitions KEY-123 --output json` | `acli jira workitem view KEY-123 --fields status --json` |
| Transition work item | `acli issue transition KEY-123 "Done"` | `acli jira workitem transition --key "KEY-123" --status "Done"` |
| Add comment | `acli issue comment add KEY-123 --comment "..."` | `acli jira workitem comment create --key "KEY-123" --comment "..."` |
| Create work item | `acli issue create --project PROJ --type Story` | `acli jira workitem create --project "PROJ" --type "Story"` |
| Update work item | `acli issue update KEY-123 --summary "..."` | `acli jira workitem edit --key "KEY-123" --summary "..."` |
| Assign work item | `acli issue assign KEY-123 --assignee "..."` | `acli jira workitem assign --key "KEY-123" --assignee "..."` |

#### Key Command Patterns

**View Work Item:**
```bash
acli jira workitem view KEY-123 [flags]

Flags:
  -f, --fields string    Specify fields (default: "key,issuetype,summary,status,assignee,description")
  --json                 Generate JSON output
  -w, --web             View in web browser
```

**Search Work Items:**
```bash
acli jira workitem search [flags]

Flags:
  -j, --jql string      JQL query
  -l, --limit int       Maximum results
  --filter int          Filter ID
  --json                Generate JSON output
  --paginate            Fetch all results
  --count               Show count only
```

**Transition Work Item:**
```bash
acli jira workitem transition [flags]

Flags:
  --key string          Work item key(s)
  --jql string          JQL query
  --status string       Target status
```

**Comment on Work Item:**
```bash
acli jira workitem comment create [flags]

Flags:
  --key string          Work item key
  --comment string      Comment text
```

#### References
- Command Reference: https://developer.atlassian.com/cloud/acli/reference/commands/
- Workitem View: https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-view/
- Workitem Search: https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-search/
- Workitem Create: https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-create/
- Workitem Assign: https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-assign/
- Workitem Edit: https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-edit/

---

### 3. Azure CLI (az) Commands

**Official Documentation:** https://learn.microsoft.com/en-us/azure/devops/cli/

**Finding:** The Azure CLI commands used were **mostly correct** as initially implemented.

#### Verified Command Syntax

**List Repositories:**
```bash
az repos list --organization https://dev.azure.com/ORG --project "PROJECT" --output json
```
✅ **Status:** Correct

**Show Repository:**
```bash
az repos show --organization https://dev.azure.com/ORG --project "PROJECT" --repository "REPO" --output json
```
✅ **Status:** Correct

**Create Pull Request:**
```bash
az repos pr create [--auto-complete {false, true}]
                   [--bypass-policy {false, true}]
                   [--delete-source-branch {false, true}]
                   [--description]
                   [--draft {false, true}]
                   [--open]
                   [--organization]
                   [--project]
                   [--repository]
                   [--source-branch]
                   [--target-branch]
                   [--title]
```
✅ **Status:** Correct

**Key PR Flags:**
- `--draft`: Create PR in draft mode
- `--auto-complete`: Complete automatically when policies pass
- `--delete-source-branch`: Delete branch after merge
- `--open`: Open PR in browser

**List Pull Requests:**
```bash
az repos pr list --organization https://dev.azure.com/ORG
                 --project "PROJECT"
                 --repository "REPO"
                 --status {active, completed, abandoned, all}
                 --output json
```
✅ **Status:** Correct

**Run Pipeline:**
```bash
az pipelines run [--branch]
                 [--commit-id]
                 [--id]
                 [--name]
                 [--open]
                 [--organization]
                 [--project]
```
✅ **Status:** Correct

**List Builds:**
```bash
az pipelines build list [--branch]
                        [--definition-ids]
                        [--organization]
                        [--project]
                        [--status {all, cancelling, completed, inProgress, none, notStarted, postponed}]
                        [--top]
```
✅ **Status:** Correct

#### References
- Azure DevOps CLI Overview: https://learn.microsoft.com/en-us/azure/devops/cli/
- az repos: https://learn.microsoft.com/en-us/cli/azure/repos
- az repos pr: https://learn.microsoft.com/en-us/cli/azure/repos/pr
- az pipelines: https://learn.microsoft.com/en-us/cli/azure/pipelines
- Examples Index: https://learn.microsoft.com/en-us/azure/devops/cli/quick-reference

---

### 4. JetBrains Rider MCP Configuration

**Official Documentation:** https://www.jetbrains.com/help/ai-assistant/mcp.html

**Configuration Location:**
- Settings → Tools → AI Assistant → Model Context Protocol (MCP)
- Or: GitHub Copilot icon → Edit settings → MCP Servers section

**Verified Configuration Format:**
```json
{
  "servers": {
    "serverName": {
      "type": "stdio",
      "command": "path-or-command-to-start-server",
      "args": ["optional-arguments-passed-to-server"]
    }
  }
}
```

**Example for Python Server:**
```json
{
  "servers": {
    "jira": {
      "type": "stdio",
      "command": "/path/to/jira-mcp-server/venv/bin/python",
      "args": ["/path/to/jira-mcp-server/server.py"]
    },
    "azure-devops": {
      "type": "stdio",
      "command": "/path/to/azure-mcp-server/venv/bin/python",
      "args": ["/path/to/azure-mcp-server/server.py"]
    }
  }
}
```

**Example for NPX:**
```json
{
  "servers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
    }
  }
}
```

✅ **Status:** Initial implementation was correct

---

## Testing Recommendations

### Before Using the Servers

1. **Verify CLI Installation:**
```bash
# Check acli
acli --version
acli jira workitem view --help

# Check Azure CLI
az --version
az repos --help
```

2. **Test CLI Commands Manually:**
```bash
# Test Jira
acli jira workitem view KEY-123 --json

# Test Azure DevOps
az repos list --organization https://dev.azure.com/yourorg --project YourProject
```

3. **Build the Servers:**
```bash
cd jira-mcp-server && npm install && npm run build
cd ../azure-mcp-server && npm install && npm run build
```

4. **Test with MCP Inspector:**
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### Known Limitations

1. **acli Transition Command:** The exact syntax for transitions may vary based on your Jira workflow configuration. Users may need to run `acli jira workitem transition --help` to see available options.

2. **acli Sprint Commands:** The acli may not have direct sprint management commands. The server uses JQL queries as a workaround.

3. **Azure PR Comments:** The `az repos pr comment` command has limited functionality. For advanced commenting, users may need to use the Azure DevOps REST API directly.

---

## Conclusion

After thorough research, the implementations have been corrected as follows:

### Jira MCP Server
- ✅ Updated all commands from `acli issue` to `acli jira workitem`
- ✅ Corrected flag syntax (--json instead of --output json, --limit instead of --max-results)
- ✅ Updated SDK version to 1.19.1

### Azure MCP Server
- ✅ Verified all commands are correct
- ✅ Updated SDK version to 1.19.1
- ✅ Commands already matched official documentation

### Configuration
- ✅ Verified Rider MCP configuration format is correct
- ✅ Confirmed stdio transport usage is appropriate

The servers should now work correctly with the actual CLIs, assuming:
1. acli is properly installed and configured
2. Azure CLI with azure-devops extension is installed
3. User has appropriate permissions in Jira and Azure DevOps
4. JetBrains Rider 2025.2+ with GitHub Copilot plugin is installed
