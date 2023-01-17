const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

async function run() {
    try {
        const inputs = {
            jira_host: core.getInput('jira-host', {required: true}),
            jira_board: core.getInput('jira-board', {required: true}),
            jira_token: core.getInput('jira-token', {required: true}),
            github_token: core.getInput('repo-token', {required: true}),
        }

        const { Octokit } = require("@octokit/rest");

        const request = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: github.context.payload.pull_request.number,
        }

        const title = github.context.payload.pull_request.title || '';


        let ticket = null;
        if(title.toUpperCase().startsWith(inputs.jira_board)) {
            const formattedTitle = title.replace(inputs.jira_board + "-", "");
            let ticketNumberIndex = 1;
            while (!isNaN(formattedTitle.substring(0, ticketNumberIndex + 1))) {
                ticketNumberIndex++;
            }
            const ticketNumber = formattedTitle.substring(0, ticketNumberIndex);
            const body = github.context.payload.pull_request.body || '';
            let ticket = `${inputs.jira_board}-${ticketNumber}`;
            const ticketUrl = `${inputs.jira_host}browse/${ticket}`;
            request.body = `# Jira issue\n${ticketUrl}\n` + body;
        }

        if(ticket) {
            const octokit = new Octokit({
                auth: inputs.github_token
            });
            const response = await octokit.rest.pulls.update(request);

            axios.post(`${inputs.jira_host}/rest/api/3/issue/${ticket}/comment`, {
                body: "Pull Request has been opened: " + github.context.payload.pull_request.html_url
            });

            core.info(`Response: ${response.status}`);
            if (response.status !== 200) {
                core.error('Updating the pull request has failed');
            }
        }

    } catch (error) {
        core.error(error)
        core.setFailed(error.message);
    }
}

run()
