const core = require('@actions/core');
const github = require('@actions/github');

try {
    const request = {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request.number,
    }

    const body = github.context.payload.pull_request.body || '';

    // request.body

    core.setOutput(body.indexOf("#JIRA Ticket\n..."));

} catch (error) {
    core.setFailed(error.message);
}