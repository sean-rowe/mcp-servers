#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Utility function to execute acli commands
async function executeAcli(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`acli ${command}`);
    if (stderr) {
      console.error(`acli stderr: ${stderr}`);
    }
    return stdout.trim();
  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to execute acli command: ${error.message}`
    );
  }
}

const server = new Server(
  {
    name: "jira-mcp-server",
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
        name: "jira_get_story",
        description: "Get detailed information about a Jira story/issue including summary, description, status, assignee, labels, and all custom fields",
        inputSchema: {
          type: "object",
          properties: {
            issueKey: {
              type: "string",
              description: "The issue key (e.g., PROJ-123)",
            },
          },
          required: ["issueKey"],
        },
      },
      {
        name: "jira_list_stories",
        description: "List stories using JQL (Jira Query Language). Can filter by project, assignee, status, sprint, etc.",
        inputSchema: {
          type: "object",
          properties: {
            jql: {
              type: "string",
              description: "JQL query string (e.g., 'project = PROJ AND status = \"In Progress\"')",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results to return (default: 50)",
            },
          },
          required: ["jql"],
        },
      },
      {
        name: "jira_get_transitions",
        description: "Get available workflow transitions for a story (e.g., what states it can move to)",
        inputSchema: {
          type: "object",
          properties: {
            issueKey: {
              type: "string",
              description: "The issue key (e.g., PROJ-123)",
            },
          },
          required: ["issueKey"],
        },
      },
      {
        name: "jira_transition_story",
        description: "Move a story to the next workflow state (e.g., from 'To Do' to 'In Progress', or 'In Progress' to 'Done')",
        inputSchema: {
          type: "object",
          properties: {
            issueKey: {
              type: "string",
              description: "The issue key (e.g., PROJ-123)",
            },
            transitionName: {
              type: "string",
              description: "Name of the transition (e.g., 'Start Progress', 'Done', 'Ready for Review')",
            },
          },
          required: ["issueKey", "transitionName"],
        },
      },
      {
        name: "jira_add_comment",
        description: "Add a comment to a Jira story",
        inputSchema: {
          type: "object",
          properties: {
            issueKey: {
              type: "string",
              description: "The issue key (e.g., PROJ-123)",
            },
            comment: {
              type: "string",
              description: "The comment text to add",
            },
          },
          required: ["issueKey", "comment"],
        },
      },
      {
        name: "jira_create_story",
        description: "Create a new Jira story/issue",
        inputSchema: {
          type: "object",
          properties: {
            project: {
              type: "string",
              description: "Project key (e.g., PROJ)",
            },
            summary: {
              type: "string",
              description: "Story title/summary",
            },
            description: {
              type: "string",
              description: "Story description",
            },
            issueType: {
              type: "string",
              description: "Issue type (e.g., 'Story', 'Task', 'Bug')",
            },
          },
          required: ["project", "summary", "issueType"],
        },
      },
      {
        name: "jira_update_story",
        description: "Update fields on a Jira story (e.g., summary, description, labels)",
        inputSchema: {
          type: "object",
          properties: {
            issueKey: {
              type: "string",
              description: "The issue key (e.g., PROJ-123)",
            },
            field: {
              type: "string",
              description: "Field to update (e.g., 'summary', 'description', 'labels')",
            },
            value: {
              type: "string",
              description: "New value for the field",
            },
          },
          required: ["issueKey", "field", "value"],
        },
      },
      {
        name: "jira_assign_story",
        description: "Assign a story to a user",
        inputSchema: {
          type: "object",
          properties: {
            issueKey: {
              type: "string",
              description: "The issue key (e.g., PROJ-123)",
            },
            assignee: {
              type: "string",
              description: "Username or email of the assignee",
            },
          },
          required: ["issueKey", "assignee"],
        },
      },
      {
        name: "jira_get_current_sprint",
        description: "Get the current active sprint for a board",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "Board ID or board name",
            },
          },
          required: ["boardId"],
        },
      },
      {
        name: "jira_list_my_issues",
        description: "List all issues assigned to the current user",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              description: "Optional status filter (e.g., 'In Progress', 'To Do')",
            },
          },
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
      case "jira_get_story": {
        const { issueKey } = args as { issueKey: string };
        // Verified: acli jira workitem view uses positional argument for key
        const output = await executeAcli(
          `jira workitem view ${issueKey} --json`
        );
        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      }

      case "jira_list_stories": {
        const { jql, maxResults = 50 } = args as {
          jql: string;
          maxResults?: number;
        };
        // Verified: uses --jql, --limit, and --json flags
        const output = await executeAcli(
          `jira workitem search --jql "${jql}" --limit ${maxResults} --json`
        );
        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      }

      case "jira_get_transitions": {
        const { issueKey } = args as { issueKey: string };
        // Get current status - acli doesn't have a direct "list transitions" command
        // Users can view available transitions in Jira UI or use the view command
        const output = await executeAcli(
          `jira workitem view ${issueKey} --fields status --json`
        );
        return {
          content: [
            {
              type: "text",
              text: `Current work item status:\n${output}\n\nNote: To transition, use the jira_transition_story tool with the target status name.`,
            },
          ],
        };
      }

      case "jira_transition_story": {
        const { issueKey, transitionName } = args as {
          issueKey: string;
          transitionName: string;
        };
        // Verified: uses --key and --status flags
        const output = await executeAcli(
          `jira workitem transition --key "${issueKey}" --status "${transitionName}"`
        );
        return {
          content: [
            {
              type: "text",
              text: `Successfully transitioned ${issueKey} to ${transitionName}\n${output}`,
            },
          ],
        };
      }

      case "jira_add_comment": {
        const { issueKey, comment } = args as {
          issueKey: string;
          comment: string;
        };
        // Verified: uses comment create subcommand with --key and --body flags
        const output = await executeAcli(
          `jira workitem comment create --key "${issueKey}" --body "${comment.replace(/"/g, '\\"')}"`
        );
        return {
          content: [
            {
              type: "text",
              text: `Comment added to ${issueKey}\n${output}`,
            },
          ],
        };
      }

      case "jira_create_story": {
        const { project, summary, description = "", issueType } = args as {
          project: string;
          summary: string;
          description?: string;
          issueType: string;
        };
        // Verified: uses --project, --type, --summary, and --description flags
        let command = `jira workitem create --project "${project}" --type "${issueType}" --summary "${summary.replace(/"/g, '\\"')}"`;
        if (description) {
          command += ` --description "${description.replace(/"/g, '\\"')}"`;
        }
        const output = await executeAcli(command);
        return {
          content: [
            {
              type: "text",
              text: `Story created successfully\n${output}`,
            },
          ],
        };
      }

      case "jira_update_story": {
        const { issueKey, field, value } = args as {
          issueKey: string;
          field: string;
          value: string;
        };
        // Verified: uses edit command with --key and field-specific flags
        const output = await executeAcli(
          `jira workitem edit --key "${issueKey}" --${field} "${value.replace(/"/g, '\\"')}"`
        );
        return {
          content: [
            {
              type: "text",
              text: `Updated ${field} on ${issueKey}\n${output}`,
            },
          ],
        };
      }

      case "jira_assign_story": {
        const { issueKey, assignee } = args as {
          issueKey: string;
          assignee: string;
        };
        // Verified: uses assign command with --key and --assignee flags
        const output = await executeAcli(
          `jira workitem assign --key "${issueKey}" --assignee "${assignee}"`
        );
        return {
          content: [
            {
              type: "text",
              text: `Assigned ${issueKey} to ${assignee}\n${output}`,
            },
          ],
        };
      }

      case "jira_get_current_sprint": {
        const { boardId } = args as { boardId: string };
        // Use JQL to query current sprint - acli doesn't have dedicated sprint commands
        const output = await executeAcli(
          `jira workitem search --jql "sprint in openSprints() AND board = ${boardId}" --json`
        );
        return {
          content: [
            {
              type: "text",
              text: `Work items in current sprint:\n${output}`,
            },
          ],
        };
      }

      case "jira_list_my_issues": {
        const { status } = args as { status?: string };
        let jql = "assignee = currentUser()";
        if (status) {
          jql += ` AND status = "${status}"`;
        }
        const output = await executeAcli(
          `jira workitem search --jql "${jql}" --json`
        );
        return {
          content: [
            {
              type: "text",
              text: output,
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
  console.error("Jira MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
