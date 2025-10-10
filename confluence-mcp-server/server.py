#!/usr/bin/env python3
"""
Confluence MCP Server - Integrates Confluence with GitHub Copilot via Model Context Protocol.
Uses Confluence REST API for read-only access to documentation.
"""

import base64
import json
import os
import sys
from typing import Optional
from urllib.parse import quote

import requests
from mcp.server.fastmcp import FastMCP

# Configuration from environment variables
CONFLUENCE_URL = os.getenv("CONFLUENCE_URL")  # e.g., https://yourcompany.atlassian.net
CONFLUENCE_EMAIL = os.getenv("CONFLUENCE_EMAIL")
CONFLUENCE_API_TOKEN = os.getenv("CONFLUENCE_API_TOKEN")

if not all([CONFLUENCE_URL, CONFLUENCE_EMAIL, CONFLUENCE_API_TOKEN]):
    print("Error: Required environment variables not set:", file=sys.stderr)
    print("  CONFLUENCE_URL - Your Confluence site URL (e.g., https://yourcompany.atlassian.net)", file=sys.stderr)
    print("  CONFLUENCE_EMAIL - Your Atlassian account email", file=sys.stderr)
    print("  CONFLUENCE_API_TOKEN - Your Atlassian API token", file=sys.stderr)
    print("\nGenerate an API token at: https://id.atlassian.com/manage-profile/security/api-tokens", file=sys.stderr)
    sys.exit(1)

mcp = FastMCP("confluence-mcp-server")


def confluence_request(endpoint: str) -> dict:
    """Make a GET request to the Confluence REST API."""
    # Create Basic Auth header
    auth_string = f"{CONFLUENCE_EMAIL}:{CONFLUENCE_API_TOKEN}"
    auth_bytes = auth_string.encode("utf-8")
    auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")

    url = f"{CONFLUENCE_URL}{endpoint}"

    try:
        response = requests.get(
            url,
            headers={
                "Authorization": f"Basic {auth_b64}",
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise RuntimeError(f"Confluence API request failed: {str(e)}") from e


@mcp.tool()
def confluence_search(cql: str, limit: int = 25, expand: Optional[str] = None) -> str:
    """Search Confluence using CQL (Confluence Query Language). Find pages by text, space, title, creator, or any combination. Read-only.

    Args:
        cql: CQL query string (e.g., 'text ~ "authentication" and space = DEV')
        limit: Maximum number of results (default: 25, max: 100)
        expand: Fields to expand (e.g., 'body.view,metadata.labels')
    """
    limit = min(limit, 100)
    endpoint = f"/wiki/rest/api/content/search?cql={quote(cql)}&limit={limit}"
    if expand:
        endpoint += f"&expand={quote(expand)}"

    data = confluence_request(endpoint)
    return json.dumps(data, indent=2)


@mcp.tool()
def confluence_search_by_jira_key(jira_key: str, space: Optional[str] = None, limit: int = 10) -> str:
    """Find Confluence pages that mention a specific Jira issue key (e.g., PROJ-123). Perfect for finding documentation related to a ticket. Read-only.

    Args:
        jira_key: Jira issue key (e.g., PROJ-123)
        space: Optional: limit search to a specific Confluence space key
        limit: Maximum number of results (default: 10)
    """
    # Build CQL to search for text containing the Jira key
    cql = f'text ~ "{jira_key}" and type = page'
    if space:
        cql += f' and space = "{space}"'

    endpoint = f"/wiki/rest/api/content/search?cql={quote(cql)}&limit={limit}&expand=body.view,metadata.labels"
    data = confluence_request(endpoint)

    result_count = len(data.get("results", []))
    return f"Found {result_count} pages mentioning {jira_key}:\n\n{json.dumps(data, indent=2)}"


@mcp.tool()
def confluence_get_page(page_id: str, expand_body: bool = True) -> str:
    """Get detailed content of a Confluence page by ID. Returns title, body content, metadata, and URL. Read-only.

    Args:
        page_id: Confluence page ID
        expand_body: Include page body content (default: true)
    """
    expand_params = (
        "body.storage,body.view,version,space,metadata.labels"
        if expand_body
        else "version,space,metadata.labels"
    )

    endpoint = f"/wiki/rest/api/content/{page_id}?expand={expand_params}"
    data = confluence_request(endpoint)
    return json.dumps(data, indent=2)


@mcp.tool()
def confluence_get_page_by_title(title: str, space_key: str) -> str:
    """Find and get a Confluence page by its title and space key. Read-only.

    Args:
        title: Exact page title
        space_key: Confluence space key (e.g., DEV, DOCS)
    """
    endpoint = f"/wiki/rest/api/content?title={quote(title)}&spaceKey={space_key}&expand=body.view,version,space"
    data = confluence_request(endpoint)

    results = data.get("results", [])
    if results:
        return json.dumps(results[0], indent=2)
    else:
        return f'No page found with title "{title}" in space {space_key}'


@mcp.tool()
def confluence_list_space_pages(space_key: str, limit: int = 25) -> str:
    """List all pages in a Confluence space. Read-only.

    Args:
        space_key: Confluence space key (e.g., DEV, DOCS)
        limit: Maximum number of results (default: 25)
    """
    cql = f'space = "{space_key}" and type = page'
    endpoint = f"/wiki/rest/api/content/search?cql={quote(cql)}&limit={limit}"
    data = confluence_request(endpoint)
    return json.dumps(data, indent=2)


@mcp.tool()
def confluence_get_page_children(page_id: str, limit: int = 25) -> str:
    """Get child pages of a specific Confluence page. Useful for navigating page hierarchies. Read-only.

    Args:
        page_id: Parent page ID
        limit: Maximum number of children to return (default: 25)
    """
    endpoint = f"/wiki/rest/api/content/{page_id}/child/page?limit={limit}"
    data = confluence_request(endpoint)
    return json.dumps(data, indent=2)


@mcp.tool()
def confluence_search_in_space(text: str, space_key: str, limit: int = 10) -> str:
    """Search for text within a specific Confluence space. Simpler than writing CQL. Read-only.

    Args:
        text: Text to search for
        space_key: Confluence space key
        limit: Maximum number of results (default: 10)
    """
    cql = f'text ~ "{text}" and space = "{space_key}" and type = page'
    endpoint = f"/wiki/rest/api/content/search?cql={quote(cql)}&limit={limit}&expand=body.view"
    data = confluence_request(endpoint)
    return json.dumps(data, indent=2)


def main():
    """Run the MCP server."""
    print(f"Confluence MCP Server running on stdio", file=sys.stderr)
    print(f"Connected to: {CONFLUENCE_URL}", file=sys.stderr)
    print(f"Authenticated as: {CONFLUENCE_EMAIL}", file=sys.stderr)
    mcp.run()


if __name__ == "__main__":
    main()
