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
    filter: Partial<ListPullsParams> = {}
  ): AsyncGenerator<PullRequest> {
    let response
    let page = 1
    let requiredLabels: string[] = []
    if (this.config.requiredLabels.length > 0) {
      requiredLabels = this.config.requiredLabels
    }
    do {
      response = await this.octokit.rest.pulls.list({
        per_page: this.PR_PER_PAGE,
        owner: this.config.owner,
        repo: this.config.repo,
        base: this.config.baseBranch,
        state: 'open',
        labels: requiredLabels.join(','),
        ...filter,
        page: page++
      })
      for (const pr of response.data) {
        console.log(`Found PR #${pr.number}: ${pr.title}`)
        console.log(` - Labels: ${pr.labels.map((l) => l.name).join(', ')}`)
        console.log(
          ` - Auto-merge: ${pr.auto_merge ? 'enabled' : 'not enabled'}`
        )
        console.log(` - Draft: ${pr.draft ? 'yes' : 'no'}`)
        console.log(` - Base branch: ${pr.base.ref}`)

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

    if (!resp.status.toString().startsWith('2')) {
      console.error(
        `Failed to update PR #${prId} branch: ${resp.status} - ${resp.data}`
      )
      throw new Error(`Failed to update PR #${prId} branch: ${resp.status}`)
    }
  }

  public async invokeUpdatePullRequests(): Promise<PRResult> {
    const prsResult = new PRResult()

    for await (const pr of this.listAllPullRequests()) {
      if (this.config.avoidedLabels.length > 0) {
        const hasAvoidedLabel = pr.labels
          .map((l) => l.name)
          .some((name) => this.config.avoidedLabels.includes(name))
        if (hasAvoidedLabel) {
          prsResult.skipped.push(pr.number)
          continue
        }
      }
      if (this.config.requiredAutomerge && pr.auto_merge == null) {
        prsResult.skipped.push(pr.number)
        continue
      }
      try {
        await this.updatePullRequestBranch(pr.number)
        prsResult.updated.push(pr.number)
      } catch {
        prsResult.failed.push(pr.number)
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
