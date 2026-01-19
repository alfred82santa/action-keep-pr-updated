import * as core from '@actions/core'
import { getOctokit } from '@actions/github'
import { Config, PRResult } from './models.js'
import { ListPullsParams, PullRequest } from './types.js'

export class Action {
  private readonly PR_PER_PAGE = 30

  constructor(
    public readonly config: Config,
    private readonly octokit: ReturnType<typeof getOctokit>
  ) {}

  public async *listAllPullRequests(
    filterParams: Partial<ListPullsParams> = {}
  ): AsyncGenerator<PullRequest> {
    let response
    let page = 1
    do {
      response = await this.octokit.rest.pulls.list({
        per_page: this.PR_PER_PAGE,
        owner: this.config.owner,
        repo: this.config.repo,
        base: this.config.baseBranch,
        state: 'open',
        ...filterParams,
        page: page++
      })
      for (const pr of response.data) {
        core.info(`Found PR #${pr.number}: ${pr.title}`)
        core.info(` - Labels: ${pr.labels.map((l) => l.name).join(', ')}`)
        core.info(` - Auto-merge: ${pr.auto_merge ? 'enabled' : 'not enabled'}`)
        core.info(` - Base branch: ${pr.base.ref}`)

        yield pr
      }
    } while (response.headers.link?.includes('rel="next"'))
  }

  public async updatePullRequestBranch(prId: number): Promise<void> {
    const resp = await this.octokit.rest.pulls.updateBranch({
      owner: this.config.owner,
      repo: this.config.repo,
      pull_number: prId
    })

    if (resp.status < 200 || resp.status >= 300) {
      core.error(
        `Failed to update PR #${prId} branch: ${resp.status} - ${resp.data}`
      )
      core.error(JSON.stringify(resp))
      throw new Error(`Failed to update PR #${prId} branch: ${resp.status}`)
    }
  }

  public async invokeUpdatePullRequests(): Promise<PRResult> {
    const prsResult = new PRResult()

    for await (const pr of this.listAllPullRequests()) {
      if (this.config.requiredLabels.length > 0) {
        const prLabelNames = pr.labels.map((l) => l.name)
        const missingRequiredLabels = this.config.requiredLabels.filter(
          (name) => !prLabelNames.includes(name)
        )
        if (missingRequiredLabels.length !== 0) {
          core.info(
            `Skipping PR #${pr.number} because it has not some required labels: ${missingRequiredLabels.join(
              ', '
            )}`
          )
          prsResult.skipped.push(pr)
          continue
        }
      }
      if (this.config.avoidedLabels.length > 0) {
        const hasAvoidedLabel = pr.labels
          .map((l) => l.name)
          .filter((name) => this.config.avoidedLabels.includes(name))
        if (hasAvoidedLabel.length > 0) {
          core.info(
            `Skipping PR #${pr.number} because it has avoided labels: ${hasAvoidedLabel.join(
              ', '
            )}`
          )
          prsResult.skipped.push(pr)
          continue
        }
      }
      if (this.config.requiredAutomerge && pr.auto_merge === null) {
        core.info(`Skipping PR #${pr.number} because auto-merge is not enabled`)
        prsResult.skipped.push(pr)
        continue
      }

      core.info(`Updating PR #${pr.number} branch...`)
      try {
        await this.updatePullRequestBranch(pr.number)
        prsResult.updated.push(pr)
      } catch (error) {
        core.error(
          `Failed to update PR #${pr.number} branch: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
        prsResult.failed.push(pr)
      }
    }

    return prsResult
  }
}

export async function updatePullRequest(config: Config): Promise<PRResult> {
  const octokit = getOctokit(config.githubToken)

  const action = new Action(config, octokit)

  return action.invokeUpdatePullRequests()
}
