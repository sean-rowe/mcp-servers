#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// Configuration from environment variables
const CONFLUENCE_URL = process.env.CONFLUENCE_URL; // e.g., https://yourcompany.atlassian.net
const CONFLUENCE_EMAIL = process.env.CONFLUENCE_EMAIL;
const CONFLUENCE_API_TOKEN = process.env.CONFLUENCE_API_TOKEN;

if (!CONFLUENCE_URL || !CONFLUENCE_EMAIL || !CONFLUENCE_API_TOKEN) {
  console.error("Error: Required environment variables not set:");
  console.error("  CONFLUENCE_URL - Your Confluence site URL (e.g., https://yourcompany.atlassian.net)");
  console.error("  CONFLUENCE_EMAIL - Your Atlassian account email");
  console.error("  CONFLUENCE_API_TOKEN - Your Atlassian API token");
  console.error("\nGenerate an API token at: https://id.atlassian.com/manage-profile/security/api-tokens");
  process.exit(1);
}

// Utility function to make Confluence REST API requests
async function confluenceRequest(endpoint: string): Promise<any> {
  const auth = Buffer.from(`${CONFLUENCE_EMAIL}:${CONFLUENCE_API_TOKEN}`).toString('base64');
  const url = `${CONFLUENCE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      `Confluence API request failed: ${error.message}`
    );
  }
}

const server = new Server(
  {
    name: "confluence-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "confluence_search",
        description: "Search Confluence using CQL (Confluence Query Language). Find pages by text, space, title, creator, or any combination. Read-only.",
        inputSchema: {
          type: "object",
          properties: {
            cql: {
              type: "string",
              description: "CQL query string (e.g., 'text ~ \"authentication\" and space = DEV')",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 25, max: 100)",
            },
            expand: {
              type: "string",
              description: "Fields to expand (e.g., 'body.view,metadata.labels')",
            },
          },
          required: ["cql"],
        },
      },
      {
        name: "confluence_search_by_jira_key",
        description: "Find Confluence pages that mention a specific Jira issue key (e.g., PROJ-123). Perfect for finding documentation related to a ticket. Read-only.",
        inputSchema: {
          type: "object",
          properties: {
            jiraKey: {
              type: "string",
              description: "Jira issue key (e.g., PROJ-123)",
            },
            space: {
              type: "string",
              description: "Optional: limit search to a specific Confluence space key",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 10)",
            },
          },
          required: ["jiraKey"],
        },
      },
      {
        name: "confluence_get_page",
        description: "Get detailed content of a Confluence page by ID. Returns title, body content, metadata, and URL. Read-only.",
        inputSchema: {
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "Confluence page ID",
            },
            expandBody: {
              type: "boolean",
              description: "Include page body content (default: true)",
            },
          },
          required: ["pageId"],
        },
      },
      {
        name: "confluence_get_page_by_title",
        description: "Find and get a Confluence page by its title and space key. Read-only.",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Exact page title",
            },
            spaceKey: {
              type: "string",
              description: "Confluence space key (e.g., DEV, DOCS)",
            },
          },
          required: ["title", "spaceKey"],
        },
      },
      {
        name: "confluence_list_space_pages",
        description: "List all pages in a Confluence space. Read-only.",
        inputSchema: {
          type: "object",
          properties: {
            spaceKey: {
              type: "string",
              description: "Confluence space key (e.g., DEV, DOCS)",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 25)",
            },
          },
          required: ["spaceKey"],
        },
      },
      {
        name: "confluence_get_page_children",
        description: "Get child pages of a specific Confluence page. Useful for navigating page hierarchies. Read-only.",
        inputSchema: {
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "Parent page ID",
            },
            limit: {
              type: "number",
              description: "Maximum number of children to return (default: 25)",
            },
          },
          required: ["pageId"],
        },
      },
      {
        name: "confluence_search_in_space",
        description: "Search for text within a specific Confluence space. Simpler than writing CQL. Read-only.",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to search for",
            },
            spaceKey: {
              type: "string",
              description: "Confluence space key",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 10)",
            },
          },
          required: ["text", "spaceKey"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "confluence_search": {
        const { cql, limit = 25, expand } = args as {
          cql: string;
          limit?: number;
          expand?: string;
        };

        let endpoint = `/wiki/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=${Math.min(limit, 100)}`;
        if (expand) {
          endpoint += `&expand=${encodeURIComponent(expand)}`;
        }

        const data = await confluenceRequest(endpoint);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "confluence_search_by_jira_key": {
        const { jiraKey, space, limit = 10 } = args as {
          jiraKey: string;
          space?: string;
          limit?: number;
        };

        // Build CQL to search for text containing the Jira key
        let cql = `text ~ "${jiraKey}" and type = page`;
        if (space) {
          cql += ` and space = "${space}"`;
        }

        const endpoint = `/wiki/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=${limit}&expand=body.view,metadata.labels`;
        const data = await confluenceRequest(endpoint);

        return {
          content: [
            {
              type: "text",
              text: `Found ${data.results?.length || 0} pages mentioning ${jiraKey}:\n\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case "confluence_get_page": {
        const { pageId, expandBody = true } = args as {
          pageId: string;
          expandBody?: boolean;
        };

        const expandParams = expandBody
          ? "body.storage,body.view,version,space,metadata.labels"
          : "version,space,metadata.labels";

        const endpoint = `/wiki/rest/api/content/${pageId}?expand=${expandParams}`;
        const data = await confluenceRequest(endpoint);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "confluence_get_page_by_title": {
        const { title, spaceKey } = args as {
          title: string;
          spaceKey: string;
        };

        const endpoint = `/wiki/rest/api/content?title=${encodeURIComponent(title)}&spaceKey=${spaceKey}&expand=body.view,version,space`;
        const data = await confluenceRequest(endpoint);

        if (data.results && data.results.length > 0) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data.results[0], null, 2),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `No page found with title "${title}" in space ${spaceKey}`,
              },
            ],
          };
        }
      }

      case "confluence_list_space_pages": {
        const { spaceKey, limit = 25 } = args as {
          spaceKey: string;
          limit?: number;
        };

        const cql = `space = "${spaceKey}" and type = page`;
        const endpoint = `/wiki/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=${limit}`;
        const data = await confluenceRequest(endpoint);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "confluence_get_page_children": {
        const { pageId, limit = 25 } = args as {
          pageId: string;
          limit?: number;
        };

        const endpoint = `/wiki/rest/api/content/${pageId}/child/page?limit=${limit}`;
        const data = await confluenceRequest(endpoint);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "confluence_search_in_space": {
        const { text, spaceKey, limit = 10 } = args as {
          text: string;
          spaceKey: string;
          limit?: number;
        };

        const cql = `text ~ "${text}" and space = "${spaceKey}" and type = page`;
        const endpoint = `/wiki/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=${limit}&expand=body.view`;
        const data = await confluenceRequest(endpoint);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error: any) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing ${name}: ${error.message}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Confluence MCP Server running on stdio");
  console.error(`Connected to: ${CONFLUENCE_URL}`);
  console.error(`Authenticated as: ${CONFLUENCE_EMAIL}`);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
