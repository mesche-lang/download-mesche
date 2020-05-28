const path = require("path");
const core = require("@actions/core");
const github = require("@actions/github");
const tc = require('@actions/tool-cache');

async function downloadGambit() {
  const token = core.getInput('artifact-token', { required: true });
  const api = new github.GitHub(token);
  const [owner, repo] = core.getInput('repo').split('/');
  const localPath = core.getInput('localPath');

  const buildOptions = {
    owner,
    repo,
    os: core.getInput('os') || getDefaultOS(),
    arch: core.getInput('arch'),
    branch: core.getInput('branch'),
    workflowName:  core.getInput('workflow-name')
  };

  const artifactUrl = await getArtifactUrl(api, buildOptions);
  const downloadPath = await tc.downloadTool(artifactUrl, undefined, `token ${token}`);

  let fullPath = await tc.extractZip(downloadPath, localPath);
  if (!buildOptions.os.startsWith("win")) {
    const innerTarGzPath = path.join(fullPath, `gambit-${buildOptions.os}-${buildOptions.arch}.tar.gz`);
    console.log(`Extracting inner archive: ${innerTarGzPath}`)
    fullPath = await tc.extractTar(innerTarGzPath, localPath);
  }

  console.log(`Gambit build extracted to local path: ${fullPath}`);

  // Add folder to cache
  // https://github.com/actions/toolkit/tree/master/packages/tool-cache#cache

  // Add local Gambit directory to PATH for future steps
  core.addPath(path.join(fullPath, "bin"));
}

function getDefaultOS() {
  switch (process.platform) {
  case "linux":
    return "linux";
  case "darwin":
    return "macos";
  case "win32":
    return "win-msvc";
  default:
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

async function getArtifactUrl(api, options) {
  const { owner, repo, branch, os, arch, workflowName } = options;

  console.log(`Looking for workflows in repo: ${owner}/${repo}`);

  const workflows = await api.actions.listRepoWorkflows({
    owner,
    repo
  });

  const workflow = workflows.data.workflows.find(
    w => w.name === workflowName
  );

  if (!workflow) {
    throw new Error(`Repository '${owner}/${repo}' does not have a workflow named ${workflowName}.`);
  }

  console.log(`Found workflow named ${workflowName}`);

  const runs = await api.actions.listWorkflowRuns({
    owner,
    repo,
    branch,
    status: "completed",
    workflow_id: workflow.id
  });

  // Find the most recent successful run
  const latestRun = runs.data.workflow_runs.find(
    r => r.conclusion === "success"
  );

  if (!latestRun) {
    throw new Error(`Could not find a successful run for workflow ${workflowName} in repop ${owner}/${repo}.`);
  }

  console.log(`Found latest run: ${latestRun.id}`);

  const artifacts = await api.actions.listWorkflowRunArtifacts({
    owner,
    repo,
    run_id: latestRun.id
  });

  const artifactToFind = `gambit-${os}-${arch}`;
  const foundArtifact = artifacts.data.artifacts.find(
    a => a.name === artifactToFind
  );

  if (!foundArtifact) {
    throw new Error(`Could not find an artifact named 'artifactToFind' in the completed job.`);
  }

  console.log(`Found artifact URL: ${foundArtifact.archive_download_url}`);

  return foundArtifact.archive_download_url;
}

downloadGambit().catch(function (error) {
  core.setFailed(error.message);
});
