const core = require('@actions/core');
const github = require('@actions/github');
let axios = require('axios');

async function run() {
    try {
        const inputs = {
            jira_host: core.getInput('jira-host', {required: true}),
            jira_board: core.getInput('jira-board', {required: true}),
            jira_email: core.getInput('jira-email', {required: true}),
            jira_token: core.getInput('jira-token', {required: true}),
            jira_in_pr_id: core.getInput('jira-in-pr-id', {required: true}),
            github_token: core.getInput('github-token', {required: true}),
        }

        const {Octokit} = require("@octokit/rest");

        const request = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: github.context.payload.pull_request.number,
        }

        const title = github.context.payload.pull_request.title || '';


        if (title.toUpperCase().startsWith(inputs.jira_board)) {
            const formattedTitle = title.replace(inputs.jira_board + "-", "");
            let ticketNumberIndex = 1;
            while (!isNaN(formattedTitle.substring(0, ticketNumberIndex + 1))) {
                ticketNumberIndex++;
            }
            const ticketNumber = formattedTitle.substring(0, ticketNumberIndex);
            
            if(ticketNumber && ticketNumber.length >= 2) {
            
                const body = github.context.payload.pull_request.body || '';
                const ticket = `${inputs.jira_board}-${ticketNumber}`.trim();

                if(body.search("# Jira issue") === -1) {
                    const ticketUrl = `${inputs.jira_host}browse/${ticket}`;
                    request.body = `# Jira issue\n${ticketUrl}\n` + body;

                    const octokit = new Octokit({
                        auth: inputs.github_token
                    });
                    const response = await octokit.rest.pulls.update(request);
                }

                axios = axios.create({
                    baseURL: `${inputs.jira_host}rest/api/3/`,
                    auth: {
                        username: inputs.jira_email,
                        password: inputs.jira_token
                    }
                })

                // Get JIRA ticket
                const transitions = await axios.get(`issue/${ticket}/transitions`);

                const isPRTransitionAvailable = !!transitions.data.transitions.find(transition => transition.id == inputs.jira_in_pr_id);

                if(isPRTransitionAvailable) {
                    // Move ticket to "In PR"
                    await axios.post(`issue/${ticket}/transitions`, {
                        transition: {
                            id: inputs.jira_in_pr_id
                        }
                    });
                }
            }
        } else {
            core.info(`Ticket in title not found: ${inputs.jira_board}`);
        }

    } catch (error) {
        core.error(error)
        core.setFailed(error.message);
    }
}

run()
