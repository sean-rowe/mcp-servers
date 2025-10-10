# Developer Workflow MCP Servers

Three MCP (Model Context Protocol) servers for integrating Jira, Confluence, and Azure DevOps with GitHub Copilot in JetBrains Rider.

## Overview

These servers enable you to:
- **Jira MCP Server**: Query stories, move stories between states, add comments, create stories, and more
- **Confluence MCP Server**: Search documentation, find pages related to Jira tickets, get page content (read-only)
- **Azure DevOps MCP Server**: Create PRs, clone repos, manage branches, run pipelines, and handle work items

## Prerequisites

### For Jira MCP Server
- [Atlassian CLI (acli)](https://bobswift.atlassian.net/wiki/spaces/ACLI/overview) installed and configured
- Jira credentials configured in acli

### For Confluence MCP Server
- [Atlassian API Token](https://id.atlassian.com/manage-profile/security/api-tokens) - Generate from your Atlassian account
- Your Confluence site URL and email
- Read access to Confluence spaces you want to query

### For Azure DevOps MCP Server
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- Azure DevOps extension: `az extension add --name azure-devops`
- Authenticated with Azure: `az login`

### General Requirements
- Node.js 18+ and npm
- JetBrains Rider (or any JetBrains IDE)
- GitHub Copilot plugin installed

## Installation

### 1. Build Both Servers

#### Jira MCP Server
```bash
cd jira-mcp-server
npm install
npm run build
```

#### Confluence MCP Server
```bash
cd confluence-mcp-server
npm install
npm run build

# Set environment variables (or create .env file)
export CONFLUENCE_URL="https://yourcompany.atlassian.net"
export CONFLUENCE_EMAIL="your.email@company.com"
export CONFLUENCE_API_TOKEN="your_api_token"
```

#### Azure DevOps MCP Server
```bash
cd azure-mcp-server
npm install
npm run build
```

### 2. Configure in JetBrains Rider

1. Open Rider
2. Click the **GitHub Copilot icon**
3. Select **Edit settings**
4. Find the **MCP Servers** section
5. Add the following configuration:

```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/Users/srowe/projects/github-copilot/jira-mcp-server/dist/index.js"]
    },
    "confluence": {
      "command": "node",
      "args": ["/Users/srowe/projects/github-copilot/confluence-mcp-server/dist/index.js"],
      "env": {
        "CONFLUENCE_URL": "https://yourcompany.atlassian.net",
        "CONFLUENCE_EMAIL": "your.email@company.com",
        "CONFLUENCE_API_TOKEN": "your_api_token_here"
      }
    },
    "azure-devops": {
      "command": "node",
      "args": ["/Users/srowe/projects/github-copilot/azure-mcp-server/dist/index.js"]
    }
  }
}
```

**Note**: Update the paths to match your actual installation directory.

### 3. Restart Rider

After adding the configuration, restart Rider for the changes to take effect.

## Usage Examples

### Jira Workflow

**Get Story Details:**
```
Hey Copilot, use the jira_get_story tool to get details about PROJ-123
```

**List My Current Stories:**
```
Show me all my in-progress stories in Jira using jira_list_my_issues
```

**Move Story to Next State:**
```
Use jira_get_transitions to see what states PROJ-123 can move to,
then transition it to "In Progress"
```

**Create a New Story:**
```
Create a new Jira story in project PROJ with title "Implement user authentication"
and type "Story"
```

**Add Comment:**
```
Add a comment to PROJ-123 saying "Started working on this, ETA 2 days"
```

### Confluence Workflow

**Find Documentation for a Ticket:**
```
Search Confluence for pages mentioning PROJ-123
```

**Search for Technical Documentation:**
```
Search Confluence for "authentication" in the DEV space
```

**Get Specific Page:**
```
Get the "API Documentation" page from the DOCS space in Confluence
```

**Browse Space Contents:**
```
List all pages in the DEV Confluence space
```

**Find Recent Documentation:**
```
Search Confluence for pages modified in the last week about "deployment"
```

### Azure DevOps Workflow

**List Repositories:**
```
Show me all repos in the MyProject project in myorg organization
```

**Clone a Repository:**
```
Get the clone URL for the MyRepo repository
```

**Create a Pull Request:**
```
Create a PR from feature/my-feature to main in MyRepo with title
"Add new feature" and description "This implements X, Y, Z"
```

**List My PRs:**
```
Show me all active PRs I created in MyRepo
```

**Get PR Details:**
```
Get details about PR #42 in MyRepo
```

**Approve and Complete PR:**
```
Approve PR #42, then complete it and delete the source branch
```

**Run a Pipeline:**
```
Trigger pipeline 123 on the develop branch
```

**List Recent Commits:**
```
Show me the last 20 commits in MyRepo on the main branch
```

## Available Tools

### Jira MCP Server

| Tool | Description |
|------|-------------|
| `jira_get_story` | Get detailed info about a story (summary, description, status, etc.) |
| `jira_list_stories` | Query stories using JQL |
| `jira_get_transitions` | Get available workflow transitions for a story |
| `jira_transition_story` | Move story to next state |
| `jira_add_comment` | Add comment to a story |
| `jira_create_story` | Create a new story |
| `jira_update_story` | Update story fields |
| `jira_assign_story` | Assign story to user |
| `jira_get_current_sprint` | Get active sprint for a board |
| `jira_list_my_issues` | List issues assigned to current user |

### Azure DevOps MCP Server

| Tool | Description |
|------|-------------|
| `azure_list_repos` | List all repositories in a project |
| `azure_get_repo` | Get repository details |
| `azure_clone_repo` | Get clone URL for a repository |
| `azure_create_pr` | Create a pull request |
| `azure_list_prs` | List pull requests |
| `azure_get_pr` | Get PR details |
| `azure_update_pr` | Update PR title, description, or status |
| `azure_add_pr_reviewers` | Add reviewers to a PR |
| `azure_approve_pr` | Approve a PR |
| `azure_complete_pr` | Complete (merge) a PR |
| `azure_list_branches` | List branches in a repository |
| `azure_get_commits` | List recent commits |
| `azure_get_build_status` | Get build/pipeline status |
| `azure_run_pipeline` | Trigger a pipeline run |
| `azure_list_work_items` | Query work items using WIQL |
| `azure_get_work_item` | Get work item details |

## Typical Developer Workflow

### Morning Standup Prep
```
1. List all my Jira issues in "In Progress" status
2. Get the current sprint information
3. Show me my active PRs in Azure DevOps
```

### Starting Work on a Story
```
1. Get story details for PROJ-456
2. Get the clone URL for the repository
3. Create a feature branch
4. Transition the story to "In Progress"
```

### Creating a PR
```
1. Create a PR from my feature branch to main
2. Add reviewers to the PR
3. Add a comment to the Jira story with the PR link
4. Transition the story to "In Review"
```

### Finishing a Story
```
1. Check the build status for my PR
2. Get PR details to see if it's approved
3. Complete the PR and delete the source branch
4. Transition the Jira story to "Done"
```

## Troubleshooting

### Jira Server Not Working
- Verify acli is installed: `acli --version`
- Test acli connection: `acli jira --action getServerInfo`
- Check credentials are configured

### Azure DevOps Server Not Working
- Verify Azure CLI is installed: `az --version`
- Check Azure DevOps extension: `az extension list`
- Test authentication: `az account show`
- Set default organization: `az devops configure --defaults organization=https://dev.azure.com/yourorg`

### MCP Server Not Showing in Copilot
- Verify the paths in the configuration are correct
- Check the server builds successfully: `npm run build`
- Restart Rider after configuration changes
- Check Rider logs for errors

## Development

### Running in Development Mode

Watch for changes and rebuild automatically:

```bash
# Jira server
cd jira-mcp-server
npm run dev

# Azure server
cd azure-mcp-server
npm run dev
```

### Testing MCP Servers

You can test the servers using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Customization

### Adding New Tools

1. Edit `src/index.ts` in the respective server
2. Add the tool definition to `ListToolsRequestSchema` handler
3. Add the tool implementation to `CallToolRequestSchema` handler
4. Rebuild: `npm run build`
5. Restart Rider

### Example: Adding a Custom Jira Tool

```typescript
// In ListToolsRequestSchema handler
{
  name: "jira_get_sprint_velocity",
  description: "Calculate velocity for a sprint",
  inputSchema: {
    type: "object",
    properties: {
      sprintId: {
        type: "string",
        description: "Sprint ID",
      },
    },
    required: ["sprintId"],
  },
}

// In CallToolRequestSchema handler
case "jira_get_sprint_velocity": {
  const { sprintId } = args as { sprintId: string };
  const output = await executeAcli(
    `sprint report --sprint ${sprintId} --output json`
  );
  return {
    content: [{ type: "text", text: output }],
  };
}
```

## Security Considerations

- Both servers execute CLI commands with your authenticated credentials
- Ensure your machine is secure and credentials are protected
- Review the code before running to understand what commands are executed
- Consider using environment variables for sensitive configuration
- These servers run locally and do not send data anywhere except to Jira/Azure DevOps via their respective CLIs

## Contributing

Feel free to extend these servers with additional tools based on your workflow needs. Common additions might include:
- Slack integration
- Confluence integration
- Git operations
- Database queries
- Custom reporting tools

## License

MIT
