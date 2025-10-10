# Verified Command Syntax

All commands below have been **verified from official Atlassian CLI documentation** at https://developer.atlassian.com/cloud/acli/

## Jira Commands - VERIFIED ✅

### 1. View Work Item
**Command:**
```bash
acli jira workitem view [key] [flags]
```

**Documentation:** https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-view/

**Flags:**
- `-f, --fields string` - Specify fields (default: "key,issuetype,summary,status,assignee,description")
- `--json` - Generate JSON output
- `-w, --web` - View in web browser

**Examples:**
```bash
acli jira workitem view KEY-123
acli jira workitem view KEY-123 --json
acli jira workitem view KEY-123 --fields summary,comment
```

**Key Finding:** Uses **positional argument** for the key, NOT `--key` flag!

---

### 2. Search Work Items
**Command:**
```bash
acli jira workitem search [flags]
```

**Documentation:** https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-search/

**Flags:**
- `-j, --jql string` - JQL query
- `-l, --limit int` - Maximum number of results
- `-f, --fields string` - Fields to display (default: "issuetype,key,assignee,priority,status,summary")
- `--json` - Generate JSON output
- `--filter string` - Filter ID
- `--paginate` - Fetch all results
- `--count` - Show count only
- `--csv` - Generate CSV output

**Examples:**
```bash
acli jira workitem search --jql "project = TEAM" --paginate
acli jira workitem search --jql "project = TEAM" --limit 50 --json
acli jira workitem search --filter 10001 --web
```

---

### 3. Transition Work Item
**Command:**
```bash
acli jira workitem transition [flags]
```

**Documentation:** https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-transition/

**Flags:**
- `-k, --key string` - Work item keys to transition
- `-s, --status string` - Target status
- `--jql string` - JQL query for work items
- `--filter string` - Filter ID
- `--json` - Generate JSON output
- `-y, --yes` - Confirm without prompting
- `--ignore-errors` - Continue on errors

**Examples:**
```bash
acli jira workitem transition --key "KEY-1,KEY-2" --status "Done"
acli jira workitem transition --jql "project = TEAM" --status "In Progress"
acli jira workitem transition --filter 10001 --status "To Do" --yes
```

---

### 4. Create Comment
**Command:**
```bash
acli jira workitem comment create [flags]
```

**Documentation:** https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-comment-create/

**Flags:**
- `-k, --key string` - Work item keys to comment on
- `-b, --body string` - Comment body (plain text or ADF)
- `-F, --body-file string` - Read body from file
- `--jql string` - JQL query for work items
- `--filter string` - Filter ID
- `--json` - Generate JSON output
- `--editor` - Open text editor for body
- `-e, --edit-last` - Edit last comment from same author
- `--ignore-errors` - Continue on errors

**Examples:**
```bash
acli jira workitem comment create --key "KEY-1" --body "This is a comment"
acli jira workitem comment create --jql "project = TEAM" --body-file "comment.txt"
acli jira workitem comment create --jql "project = TEAM" --editor
```

**Note:** The subcommand is `comment create`, not just `comment`!

---

### 5. Create Work Item
**Command:**
```bash
acli jira workitem create [flags]
```

**Documentation:** https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-create/

**Flags:**
- `-s, --summary string` - Work item summary (required)
- `-p, --project string` - Project key (required)
- `-t, --type string` - Work item type (required): Epic, Story, Task, Bug
- `-a, --assignee string` - Assign by email or account ID (use '@me' for self)
- `-d, --description string` - Description (plain text or ADF)
- `--description-file string` - Read description from file
- `-l, --label strings` - Add labels (comma-separated)
- `--parent string` - Parent work item ID
- `--json` - Output in JSON
- `-f, --from-file string` - Read from file
- `--from-json string` - Read from JSON file
- `--generate-json` - Generate JSON template
- `-e, --editor` - Open text editor

**Examples:**
```bash
acli jira workitem create --summary "New Task" --project "TEAM" --type "Task"
acli jira workitem create --from-file "workitem.txt" --project "PROJ" --type "Bug" --assignee "user@atlassian.com" --label "bug,cli"
acli jira workitem create --generate-json
acli jira workitem create --from-json "workitem.json"
```

---

### 6. Edit Work Item
**Command:**
```bash
acli jira workitem edit [flags]
```

**Documentation:** https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-edit/

**Flags:**
- `-k, --key string` - Work item keys to edit
- `-s, --summary string` - Edit summary
- `-d, --description string` - Edit description
- `--description-file string` - Read description from file
- `-a, --assignee string` - Edit assignee
- `--remove-assignee` - Remove assignee
- `-l, --labels string` - Edit labels
- `--remove-labels string` - Remove specific labels
- `-t, --type string` - Edit work item type
- `--jql string` - JQL query
- `--filter string` - Filter ID
- `--json` - Generate JSON output
- `-y, --yes` - Confirm without prompting
- `--ignore-errors` - Continue on errors
- `--from-json string` - Read from JSON file
- `--generate-json` - Generate JSON template

**Examples:**
```bash
acli jira workitem edit --key "KEY-1,KEY-2" --summary "New Summary"
acli jira workitem edit --jql "project = TEAM" --assignee "user@atlassian.com"
acli jira workitem edit --filter 10001 --description "Updated description" --yes
acli jira workitem edit --generate-json
acli jira workitem edit --from-json "workitem.json"
```

---

### 7. Assign Work Item
**Command:**
```bash
acli jira workitem assign [flags]
```

**Documentation:** https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-assign/

**Flags:**
- `-k, --key string` - Work item keys to assign
- `-a, --assignee string` - Assignee email or account ID (use '@me' for self, 'default' for project default)
- `--remove-assignee` - Remove assignee
- `--jql string` - JQL query
- `--filter string` - Filter ID
- `-f, --from-file string` - Read work items from file
- `--json` - Generate JSON output
- `-y, --yes` - Confirm without prompting
- `--ignore-errors` - Continue on errors

**Examples:**
```bash
acli jira workitem assign --key "KEY-1" --assignee "@me"
acli jira workitem assign --jql "project = TEAM" --assignee "user@atlassian.com"
acli jira workitem assign --filter 10001 --assignee "default"
acli jira workitem assign --from-file "issues.txt" --remove-assignee --json
```

---

## Azure CLI Commands - VERIFIED ✅

All Azure CLI commands were already correct. Verified from https://learn.microsoft.com/en-us/azure/devops/cli/

### List Repositories
```bash
az repos list --organization https://dev.azure.com/ORG --project "PROJECT" --output json
```

### Show Repository
```bash
az repos show --organization https://dev.azure.com/ORG --project "PROJECT" --repository "REPO" --output json
```

### Create Pull Request
```bash
az repos pr create --source-branch BRANCH --target-branch main --title "TITLE" --description "DESC" --draft --output json
```

### List Pull Requests
```bash
az repos pr list --organization https://dev.azure.com/ORG --project "PROJECT" --repository "REPO" --status active --output json
```

### Run Pipeline
```bash
az pipelines run --id ID --branch BRANCH --organization https://dev.azure.com/ORG --project "PROJECT"
```

### List Builds
```bash
az pipelines build list --organization https://dev.azure.com/ORG --project "PROJECT" --definition-ids ID --top 10
```

---

## MCP SDK - VERIFIED ✅

**Latest Version:** 1.19.1 (as of January 2025)

**Source:** https://www.npmjs.com/package/@modelcontextprotocol/sdk

**Correct Import:**
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
```

**Note:** There are two APIs:
- `Server` (low-level) - Used for stdio transport with JetBrains
- `McpServer` (high-level) - Recommended for HTTP/SSE transports

---

## JetBrains Rider MCP Configuration - VERIFIED ✅

**Source:** https://www.jetbrains.com/help/ai-assistant/mcp.html

**Location:** Settings → Tools → AI Assistant → Model Context Protocol (MCP)

**Format:**
```json
{
  "servers": {
    "serverName": {
      "command": "/path/to/server/venv/bin/python",
      "args": ["/path/to/server/server.py"]
    }
  }
}
```

---

## Summary of Changes from Initial Implementation

### What Changed in Jira Server:

1. **Comment Command:**
   - ❌ Was: `jira workitem comment create --key "..." --comment "..."`
   - ✅ Now: `jira workitem comment create --key "..." --body "..."`
   - **Reason:** The flag is `--body`, not `--comment`

2. **All Commands Now Have Comments:** Added "Verified" comments to all commands indicating they were checked against official documentation

3. **SDK Version:**
   - ❌ Was: `^1.0.4`
   - ✅ Now: `^1.19.1`

### What Didn't Change:

1. Azure CLI commands were already correct
2. MCP configuration format was correct
3. Overall architecture and stdio transport usage was correct

---

## Verification Sources

All commands verified against official documentation:

1. **Atlassian CLI:**
   - Main Docs: https://developer.atlassian.com/cloud/acli/
   - Command Reference: https://developer.atlassian.com/cloud/acli/reference/commands/
   - Individual command pages for each subcommand

2. **Azure CLI:**
   - Main Docs: https://learn.microsoft.com/en-us/azure/devops/cli/
   - Command Reference: https://learn.microsoft.com/en-us/cli/azure/

3. **MCP SDK:**
   - GitHub: https://github.com/modelcontextprotocol/typescript-sdk
   - npm: https://www.npmjs.com/package/@modelcontextprotocol/sdk

4. **JetBrains:**
   - Documentation: https://www.jetbrains.com/help/ai-assistant/mcp.html

5. **Real-World Examples:**
   - Blog Post: https://mraddon.blog/2025/06/12/transform-your-jira-workflow-with-atlassian-cli-🚀/

---

## Confidence Level: HIGH ✅

All commands are now backed by:
- ✅ Official documentation pages
- ✅ Explicit flag listings
- ✅ Multiple examples from official sources
- ✅ Real-world usage examples

The implementations should now work correctly with the actual CLIs.
