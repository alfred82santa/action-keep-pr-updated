import * as core from '@actions/core'
import * as github from '@actions/github'
import { PullRequest } from './types.js'

function parseLabelsInput(input: string): string[] {
  return input
    .trim()
    .split(',')
    .map((label) => label.trim())
    .filter((label) => label.length > 0)
}

export class Config {
  constructor(
    public readonly owner: string,
    public readonly repo: string,
    public readonly githubToken: string,
    public readonly baseBranch: string,
    public readonly requiredLabels: string[] = [],
    public readonly requiredAutomerge: boolean = false,
    public readonly avoidedLabels: string[] = []
  ) {}

  static fromCoreInputs(): Config {
    const githubToken = core.getInput('github-token', { required: true })
    const baseBranch = core.getInput('base-branch', { required: true })
    const requiredLabels = core.getInput('required-labels')
      ? parseLabelsInput(core.getInput('required-labels'))
      : []
    const requiredAutomerge = core.getBooleanInput('required-automerge')
    const avoidedLabels = core.getInput('avoided-labels')
      ? parseLabelsInput(core.getInput('avoided-labels'))
      : []

    const owner = github.context.repo.owner
    const repo = github.context.repo.repo

    return new Config(
      owner,
      repo,
      githubToken,
      baseBranch,
      requiredLabels,
      requiredAutomerge,
      avoidedLabels
    )
  }

  toJSON(): object {
    return Object.fromEntries(
      Object.entries(this).map(([key, value]) =>
        key === 'githubToken' ? [key, '***'] : [key, value]
      )
    )
  }
}

export class PRResult {
  constructor(
    public readonly updated: PullRequest[] = [],
    public readonly failed: PullRequest[] = [],
    public readonly skipped: PullRequest[] = []
  ) {}

  public setOutputs(): void {
    core.setOutput(
      'pull-requests-updated',
      this.updated.map((pr) => pr.number)
    )
    core.setOutput(
      'pull-requests-failed',
      this.failed.map((pr) => pr.number)
    )
    core.setOutput(
      'pull-requests-skipped',
      this.skipped.map((pr) => pr.number)
    )
  }

  public report(): void {
    core.info(`Pull requests updated: ${this.updated.length}`)
    core.info(`Pull requests failed: ${this.failed.length}`)
    core.info(`Pull requests skipped: ${this.skipped.length}`)

    core.summary.addHeading(
      `Pull Request Updates Summary (${this.updated.length})`,
      2
    )
    if (this.updated.length === 0) {
      core.summary.addRaw('No pull requests were updated.')
    } else {
      core.summary.addList(
        this.updated.map((pr) => `[#${pr.number} ${pr.title}](${pr.html_url})`)
      )
    }

    core.summary.addHeading(
      `Failed Pull Request Updates (${this.failed.length})`,
      2
    )
    if (this.failed.length === 0) {
      core.summary.addRaw('No pull request updates failed.')
    } else {
      core.summary.addList(
        this.failed.map((pr) => `[#${pr.number} ${pr.title}](${pr.html_url})`)
      )
    }

    core.summary.addHeading(`Skipped Pull Requests (${this.skipped.length})`, 2)
    if (this.skipped.length === 0) {
      core.summary.addRaw('No pull requests were skipped.')
    } else {
      core.summary.addList(
        this.skipped.map((pr) => `[#${pr.number} ${pr.title}](${pr.html_url})`)
      )
    }
    core.summary.write()
  }
}
