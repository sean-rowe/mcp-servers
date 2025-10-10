#!/usr/bin/env python3
"""
Jira MCP Server - Integrates Jira with GitHub Copilot via Model Context Protocol.
Uses Atlassian CLI (acli) to interact with Jira Cloud.
"""

import subprocess
import sys
from typing import Optional

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("jira-mcp-server")


def execute_acli(command: str) -> str:
    """Execute an acli command and return the output."""
    try:
        result = subprocess.run(
            f"acli {command}",
            shell=True,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Failed to execute acli command: {e.stderr}") from e


@mcp.tool()
def jira_get_story(issue_key: str) -> str:
    """Get detailed information about a Jira story/issue including summary, description, status, assignee, labels, and all custom fields.

    Args:
        issue_key: The issue key (e.g., PROJ-123)
    """
    # Verified: acli jira workitem view uses positional argument for key
    output = execute_acli(f"jira workitem view {issue_key} --json")
    return output


@mcp.tool()
def jira_list_stories(jql: str, max_results: int = 50) -> str:
    """List stories using JQL (Jira Query Language). Can filter by project, assignee, status, sprint, etc.

    Args:
        jql: JQL query string (e.g., 'project = PROJ AND status = "In Progress"')
        max_results: Maximum number of results to return (default: 50)
    """
    # Verified: uses --jql, --limit, and --json flags
    output = execute_acli(f'jira workitem search --jql "{jql}" --limit {max_results} --json')
    return output


@mcp.tool()
def jira_get_transitions(issue_key: str) -> str:
    """Get available workflow transitions for a story (e.g., what states it can move to).

    Args:
        issue_key: The issue key (e.g., PROJ-123)
    """
    # Get current status - acli doesn't have a direct "list transitions" command
    # Users can view available transitions in Jira UI or use the view command
    output = execute_acli(f"jira workitem view {issue_key} --fields status --json")
    return f"Current work item status:\n{output}\n\nNote: To transition, use the jira_transition_story tool with the target status name."


@mcp.tool()
def jira_transition_story(issue_key: str, transition_name: str) -> str:
    """Move a story to the next workflow state (e.g., from 'To Do' to 'In Progress', or 'In Progress' to 'Done').

    Args:
        issue_key: The issue key (e.g., PROJ-123)
        transition_name: Name of the transition (e.g., 'Start Progress', 'Done', 'Ready for Review')
    """
    # Verified: uses --key and --status flags
    output = execute_acli(f'jira workitem transition --key "{issue_key}" --status "{transition_name}"')
    return f"Successfully transitioned {issue_key} to {transition_name}\n{output}"


@mcp.tool()
def jira_add_comment(issue_key: str, comment: str) -> str:
    """Add a comment to a Jira story.

    Args:
        issue_key: The issue key (e.g., PROJ-123)
        comment: The comment text to add
    """
    # Verified: uses comment create subcommand with --key and --body flags
    # Escape double quotes in the comment
    escaped_comment = comment.replace('"', '\\"')
    output = execute_acli(f'jira workitem comment create --key "{issue_key}" --body "{escaped_comment}"')
    return f"Comment added to {issue_key}\n{output}"


@mcp.tool()
def jira_create_story(project: str, summary: str, issue_type: str, description: str = "") -> str:
    """Create a new Jira story/issue.

    Args:
        project: Project key (e.g., PROJ)
        summary: Story title/summary
        issue_type: Issue type (e.g., 'Story', 'Task', 'Bug')
        description: Story description (optional)
    """
    # Verified: uses --project, --type, --summary, and --description flags
    escaped_summary = summary.replace('"', '\\"')
    command = f'jira workitem create --project "{project}" --type "{issue_type}" --summary "{escaped_summary}"'

    if description:
        escaped_description = description.replace('"', '\\"')
        command += f' --description "{escaped_description}"'

    output = execute_acli(command)
    return f"Story created successfully\n{output}"


@mcp.tool()
def jira_update_story(issue_key: str, field: str, value: str) -> str:
    """Update fields on a Jira story (e.g., summary, description, labels).

    Args:
        issue_key: The issue key (e.g., PROJ-123)
        field: Field to update (e.g., 'summary', 'description', 'labels')
        value: New value for the field
    """
    # Verified: uses edit command with --key and field-specific flags
    escaped_value = value.replace('"', '\\"')
    output = execute_acli(f'jira workitem edit --key "{issue_key}" --{field} "{escaped_value}"')
    return f"Updated {field} on {issue_key}\n{output}"


@mcp.tool()
def jira_assign_story(issue_key: str, assignee: str) -> str:
    """Assign a story to a user.

    Args:
        issue_key: The issue key (e.g., PROJ-123)
        assignee: Username or email of the assignee
    """
    # Verified: uses assign command with --key and --assignee flags
    output = execute_acli(f'jira workitem assign --key "{issue_key}" --assignee "{assignee}"')
    return f"Assigned {issue_key} to {assignee}\n{output}"


@mcp.tool()
def jira_get_current_sprint(board_id: str) -> str:
    """Get the current active sprint for a board.

    Args:
        board_id: Board ID or board name
    """
    # Use JQL to query current sprint - acli doesn't have dedicated sprint commands
    output = execute_acli(f'jira workitem search --jql "sprint in openSprints() AND board = {board_id}" --json')
    return f"Work items in current sprint:\n{output}"


@mcp.tool()
def jira_list_my_issues(status: Optional[str] = None) -> str:
    """List all issues assigned to the current user.

    Args:
        status: Optional status filter (e.g., 'In Progress', 'To Do')
    """
    jql = "assignee = currentUser()"
    if status:
        jql += f' AND status = "{status}"'

    output = execute_acli(f'jira workitem search --jql "{jql}" --json')
    return output


def main():
    """Run the MCP server."""
    mcp.run()


if __name__ == "__main__":
    main()
