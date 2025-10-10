# Confluence MCP Server

**Read-only** MCP server for Atlassian Confluence integration using the REST API.

## Features

- 🔍 Search Confluence using CQL (Confluence Query Language)
- 📄 Get page content by ID or title
- 🔗 Find pages mentioning specific Jira issues
- 📚 List pages in spaces
- 🌳 Navigate page hierarchies
- 🔒 **Read-only** - No write operations

## Prerequisites

1. **Confluence Cloud Account** with access to your organization's Confluence
2. **Atlassian API Token** - Generate at https://id.atlassian.com/manage-profile/security/api-tokens
3. **Node.js 18+** and npm

## Installation

```bash
npm install
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Your Confluence site URL (without trailing slash)
export CONFLUENCE_URL="https://yourcompany.atlassian.net"

# Your Atlassian account email
export CONFLUENCE_EMAIL="your.email@company.com"

# Your Atlassian API token
export CONFLUENCE_API_TOKEN="your_api_token_here"
```

### Generating an API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token**
3. Give it a label (e.g., "Confluence MCP Server")
4. Copy the token and save it securely
5. Use it as `CONFLUENCE_API_TOKEN`

## Usage in JetBrains Rider

Add to your MCP configuration:

```json
{
  "servers": {
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

**Security Note:** Consider storing credentials in a secure location and referencing them, rather than hardcoding in the config file.

## Available Tools

### 1. confluence_search
Search Confluence using CQL (Confluence Query Language).

**Parameters:**
- `cql` (required): CQL query string
- `limit` (optional): Max results (default: 25, max: 100)
- `expand` (optional): Fields to expand

**Examples:**
```
Search for pages containing "authentication" in the DEV space
```

**CQL:**
```
text ~ "authentication" and space = DEV
```

### 2. confluence_search_by_jira_key
Find Confluence pages that mention a specific Jira issue.

**Parameters:**
- `jiraKey` (required): Jira issue key (e.g., PROJ-123)
- `space` (optional): Limit to specific space
- `limit` (optional): Max results (default: 10)

**Example:**
```
Find all Confluence pages mentioning PROJ-456
```

### 3. confluence_get_page
Get detailed content of a page by ID.

**Parameters:**
- `pageId` (required): Confluence page ID
- `expandBody` (optional): Include body content (default: true)

**Example:**
```
Get the content of page 123456789
```

### 4. confluence_get_page_by_title
Find a page by exact title and space.

**Parameters:**
- `title` (required): Exact page title
- `spaceKey` (required): Space key

**Example:**
```
Get the page titled "API Documentation" from the DEV space
```

### 5. confluence_list_space_pages
List all pages in a Confluence space.

**Parameters:**
- `spaceKey` (required): Space key
- `limit` (optional): Max results (default: 25)

**Example:**
```
List all pages in the DOCS space
```

### 6. confluence_get_page_children
Get child pages of a specific page (for hierarchical navigation).

**Parameters:**
- `pageId` (required): Parent page ID
- `limit` (optional): Max children (default: 25)

**Example:**
```
Show me the child pages of page 123456789
```

### 7. confluence_search_in_space
Simple text search within a specific space.

**Parameters:**
- `text` (required): Text to search for
- `spaceKey` (required): Space key
- `limit` (optional): Max results (default: 10)

**Example:**
```
Search for "database migration" in the DEV space
```

## CQL (Confluence Query Language) Examples

### Basic Searches
```cql
# Find pages with specific text
text ~ "authentication"

# Pages in a specific space
space = DEV

# Pages with specific title
title = "API Documentation"

# Combine conditions
text ~ "API" and space = DEV
```

### Advanced Searches
```cql
# Pages created by a specific user
creator = "john.doe@company.com"

# Pages modified in the last 7 days
lastModified >= now("-7d")

# Pages with specific label
label = "architecture"

# Multiple spaces
space in (DEV, QA, PROD)

# Exclude specific space
space != ARCHIVE

# Pages containing Jira issue macros
macro = jira
```

### Search by Type
```cql
# Only pages (not blog posts or attachments)
type = page

# Only blog posts
type = blogpost

# Combine with other criteria
type = page and space = DEV and text ~ "security"
```

## Common Workflows

### Finding Documentation for a Jira Ticket

**Scenario:** You're working on PROJ-456 and want to find related documentation.

**Ask Copilot:**
```
Search Confluence for pages mentioning PROJ-456
```

**What it does:**
Uses `confluence_search_by_jira_key` to find all pages that reference the issue.

### Researching a Topic

**Scenario:** You need to understand how authentication works in your system.

**Ask Copilot:**
```
Search Confluence for "authentication" in the DEV space and show me the most relevant pages
```

**What it does:**
Uses `confluence_search_in_space` or `confluence_search` with CQL to find relevant pages.

### Getting Specific Documentation

**Scenario:** You know there's a page called "API Documentation" in your DOCS space.

**Ask Copilot:**
```
Get the "API Documentation" page from the DOCS space in Confluence
```

**What it does:**
Uses `confluence_get_page_by_title` to retrieve the exact page.

### Browsing Space Contents

**Scenario:** You want to see what documentation exists in the DEV space.

**Ask Copilot:**
```
List all pages in the DEV Confluence space
```

**What it does:**
Uses `confluence_list_space_pages` to show available pages.

## Typical Developer Workflow with Jira + Confluence

### 1. Start Working on a Story
```
1. "Get details for PROJ-456" (Jira)
2. "Search Confluence for pages mentioning PROJ-456" (Confluence)
3. "Get the 'Authentication Architecture' page from DEV space" (Confluence)
4. [Read documentation, understand requirements]
```

### 2. Need Technical Context
```
1. "Search Confluence for 'JWT authentication' in DEV space"
2. "Get page 123456789" (specific technical doc)
3. "Show me child pages of 123456789" (related docs)
```

### 3. Finding Related Work
```
1. "Find Confluence pages mentioning sprint planning"
2. "List pages in the TEAM space"
3. "Search for pages modified in the last week in DEV space"
```

## Troubleshooting

### Authentication Errors

**Error:** `HTTP 401: Unauthorized`

**Solutions:**
1. Verify your email is correct
2. Regenerate your API token
3. Ensure the token has appropriate scopes (read:confluence-content.all)

### Page Not Found

**Error:** `HTTP 404: Not Found`

**Solutions:**
1. Verify the page ID is correct
2. Check you have permission to view the page
3. Ensure the page hasn't been deleted

### Rate Limiting

**Error:** `HTTP 429: Too Many Requests`

**Solution:**
Wait a moment before making more requests. Atlassian has rate limits on API calls.

### Empty Search Results

**Issue:** Search returns no results

**Solutions:**
1. Check your CQL syntax
2. Verify the space key is correct (it's case-sensitive)
3. Ensure you have permission to view content in that space
4. Try a broader search query

## CQL Reference

### Fields
- `text` - Full-text search
- `title` - Page title
- `space` - Space key
- `type` - Content type (page, blogpost, etc.)
- `creator` - Content creator
- `lastModified` - Last modification date
- `created` - Creation date
- `label` - Labels/tags
- `macro` - Macro name

### Operators
- `=` - Equals
- `!=` - Not equals
- `~` - Contains (text search)
- `!~` - Does not contain
- `>`, `>=`, `<`, `<=` - Comparison
- `IN` - One of multiple values
- `NOT IN` - Not one of values

### Logical Operators
- `AND` - Both conditions true
- `OR` - Either condition true
- `NOT` - Negation

## Security Considerations

- ✅ **Read-only**: This server only performs GET requests
- ✅ **Authentication**: Uses your personal API token with Basic Auth
- ✅ **Permissions**: Respects Confluence permissions - you can only see what you have access to
- ⚠️ **Token Security**: Keep your API token secure, don't commit it to version control
- ⚠️ **Local Only**: This server runs locally and doesn't send data anywhere except to Confluence

## API Documentation

This server uses the Confluence Cloud REST API:
- **Search API (v1)**: https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-search/
- **Content API (v1)**: https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-content/
- **CQL Reference**: https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/

## Development

```bash
# Watch mode for development
npm run dev

# Test the server
npm start
```

## License

MIT
