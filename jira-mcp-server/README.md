# Jira MCP Server

MCP server for Atlassian Jira integration using acli (Atlassian CLI).

## Features

- 📋 Get detailed story information
- 🔍 Query stories using JQL
- 🔄 Transition stories between workflow states
- 💬 Add comments to stories
- ✨ Create new stories
- ✏️ Update story fields
- 👤 Assign stories to users
- 🏃 Get sprint information
- 📊 List your issues

## Prerequisites

1. Install Atlassian CLI (acli):
   ```bash
   # Visit https://bobswift.atlassian.net/wiki/spaces/ACLI/overview
   # Or use homebrew on macOS:
   brew install acli
   ```

2. Configure acli with your Jira credentials:
   ```bash
   acli jira --server "https://yourcompany.atlassian.net" --user "your-email@company.com" --password "your-api-token"
   ```

3. Test the connection:
   ```bash
   acli jira --action getServerInfo
   ```

## Installation

```bash
npm install
npm run build
```

## Usage

### Standalone Testing
```bash
npm start
```

### With MCP Inspector
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### In JetBrains Rider
Add to your MCP configuration:
```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/path/to/jira-mcp-server/dist/index.js"]
    }
  }
}
```

## Available Tools

### jira_get_story
Get comprehensive details about a Jira issue.

**Parameters:**
- `issueKey` (required): Issue key like "PROJ-123"

**Example:**
```
Get details for story PROJ-123
```

### jira_list_stories
Query issues using JQL (Jira Query Language).

**Parameters:**
- `jql` (required): JQL query string
- `maxResults` (optional): Max results to return (default: 50)

**Example:**
```
List all stories in project PROJ that are in progress
jql: "project = PROJ AND status = 'In Progress'"
```

### jira_get_transitions
Get available workflow transitions for an issue.

**Parameters:**
- `issueKey` (required): Issue key

**Example:**
```
What states can PROJ-123 move to?
```

### jira_transition_story
Move an issue to a different workflow state.

**Parameters:**
- `issueKey` (required): Issue key
- `transitionName` (required): Name of the transition

**Example:**
```
Move PROJ-123 to "In Progress"
```

### jira_add_comment
Add a comment to an issue.

**Parameters:**
- `issueKey` (required): Issue key
- `comment` (required): Comment text

**Example:**
```
Add comment to PROJ-123: "Started working on this"
```

### jira_create_story
Create a new Jira issue.

**Parameters:**
- `project` (required): Project key
- `summary` (required): Issue title
- `issueType` (required): Type like "Story", "Task", "Bug"
- `description` (optional): Issue description

**Example:**
```
Create a story in project PROJ with title "Add authentication"
```

### jira_update_story
Update fields on an existing issue.

**Parameters:**
- `issueKey` (required): Issue key
- `field` (required): Field to update
- `value` (required): New value

**Example:**
```
Update the description of PROJ-123
```

### jira_assign_story
Assign an issue to a user.

**Parameters:**
- `issueKey` (required): Issue key
- `assignee` (required): Username or email

**Example:**
```
Assign PROJ-123 to john.doe@company.com
```

### jira_get_current_sprint
Get the active sprint for a board.

**Parameters:**
- `boardId` (required): Board ID or name

**Example:**
```
Get the current sprint for board 123
```

### jira_list_my_issues
List all issues assigned to you.

**Parameters:**
- `status` (optional): Filter by status

**Example:**
```
Show me all my issues that are in progress
```

## Common JQL Queries

```jql
# My open issues
assignee = currentUser() AND status != Done

# Issues in current sprint
sprint in openSprints()

# Recently updated
updated >= -7d

# High priority bugs
type = Bug AND priority = High

# Unassigned stories
type = Story AND assignee is EMPTY

# Issues by label
labels = "frontend"
```

## Troubleshooting

### "acli: command not found"
Install acli from https://bobswift.atlassian.net/wiki/spaces/ACLI/overview

### "Authentication failed"
Reconfigure acli with valid credentials:
```bash
acli jira --server "https://yourcompany.atlassian.net" --user "your-email" --password "your-api-token"
```

### "Issue not found"
Verify the issue key is correct and you have permission to view it.

## Development

Watch mode for development:
```bash
npm run dev
```

The server will rebuild automatically when you make changes.
