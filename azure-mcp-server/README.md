# Azure DevOps MCP Server

MCP server for Azure DevOps integration using Azure CLI (az).

## Features

- 📦 List and manage repositories
- 🔀 Create and manage pull requests
- 🌿 Manage branches
- 💬 Add PR comments and reviewers
- ✅ Approve and complete PRs
- 🔨 Trigger pipeline runs
- 📊 Check build status
- 📋 Query work items
- 📝 Get commit history

## Prerequisites

1. Install Azure CLI:
   ```bash
   # macOS
   brew install azure-cli

   # Windows
   # Download from https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

   # Linux
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. Install Azure DevOps extension:
   ```bash
   az extension add --name azure-devops
   ```

3. Login to Azure:
   ```bash
   az login
   ```

4. Set your default organization (optional but recommended):
   ```bash
   az devops configure --defaults organization=https://dev.azure.com/yourorg project=YourProject
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
    "azure-devops": {
      "command": "node",
      "args": ["/path/to/azure-mcp-server/dist/index.js"]
    }
  }
}
```

## Available Tools

### Repository Management

#### azure_list_repos
List all repositories in a project.

**Parameters:**
- `organization`: Azure DevOps org name
- `project`: Project name

#### azure_get_repo
Get repository details.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `repository`: Repository name

#### azure_clone_repo
Get the clone URL for a repository.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `repository`: Repository name

### Pull Request Management

#### azure_create_pr
Create a pull request.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `repository`: Repository name
- `sourceBranch`: Source branch (without refs/heads/)
- `targetBranch`: Target branch (e.g., "main")
- `title`: PR title
- `description` (optional): PR description
- `isDraft` (optional): Create as draft (default: false)

#### azure_list_prs
List pull requests.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `repository`: Repository name
- `status` (optional): Filter by status (active/completed/abandoned/all)
- `createdBy` (optional): Filter by creator

#### azure_get_pr
Get PR details.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `repository`: Repository name
- `prId`: PR ID

#### azure_update_pr
Update a PR.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `repository`: Repository name
- `prId`: PR ID
- `title` (optional): New title
- `description` (optional): New description
- `status` (optional): New status

#### azure_add_pr_reviewers
Add reviewers to a PR.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `repository`: Repository name
- `prId`: PR ID
- `reviewers`: Comma-separated list of emails/IDs

#### azure_approve_pr
Approve a PR.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `repository`: Repository name
- `prId`: PR ID

#### azure_complete_pr
Complete (merge) a PR.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `repository`: Repository name
- `prId`: PR ID
- `deleteSourceBranch` (optional): Delete source branch (default: false)
- `mergeStrategy` (optional): Merge strategy

### Branch & Commit Management

#### azure_list_branches
List branches in a repository.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `repository`: Repository name

#### azure_get_commits
List recent commits.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `repository`: Repository name
- `branch` (optional): Branch name
- `top` (optional): Number of commits (default: 10)

### Pipeline Management

#### azure_get_build_status
Get build/pipeline status.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `pipelineId` (optional): Pipeline ID

#### azure_run_pipeline
Trigger a pipeline run.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `pipelineId`: Pipeline ID
- `branch` (optional): Branch to run on

### Work Item Management

#### azure_list_work_items
Query work items using WIQL.

**Parameters:**
- `organization`: Org name
- `project`: Project name
- `wiql`: WIQL query string

#### azure_get_work_item
Get work item details.

**Parameters:**
- `organization`: Org name
- `workItemId`: Work item ID

## Common Usage Patterns

### Daily Standup
```
1. List my active PRs
2. Check build status for recent pipelines
3. List my work items in progress
```

### Creating a Feature
```
1. List repositories to find the right one
2. Get clone URL and clone locally
3. Create feature branch (via git)
4. Make changes and push
5. Create PR from feature branch to main
6. Add reviewers to the PR
```

### Code Review
```
1. List active PRs in the repo
2. Get PR details for specific PR
3. Review changes (in IDE/browser)
4. Approve the PR
5. Complete (merge) the PR
```

### Pipeline Management
```
1. Get build status for recent runs
2. Trigger pipeline run on specific branch
3. Monitor build progress
```

## Common WIQL Queries

```sql
-- My work items
SELECT [System.Id], [System.Title], [System.State]
FROM WorkItems
WHERE [System.AssignedTo] = @Me
AND [System.State] <> 'Closed'

-- Work items in current iteration
SELECT [System.Id], [System.Title]
FROM WorkItems
WHERE [System.IterationPath] = @CurrentIteration

-- Recently created bugs
SELECT [System.Id], [System.Title]
FROM WorkItems
WHERE [System.WorkItemType] = 'Bug'
AND [System.CreatedDate] >= @Today - 7
```

## Troubleshooting

### "az: command not found"
Install Azure CLI from https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

### "Azure DevOps extension not found"
Install the extension:
```bash
az extension add --name azure-devops
```

### "Authentication required"
Login to Azure:
```bash
az login
```

### "Organization not found"
Set your default organization:
```bash
az devops configure --defaults organization=https://dev.azure.com/yourorg
```

### "Project not found"
Verify you have access to the project and the name is correct.

## Development

Watch mode for development:
```bash
npm run dev
```

The server will rebuild automatically when you make changes.
