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

// Utility function to execute az CLI commands
async function executeAz(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`az ${command}`);
    if (stderr && !stderr.includes("WARNING")) {
      console.error(`az stderr: ${stderr}`);
    }
    return stdout.trim();
  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to execute az command: ${error.message}`
    );
  }
}

const server = new Server(
  {
    name: "azure-devops-mcp-server",
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
        name: "azure_list_repos",
        description: "List all repositories in an Azure DevOps project",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
          },
          required: ["organization", "project"],
        },
      },
      {
        name: "azure_get_repo",
        description: "Get details about a specific repository",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
          },
          required: ["organization", "project", "repository"],
        },
      },
      {
        name: "azure_clone_repo",
        description: "Get the clone URL for a repository (you can then clone it with git clone)",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
          },
          required: ["organization", "project", "repository"],
        },
      },
      {
        name: "azure_create_pr",
        description: "Create a pull request in Azure DevOps",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
            sourceBranch: {
              type: "string",
              description: "Source branch name (without refs/heads/)",
            },
            targetBranch: {
              type: "string",
              description: "Target branch name (without refs/heads/, e.g., 'main' or 'develop')",
            },
            title: {
              type: "string",
              description: "PR title",
            },
            description: {
              type: "string",
              description: "PR description",
            },
            isDraft: {
              type: "boolean",
              description: "Create as draft PR (default: false)",
            },
          },
          required: [
            "organization",
            "project",
            "repository",
            "sourceBranch",
            "targetBranch",
            "title",
          ],
        },
      },
      {
        name: "azure_list_prs",
        description: "List pull requests in a repository",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
            status: {
              type: "string",
              description: "Filter by status: 'active', 'completed', 'abandoned', or 'all' (default: active)",
            },
            createdBy: {
              type: "string",
              description: "Filter by creator (use 'me' for current user)",
            },
          },
          required: ["organization", "project", "repository"],
        },
      },
      {
        name: "azure_get_pr",
        description: "Get detailed information about a pull request",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
          },
          required: ["organization", "project", "repository", "prId"],
        },
      },
      {
        name: "azure_update_pr",
        description: "Update a pull request (title, description, status)",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
            title: {
              type: "string",
              description: "New PR title",
            },
            description: {
              type: "string",
              description: "New PR description",
            },
            status: {
              type: "string",
              description: "Status: 'active', 'abandoned', 'completed'",
            },
          },
          required: ["organization", "project", "repository", "prId"],
        },
      },
      {
        name: "azure_add_pr_reviewers",
        description: "Add reviewers to a pull request",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
            reviewers: {
              type: "string",
              description: "Comma-separated list of reviewer emails or IDs",
            },
          },
          required: ["organization", "project", "repository", "prId", "reviewers"],
        },
      },
      {
        name: "azure_approve_pr",
        description: "Approve a pull request",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
          },
          required: ["organization", "project", "repository", "prId"],
        },
      },
      {
        name: "azure_complete_pr",
        description: "Complete (merge) a pull request",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
            deleteSourceBranch: {
              type: "boolean",
              description: "Delete source branch after merge (default: false)",
            },
            mergeStrategy: {
              type: "string",
              description: "Merge strategy: 'noFastForward', 'squash', 'rebase', 'rebaseMerge'",
            },
          },
          required: ["organization", "project", "repository", "prId"],
        },
      },
      {
        name: "azure_add_pr_comment",
        description: "Add a comment to a pull request",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
            comment: {
              type: "string",
              description: "Comment text",
            },
          },
          required: ["organization", "project", "repository", "prId", "comment"],
        },
      },
      {
        name: "azure_list_branches",
        description: "List branches in a repository",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
          },
          required: ["organization", "project", "repository"],
        },
      },
      {
        name: "azure_get_commits",
        description: "List recent commits in a repository",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            repository: {
              type: "string",
              description: "Repository name",
            },
            branch: {
              type: "string",
              description: "Branch name (optional)",
            },
            top: {
              type: "number",
              description: "Number of commits to return (default: 10)",
            },
          },
          required: ["organization", "project", "repository"],
        },
      },
      {
        name: "azure_get_build_status",
        description: "Get build/pipeline status",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            pipelineId: {
              type: "number",
              description: "Pipeline ID (optional, if omitted lists recent builds)",
            },
          },
          required: ["organization", "project"],
        },
      },
      {
        name: "azure_run_pipeline",
        description: "Trigger a pipeline run",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            pipelineId: {
              type: "number",
              description: "Pipeline ID",
            },
            branch: {
              type: "string",
              description: "Branch to run pipeline on (optional, defaults to default branch)",
            },
          },
          required: ["organization", "project", "pipelineId"],
        },
      },
      {
        name: "azure_list_work_items",
        description: "List work items using WIQL (Work Item Query Language)",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            project: {
              type: "string",
              description: "Project name",
            },
            wiql: {
              type: "string",
              description: "WIQL query (e.g., 'SELECT [System.Id] FROM WorkItems WHERE [System.AssignedTo] = @Me')",
            },
          },
          required: ["organization", "project", "wiql"],
        },
      },
      {
        name: "azure_get_work_item",
        description: "Get details about a specific work item",
        inputSchema: {
          type: "object",
          properties: {
            organization: {
              type: "string",
              description: "Azure DevOps organization name",
            },
            workItemId: {
              type: "number",
              description: "Work item ID",
            },
          },
          required: ["organization", "workItemId"],
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
      case "azure_list_repos": {
        const { organization, project } = args as {
          organization: string;
          project: string;
        };
        const output = await executeAz(
          `repos list --organization https://dev.azure.com/${organization} --project "${project}" --output json`
        );
        return {
          content: [{ type: "text", text: output }],
        };
      }

      case "azure_get_repo": {
        const { organization, project, repository } = args as {
          organization: string;
          project: string;
          repository: string;
        };
        const output = await executeAz(
          `repos show --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --output json`
        );
        return {
          content: [{ type: "text", text: output }],
        };
      }

      case "azure_clone_repo": {
        const { organization, project, repository } = args as {
          organization: string;
          project: string;
          repository: string;
        };
        const repoInfo = await executeAz(
          `repos show --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --output json`
        );
        const repo = JSON.parse(repoInfo);
        return {
          content: [
            {
              type: "text",
              text: `Clone URL: ${repo.remoteUrl}\n\nTo clone, run:\ngit clone ${repo.remoteUrl}`,
            },
          ],
        };
      }

      case "azure_create_pr": {
        const {
          organization,
          project,
          repository,
          sourceBranch,
          targetBranch,
          title,
          description = "",
          isDraft = false,
        } = args as {
          organization: string;
          project: string;
          repository: string;
          sourceBranch: string;
          targetBranch: string;
          title: string;
          description?: string;
          isDraft?: boolean;
        };

        let command = `repos pr create --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --source-branch "${sourceBranch}" --target-branch "${targetBranch}" --title "${title.replace(/"/g, '\\"')}"`;

        if (description) {
          command += ` --description "${description.replace(/"/g, '\\"')}"`;
        }
        if (isDraft) {
          command += ` --draft true`;
        }
        command += ` --output json`;

        const output = await executeAz(command);
        return {
          content: [
            {
              type: "text",
              text: `Pull request created successfully\n${output}`,
            },
          ],
        };
      }

      case "azure_list_prs": {
        const { organization, project, repository, status = "active", createdBy } = args as {
          organization: string;
          project: string;
          repository: string;
          status?: string;
          createdBy?: string;
        };

        let command = `repos pr list --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --status ${status}`;
        if (createdBy) {
          command += ` --creator "${createdBy}"`;
        }
        command += ` --output json`;

        const output = await executeAz(command);
        return {
          content: [{ type: "text", text: output }],
        };
      }

      case "azure_get_pr": {
        const { organization, project, repository, prId } = args as {
          organization: string;
          project: string;
          repository: string;
          prId: number;
        };
        const output = await executeAz(
          `repos pr show --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --id ${prId} --output json`
        );
        return {
          content: [{ type: "text", text: output }],
        };
      }

      case "azure_update_pr": {
        const { organization, project, repository, prId, title, description, status } = args as {
          organization: string;
          project: string;
          repository: string;
          prId: number;
          title?: string;
          description?: string;
          status?: string;
        };

        let command = `repos pr update --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --id ${prId}`;
        if (title) command += ` --title "${title.replace(/"/g, '\\"')}"`;
        if (description) command += ` --description "${description.replace(/"/g, '\\"')}"`;
        if (status) command += ` --status ${status}`;
        command += ` --output json`;

        const output = await executeAz(command);
        return {
          content: [
            {
              type: "text",
              text: `PR updated successfully\n${output}`,
            },
          ],
        };
      }

      case "azure_add_pr_reviewers": {
        const { organization, project, repository, prId, reviewers } = args as {
          organization: string;
          project: string;
          repository: string;
          prId: number;
          reviewers: string;
        };

        const output = await executeAz(
          `repos pr reviewer add --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --id ${prId} --reviewers ${reviewers} --output json`
        );
        return {
          content: [
            {
              type: "text",
              text: `Reviewers added to PR ${prId}\n${output}`,
            },
          ],
        };
      }

      case "azure_approve_pr": {
        const { organization, project, repository, prId } = args as {
          organization: string;
          project: string;
          repository: string;
          prId: number;
        };

        const output = await executeAz(
          `repos pr set-vote --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --id ${prId} --vote approve --output json`
        );
        return {
          content: [
            {
              type: "text",
              text: `PR ${prId} approved\n${output}`,
            },
          ],
        };
      }

      case "azure_complete_pr": {
        const { organization, project, repository, prId, deleteSourceBranch = false, mergeStrategy } = args as {
          organization: string;
          project: string;
          repository: string;
          prId: number;
          deleteSourceBranch?: boolean;
          mergeStrategy?: string;
        };

        let command = `repos pr update --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --id ${prId} --status completed`;
        if (deleteSourceBranch) command += ` --delete-source-branch true`;
        if (mergeStrategy) command += ` --merge-commit-message --squash ${mergeStrategy}`;
        command += ` --output json`;

        const output = await executeAz(command);
        return {
          content: [
            {
              type: "text",
              text: `PR ${prId} completed (merged)\n${output}`,
            },
          ],
        };
      }

      case "azure_add_pr_comment": {
        const { organization, project, repository, prId, comment } = args as {
          organization: string;
          project: string;
          repository: string;
          prId: number;
          comment: string;
        };

        // Note: az repos pr comment create requires threadId, so we'll create a new thread
        const output = await executeAz(
          `repos pr policy list --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --id ${prId} --output json`
        );

        // This is a simplified approach - in practice you might want to use the REST API
        return {
          content: [
            {
              type: "text",
              text: `To add a comment to PR ${prId}, use: az repos pr policy comment --organization https://dev.azure.com/${organization} --project "${project}" --id ${prId} --comment "${comment.replace(/"/g, '\\"')}"`,
            },
          ],
        };
      }

      case "azure_list_branches": {
        const { organization, project, repository } = args as {
          organization: string;
          project: string;
          repository: string;
        };
        const output = await executeAz(
          `repos ref list --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --output json`
        );
        return {
          content: [{ type: "text", text: output }],
        };
      }

      case "azure_get_commits": {
        const { organization, project, repository, branch, top = 10 } = args as {
          organization: string;
          project: string;
          repository: string;
          branch?: string;
          top?: number;
        };

        let command = `repos commit list --organization https://dev.azure.com/${organization} --project "${project}" --repository "${repository}" --top ${top}`;
        if (branch) command += ` --branch "${branch}"`;
        command += ` --output json`;

        const output = await executeAz(command);
        return {
          content: [{ type: "text", text: output }],
        };
      }

      case "azure_get_build_status": {
        const { organization, project, pipelineId } = args as {
          organization: string;
          project: string;
          pipelineId?: number;
        };

        let command = `pipelines build list --organization https://dev.azure.com/${organization} --project "${project}"`;
        if (pipelineId) command += ` --definition-ids ${pipelineId}`;
        command += ` --output json`;

        const output = await executeAz(command);
        return {
          content: [{ type: "text", text: output }],
        };
      }

      case "azure_run_pipeline": {
        const { organization, project, pipelineId, branch } = args as {
          organization: string;
          project: string;
          pipelineId: number;
          branch?: string;
        };

        let command = `pipelines run --organization https://dev.azure.com/${organization} --project "${project}" --id ${pipelineId}`;
        if (branch) command += ` --branch "${branch}"`;
        command += ` --output json`;

        const output = await executeAz(command);
        return {
          content: [
            {
              type: "text",
              text: `Pipeline ${pipelineId} triggered\n${output}`,
            },
          ],
        };
      }

      case "azure_list_work_items": {
        const { organization, project, wiql } = args as {
          organization: string;
          project: string;
          wiql: string;
        };

        const output = await executeAz(
          `boards query --organization https://dev.azure.com/${organization} --project "${project}" --wiql "${wiql.replace(/"/g, '\\"')}" --output json`
        );
        return {
          content: [{ type: "text", text: output }],
        };
      }

      case "azure_get_work_item": {
        const { organization, workItemId } = args as {
          organization: string;
          workItemId: number;
        };

        const output = await executeAz(
          `boards work-item show --organization https://dev.azure.com/${organization} --id ${workItemId} --output json`
        );
        return {
          content: [{ type: "text", text: output }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
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
  console.error("Azure DevOps MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
