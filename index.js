const core = require('@actions/core');
const github = require('@actions/github');

module.exports = async function run() {
    try {
        const request = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: github.context.payload.pull_request.number,
        }

        // const body = github.context.payload.pull_request.body || '';
        const ticket = core.getInput("host") + "browse/" + core.getInput("board") + "-999";
        request.body = ({
            prefix: `# Jira ticket\n${ticket}`
        })

    } catch (error) {
        core.setFailed(error.message);
    }
}