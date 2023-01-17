const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
    try {
        const inputs = {
            host: core.getInput('jira-host', {required: true}),
            board: core.getInput('jira-board', {required: true}),
            token: core.getInput('repo-token', {required: true}),
        }

        const request = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: github.context.payload.pull_request.number,
        }

        // const body = github.context.payload.pull_request.body || '';
        const ticket = `${inputs.host}browse/${inputs.board}-999`;
        request.body = ({
            replace: `# Jira ticket\n${ticket}`
        })

        const octokit = github.getOctokit(inputs.token);
        const response = await octokit.pulls.update(request);

        core.info(`Response: ${response.status}`);
        if (response.status !== 200) {
            core.error('Updating the pull request has failed');
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}
