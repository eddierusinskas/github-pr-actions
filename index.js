const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
    try {
        const inputs = {
            host: core.getInput('jira-host', {required: true}),
            board: core.getInput('jira-board', {required: true}),
            token: core.getInput('repo-token', {required: true}),
        }

        const { Octokit } = require("@octokit/rest");

        const request = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: github.context.payload.pull_request.number,
        }

        const title = github.context.payload.pull_request.title || '';


        if(title.toUpperCase().startsWith(inputs.board)) {
            const formattedTitle = title.replace(inputs.board + "-", "");
            let ticketNumberIndex = 1;
            while (!isNaN(formattedTitle.substring(0, ticketNumberIndex + 1))) {
                ticketNumberIndex++;
            }
            const ticketNumber = formattedTitle.substring(0, ticketNumberIndex);
            const body = github.context.payload.pull_request.body || '';
            const ticket = `${inputs.host}browse/${inputs.board}-${ticketNumber}`;
            request.body = `# Jira ticket\n${ticket}\n` + body;
        }

        const octokit = new Octokit({
            auth: inputs.token
        });
        const response = await octokit.rest.pulls.update(request);

        core.info(`Response: ${response.status}`);
        if (response.status !== 200) {
            core.error('Updating the pull request has failed');
        }
    } catch (error) {
        core.error(error)
        core.setFailed(error.message);
    }
}

run()
