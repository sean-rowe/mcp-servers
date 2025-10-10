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
- **Python 3.10+** and pip
- JetBrains Rider (or any JetBrains IDE)
- GitHub Copilot plugin installed

**Note on Python environments:** Modern macOS and Linux systems use externally managed Python environments. The setup script automatically creates virtual environments for each server to avoid conflicts. No global pip installation required!

## Installation

### Quick Setup (Recommended)

From the root directory:

```bash
# Run the setup script
./setup.sh
```

This will:
1. Check for Python 3.10+, pip, acli, and Azure CLI
2. **Automatically add Confluence environment variables to your shell config** (.zshrc, .bashrc, or .bash_profile) with placeholder values
3. Create a virtual environment in each server directory (`venv/`)
4. Install Python dependencies into each virtual environment
5. Display configuration instructions with the correct venv paths

**After running setup.sh:**
- Edit your shell config file (e.g., `~/.zshrc`) and update the `CONFLUENCE_URL`, `CONFLUENCE_EMAIL`, and `CONFLUENCE_API_TOKEN` values
- Run `source ~/.zshrc` (or your shell config file) to load the new environment variables

**Why virtual environments?** This approach works on externally managed Python environments (macOS, modern Linux) without requiring global pip installations or homebrew Python packages.

### Manual Setup

#### Install Dependencies for Each Server (using virtual environments)

**Jira MCP Server:**
```bash
cd jira-mcp-server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

**Confluence MCP Server:**
```bash
cd confluence-mcp-server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# Add environment variables to your shell config (e.g., ~/.zshrc)
cat >> ~/.zshrc << 'EOF'

# MCP Confluence Server Configuration
export CONFLUENCE_URL="https://yourcompany.atlassian.net"
export CONFLUENCE_EMAIL="your.email@company.com"
export CONFLUENCE_API_TOKEN="your_api_token_here"
EOF

# Then edit ~/.zshrc and update the values, then reload:
source ~/.zshrc
```

**Azure DevOps MCP Server:**
```bash
cd azure-mcp-server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

**Alternative: Global installation with pipx**

If you prefer, you can install the MCP package globally using pipx:
```bash
pipx install mcp[cli]
# Then use system python3 in your Rider configuration
```

**Alternative: Homebrew Python**

Or install Python packages via Homebrew:
```bash
brew install python-mcp
# (Note: Check if mcp package is available in Homebrew)
```

### 2. Configure in JetBrains Rider

1. Open Rider
2. Click the **GitHub Copilot icon**
3. Select **Edit settings**
4. Find the **MCP Servers** section
5. Add the following configuration:

**Using virtual environments (recommended):**
```json
{
  "mcpServers": {
    "jira": {
      "command": "/full/path/to/jira-mcp-server/venv/bin/python",
      "args": ["/full/path/to/jira-mcp-server/server.py"]
    },
    "confluence": {
      "command": "/full/path/to/confluence-mcp-server/venv/bin/python",
      "args": ["/full/path/to/confluence-mcp-server/server.py"]
    },
    "azure-devops": {
      "command": "/full/path/to/azure-mcp-server/venv/bin/python",
      "args": ["/full/path/to/azure-mcp-server/server.py"]
    }
  }
}
```

**Note:** Since the Confluence environment variables are in your shell config (added by setup.sh), they don't need to be in the Rider configuration. However, if you prefer to keep them in Rider's config for clarity, you can add:

```json
"confluence": {
  "command": "/full/path/to/confluence-mcp-server/venv/bin/python",
  "args": ["/full/path/to/confluence-mcp-server/server.py"],
  "env": {
    "CONFLUENCE_URL": "https://yourcompany.atlassian.net",
    "CONFLUENCE_EMAIL": "your.email@company.com",
    "CONFLUENCE_API_TOKEN": "your_api_token_here"
  }
}
```

**Using system Python (if you used pipx or global install):**
```json
{
  "mcpServers": {
    "jira": {
      "command": "python3",
      "args": ["/full/path/to/jira-mcp-server/server.py"]
    },
    ...
  }
}
```

**Note**: Update the paths to match your actual installation directory. The `./setup.sh` script will output the exact paths to use.

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

### Confluence MCP Server

| Tool | Description |
|------|-------------|
| `confluence_search` | Search using CQL (Confluence Query Language) |
| `confluence_search_by_jira_key` | Find pages mentioning a Jira issue |
| `confluence_get_page` | Get page content by ID |
| `confluence_get_page_by_title` | Find page by title and space |
| `confluence_list_space_pages` | List all pages in a space |
| `confluence_get_page_children` | Get child pages |
| `confluence_search_in_space` | Simple text search in a space |

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
| `azure_add_pr_comment` | Add comment to a PR |
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

### Confluence Server Not Working
- Verify environment variables are set correctly
- Test API token at https://id.atlassian.com/manage-profile/security/api-tokens
- Check you have read access to the spaces

### Azure DevOps Server Not Working
- Verify Azure CLI is installed: `az --version`
- Check Azure DevOps extension: `az extension list`
- Test authentication: `az account show`
- Set default organization: `az devops configure --defaults organization=https://dev.azure.com/yourorg`

### MCP Server Not Showing in Copilot
- Verify the paths in the configuration are correct and absolute paths
- Check Python 3.10+ is installed: `python3 --version`
- Verify dependencies are installed: `pip3 list | grep mcp`
- Restart Rider after configuration changes
- Check Rider logs for errors

### Python Import Errors
- Make sure you created the virtual environment: `python3 -m venv venv`
- Make sure you installed dependencies in the venv: `source venv/bin/activate && pip install -r requirements.txt`
- Check Python version: `python3 --version` (must be 3.10+)
- Verify you're using the venv Python in Rider configuration: `/full/path/to/venv/bin/python`

### Externally Managed Environment Error
If you see "error: externally-managed-environment" when trying to install packages:
- ✅ Use virtual environments (recommended): Run `./setup.sh` which creates venvs automatically
- ✅ Use pipx for global installation: `pipx install mcp[cli]`
- ✅ Use Homebrew: `brew install python-mcp` (if available)
- ❌ Don't use `pip3 install --user` or `sudo pip3 install` (not recommended)

## Development

### Testing MCP Servers

You can test the servers directly using their virtual environments:

```bash
# Test Jira server
cd jira-mcp-server
./venv/bin/python server.py

# Test Confluence server (with env vars)
cd confluence-mcp-server
export CONFLUENCE_URL="https://yourcompany.atlassian.net"
export CONFLUENCE_EMAIL="your.email@company.com"
export CONFLUENCE_API_TOKEN="your_api_token"
./venv/bin/python server.py

# Test Azure server
cd azure-mcp-server
./venv/bin/python server.py
```

Or use the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector ./venv/bin/python server.py
```

### Project Structure

```
github-copilot/
├── jira-mcp-server/
│   ├── server.py           # Main Jira MCP server
│   ├── requirements.txt    # Python dependencies
│   └── venv/              # Virtual environment (created by setup.sh)
├── confluence-mcp-server/
│   ├── server.py           # Main Confluence MCP server
│   ├── requirements.txt    # Python dependencies
│   └── venv/              # Virtual environment (created by setup.sh)
├── azure-mcp-server/
│   ├── server.py           # Main Azure DevOps MCP server
│   ├── requirements.txt    # Python dependencies
│   └── venv/              # Virtual environment (created by setup.sh)
├── setup.sh                # Setup script
└── README.md              # This file
```

## Customization

### Adding New Tools

To add a new tool to any server:

1. Open the server's `server.py` file
2. Add a new function decorated with `@mcp.tool()`:

```python
@mcp.tool()
def my_new_tool(param1: str, param2: int = 10) -> str:
    """Description of what this tool does.

    Args:
        param1: Description of param1
        param2: Description of param2 (optional, default: 10)
    """
    # Your implementation here
    result = execute_acli(f"some command {param1}")
    return result
```

3. The tool will automatically be registered and available in Copilot
4. Restart Rider to see the new tool

## Security Considerations

- All servers execute CLI commands or API requests with your authenticated credentials
- Ensure your machine is secure and credentials are protected
- Review the code before running to understand what commands are executed
- Use environment variables for sensitive configuration (especially for Confluence)
- These servers run locally and do not send data anywhere except to Jira/Azure DevOps/Confluence via their respective CLIs and APIs
- The Confluence server is strictly read-only (only GET requests)

## Why Python?

This project was migrated from TypeScript to Python for several reasons:
- **Simpler**: No build step, no compilation needed
- **Easier to maintain**: Direct execution of `.py` files
- **Better for CLI integration**: Python's subprocess module is ideal for wrapping CLI tools
- **Faster development**: No `package.json`, `node_modules`, or build artifacts
- **Same functionality**: Works identically with JetBrains Rider via stdio transport

## Contributing

Feel free to extend these servers with additional tools based on your workflow needs. Common additions might include:
- Slack integration
- Git operations
- Database queries
- Custom reporting tools

## License

MIT
