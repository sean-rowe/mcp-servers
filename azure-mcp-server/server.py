#!/usr/bin/env python3
"""
Azure DevOps MCP Server - Integrates Azure DevOps with GitHub Copilot via Model Context Protocol.
Uses Azure CLI (az) to interact with Azure DevOps.
"""

import json
import subprocess
import sys
from typing import Optional

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("azure-devops-mcp-server")


def execute_az(command: str) -> str:
    """Execute an az CLI command and return the output."""
    try:
        result = subprocess.run(
            f"az {command}",
            shell=True,
            capture_output=True,
            text=True,
            check=True
        )
        # Filter out warnings from stderr
        if result.stderr and "WARNING" not in result.stderr:
            print(f"az stderr: {result.stderr}", file=sys.stderr)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Failed to execute az command: {e.stderr}") from e


@mcp.tool()
def azure_list_repos(organization: str, project: str) -> str:
    """List all repositories in an Azure DevOps project.

    Args:
        organization: Azure DevOps organization name
        project: Project name
    """
    output = execute_az(
        f'repos list --organization https://dev.azure.com/{organization} --project "{project}" --output json'
    )
    return output


@mcp.tool()
def azure_get_repo(organization: str, project: str, repository: str) -> str:
    """Get details about a specific repository.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
    """
    output = execute_az(
        f'repos show --organization https://dev.azure.com/{organization} --project "{project}" --repository "{repository}" --output json'
    )
    return output


@mcp.tool()
def azure_clone_repo(organization: str, project: str, repository: str) -> str:
    """Get the clone URL for a repository (you can then clone it with git clone).

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
    """
    repo_info = execute_az(
        f'repos show --organization https://dev.azure.com/{organization} --project "{project}" --repository "{repository}" --output json'
    )
    repo = json.loads(repo_info)
    remote_url = repo.get("remoteUrl", "")
    return f"Clone URL: {remote_url}\n\nTo clone, run:\ngit clone {remote_url}"


@mcp.tool()
def azure_create_pr(
    organization: str,
    project: str,
    repository: str,
    source_branch: str,
    target_branch: str,
    title: str,
    description: str = "",
    is_draft: bool = False
) -> str:
    """Create a pull request in Azure DevOps.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
        source_branch: Source branch name (without refs/heads/)
        target_branch: Target branch name (without refs/heads/, e.g., 'main' or 'develop')
        title: PR title
        description: PR description
        is_draft: Create as draft PR (default: false)
    """
    escaped_title = title.replace('"', '\\"')
    command = f'repos pr create --organization https://dev.azure.com/{organization} --project "{project}" --repository "{repository}" --source-branch "{source_branch}" --target-branch "{target_branch}" --title "{escaped_title}"'

    if description:
        escaped_description = description.replace('"', '\\"')
        command += f' --description "{escaped_description}"'
    if is_draft:
        command += ' --draft true'
    command += ' --output json'

    output = execute_az(command)
    return f"Pull request created successfully\n{output}"


@mcp.tool()
def azure_list_prs(
    organization: str,
    project: str,
    repository: str,
    status: str = "active",
    created_by: Optional[str] = None
) -> str:
    """List pull requests in a repository.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
        status: Filter by status: 'active', 'completed', 'abandoned', or 'all' (default: active)
        created_by: Filter by creator (use 'me' for current user)
    """
    command = f'repos pr list --organization https://dev.azure.com/{organization} --project "{project}" --repository "{repository}" --status {status}'
    if created_by:
        command += f' --creator "{created_by}"'
    command += ' --output json'

    output = execute_az(command)
    return output


@mcp.tool()
def azure_get_pr(organization: str, project: str, repository: str, pr_id: int) -> str:
    """Get detailed information about a pull request.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
        pr_id: Pull request ID
    """
    output = execute_az(
        f'repos pr show --organization https://dev.azure.com/{organization} --project "{project}" --repository "{repository}" --id {pr_id} --output json'
    )
    return output


@mcp.tool()
def azure_update_pr(
    organization: str,
    project: str,
    repository: str,
    pr_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    status: Optional[str] = None
) -> str:
    """Update a pull request (title, description, status).

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
        pr_id: Pull request ID
        title: New PR title
        description: New PR description
        status: Status: 'active', 'abandoned', 'completed'
    """
    command = f'repos pr update --organization https://dev.azure.com/{organization} --project "{project}" --repository "{repository}" --id {pr_id}'
    if title:
        escaped_title = title.replace('"', '\\"')
        command += f' --title "{escaped_title}"'
    if description:
        escaped_description = description.replace('"', '\\"')
        command += f' --description "{escaped_description}"'
    if status:
        command += f' --status {status}'
    command += ' --output json'

    output = execute_az(command)
    return f"PR updated successfully\n{output}"


@mcp.tool()
def azure_add_pr_reviewers(organization: str, project: str, repository: str, pr_id: int, reviewers: str) -> str:
    """Add reviewers to a pull request.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
        pr_id: Pull request ID
        reviewers: Comma-separated list of reviewer emails or IDs
    """
    output = execute_az(
        f'repos pr reviewer add --organization https://dev.azure.com/{organization} --project "{project}" --repository "{repository}" --id {pr_id} --reviewers {reviewers} --output json'
    )
    return f"Reviewers added to PR {pr_id}\n{output}"


@mcp.tool()
def azure_approve_pr(organization: str, project: str, repository: str, pr_id: int) -> str:
    """Approve a pull request.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
        pr_id: Pull request ID
    """
    output = execute_az(
        f'repos pr set-vote --organization https://dev.azure.com/{organization} --project "{project}" --repository "{repository}" --id {pr_id} --vote approve --output json'
    )
    return f"PR {pr_id} approved\n{output}"


@mcp.tool()
def azure_complete_pr(
    organization: str,
    project: str,
    repository: str,
    pr_id: int,
    delete_source_branch: bool = False,
    merge_strategy: Optional[str] = None
) -> str:
    """Complete (merge) a pull request.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
        pr_id: Pull request ID
        delete_source_branch: Delete source branch after merge (default: false)
        merge_strategy: Merge strategy: 'noFastForward', 'squash', 'rebase', 'rebaseMerge'
    """
    command = f'repos pr update --organization https://dev.azure.com/{organization} --project "{project}" --repository "{repository}" --id {pr_id} --status completed'
    if delete_source_branch:
        command += ' --delete-source-branch true'
    if merge_strategy:
        command += f' --merge-commit-message --squash {merge_strategy}'
    command += ' --output json'

    output = execute_az(command)
    return f"PR {pr_id} completed (merged)\n{output}"


@mcp.tool()
def azure_add_pr_comment(organization: str, project: str, repository: str, pr_id: int, comment: str) -> str:
    """Add a comment to a pull request.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
        pr_id: Pull request ID
        comment: Comment text
    """
    # Note: az repos pr comment create requires threadId, so we provide guidance
    escaped_comment = comment.replace('"', '\\"')
    return f'To add a comment to PR {pr_id}, use: az repos pr policy comment --organization https://dev.azure.com/{organization} --project "{project}" --id {pr_id} --comment "{escaped_comment}"'


@mcp.tool()
def azure_list_branches(organization: str, project: str, repository: str) -> str:
    """List branches in a repository.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
    """
    output = execute_az(
        f'repos ref list --organization https://dev.azure.com/{organization} --project "{project}" --repository "{repository}" --output json'
    )
    return output


@mcp.tool()
def azure_get_commits(
    organization: str,
    project: str,
    repository: str,
    branch: Optional[str] = None,
    top: int = 10
) -> str:
    """List recent commits in a repository.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        repository: Repository name
        branch: Branch name (optional)
        top: Number of commits to return (default: 10)
    """
    command = f'repos commit list --organization https://dev.azure.com/{organization} --project "{project}" --repository "{repository}" --top {top}'
    if branch:
        command += f' --branch "{branch}"'
    command += ' --output json'

    output = execute_az(command)
    return output


@mcp.tool()
def azure_get_build_status(organization: str, project: str, pipeline_id: Optional[int] = None) -> str:
    """Get build/pipeline status.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        pipeline_id: Pipeline ID (optional, if omitted lists recent builds)
    """
    command = f'pipelines build list --organization https://dev.azure.com/{organization} --project "{project}"'
    if pipeline_id:
        command += f' --definition-ids {pipeline_id}'
    command += ' --output json'

    output = execute_az(command)
    return output


@mcp.tool()
def azure_run_pipeline(organization: str, project: str, pipeline_id: int, branch: Optional[str] = None) -> str:
    """Trigger a pipeline run.

    Args:
        organization: Azure DevOps organization name
        project: Project name
        pipeline_id: Pipeline ID
        branch: Branch to run pipeline on (optional, defaults to default branch)
    """
    command = f'pipelines run --organization https://dev.azure.com/{organization} --project "{project}" --id {pipeline_id}'
    if branch:
        command += f' --branch "{branch}"'
    command += ' --output json'

    output = execute_az(command)
    return f"Pipeline {pipeline_id} triggered\n{output}"


@mcp.tool()
def azure_list_work_items(organization: str, project: str, wiql: str) -> str:
    """List work items using WIQL (Work Item Query Language).

    Args:
        organization: Azure DevOps organization name
        project: Project name
        wiql: WIQL query (e.g., 'SELECT [System.Id] FROM WorkItems WHERE [System.AssignedTo] = @Me')
    """
    escaped_wiql = wiql.replace('"', '\\"')
    output = execute_az(
        f'boards query --organization https://dev.azure.com/{organization} --project "{project}" --wiql "{escaped_wiql}" --output json'
    )
    return output


@mcp.tool()
def azure_get_work_item(organization: str, work_item_id: int) -> str:
    """Get details about a specific work item.

    Args:
        organization: Azure DevOps organization name
        work_item_id: Work item ID
    """
    output = execute_az(
        f'boards work-item show --organization https://dev.azure.com/{organization} --id {work_item_id} --output json'
    )
    return output


def main():
    """Run the MCP server."""
    print("Azure DevOps MCP Server running on stdio", file=sys.stderr)
    mcp.run()


if __name__ == "__main__":
    main()
