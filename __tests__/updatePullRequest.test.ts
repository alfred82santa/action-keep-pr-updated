/**
 * Unit tests for the action's main functionality, src/updatePullRequest.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.ts'
import * as github from '../__fixtures__/github.ts'
import { Config } from '../src/models.ts'

import type {
  ListPullsMethod,
  ListPullsResponse,
  UpdateBranchMethod,
  UpdateBranchResponse
} from '../src/types.ts'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.

// prettier-ignore
const { updatePullRequest, Action } = await import(
  '../src/updatePullRequest.ts'
)

const octokit = {
  rest: {
    pulls: {
      list: jest.fn<ListPullsMethod>(),
      updateBranch: jest.fn<UpdateBranchMethod>()
    }
  }
}

describe('updatePullRequest.ts - updatePullRequest', () => {
  beforeEach(() => {
    ;(
      github.getOctokit as jest.MockedFunction<typeof github.getOctokit>
    ).mockReturnValue(
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )
    octokit.rest.pulls.list.mockReset().mockResolvedValue({
      status: 200 as const,
      data: [],
      headers: {},
      url: ''
    } as ListPullsResponse)
    octokit.rest.pulls.updateBranch.mockReset().mockResolvedValue({
      status: 202 as const,
      data: {},
      headers: {},
      url: ''
    } as UpdateBranchResponse)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Should perform action with no PRs', async () => {
    await updatePullRequest(
      new Config('owner', 'repo', 'token', 'main', [], false, [])
    )

    expect(github.getOctokit).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(0)
  })
  // Additional tests can be added here to cover more scenarios.
})

describe('updatePullRequest.ts - Action', () => {
  beforeEach(() => {
    octokit.rest.pulls.list.mockReset().mockResolvedValue({
      status: 200 as const,
      data: [],
      headers: {},
      url: ''
    } as ListPullsResponse)
    octokit.rest.pulls.updateBranch.mockReset().mockResolvedValue({
      status: 202 as const,
      data: {},
      headers: {},
      url: ''
    } as UpdateBranchResponse)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('List all pull requests: empty', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], false, []),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const prs = []
    for await (const pullRequest of action.listAllPullRequests()) {
      prs.push(pullRequest)
    }

    expect(prs).toHaveLength(0)
    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(0)
  })

  it('List all pull requests: one', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(1)],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], false, []),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const prs = []
    for await (const pullRequest of action.listAllPullRequests()) {
      prs.push(pullRequest)
    }

    expect(prs).toHaveLength(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(0)
  })

  it('List all pull requests: multiple pages', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(1)],
      headers: {
        link: '<https://api.github.com/repos/owner/repo/pulls?page=2>; rel="next"'
      },
      url: ''
    })

    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(2)],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], false, []),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const prs = []
    for await (const pullRequest of action.listAllPullRequests()) {
      prs.push(pullRequest)
    }

    expect(prs).toHaveLength(2)
    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(2)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 2
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(0)
  })

  it('List all pull requests: multiple pages (override parameters)', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(1)],
      headers: {
        link: '<https://api.github.com/repos/owner/repo/pulls?page=2>; rel="next"'
      },
      url: ''
    })

    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(2)],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], false, []),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const prs = []
    for await (const pullRequest of action.listAllPullRequests({
      base: 'develop',
      state: 'closed',
      owner: 'other_owner',
      repo: 'other_repo',
      per_page: 10
    })) {
      prs.push(pullRequest)
    }

    expect(prs).toHaveLength(2)
    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(2)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'develop',
      state: 'closed',
      owner: 'other_owner',
      repo: 'other_repo',
      per_page: 10,
      page: 1
    })
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'develop',
      state: 'closed',
      owner: 'other_owner',
      repo: 'other_repo',
      per_page: 10,
      page: 2
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(0)
  })

  it('Update PR: success', async () => {
    octokit.rest.pulls.updateBranch.mockResolvedValue({
      status: 202 as const,
      data: {},
      headers: {},
      url: ''
    } as UpdateBranchResponse)

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], false, []),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    await action.updatePullRequestBranch(1)

    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 1
    })
  })

  it('Update PR: error', async () => {
    octokit.rest.pulls.updateBranch.mockResolvedValue({
      status: 401 as const
    })

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], false, []),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    await expect(action.updatePullRequestBranch(1)).rejects.toThrow()

    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 1
    })
  })

  it('Invoke update all pull requests: No PRs', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], false, []),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const result = await action.invokeUpdatePullRequests()

    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(0)

    expect(result.updated).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
    expect(result.skipped).toHaveLength(0)
  })

  it('Invoke update all pull requests: One success', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(1)],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], false, []),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const result = await action.invokeUpdatePullRequests()

    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 1
    })

    expect(result.updated).toHaveLength(1)
    expect(result.updated.map((pr) => pr.number)).toContain(1)
    expect(result.failed).toHaveLength(0)
    expect(result.skipped).toHaveLength(0)
  })

  it('Invoke update all pull requests: One success required label', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(1, ['required-label'])],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config(
        'owner',
        'repo',
        'token',
        'main',
        ['required-label'],
        false,
        []
      ),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const result = await action.invokeUpdatePullRequests()

    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 1
    })

    expect(result.updated).toHaveLength(1)
    expect(result.updated.map((pr) => pr.number)).toContain(1)
    expect(result.failed).toHaveLength(0)
    expect(result.skipped).toHaveLength(0)
  })

  it('Invoke update all pull requests: One success no skip label', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(1)],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], false, ['skip-update']),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const result = await action.invokeUpdatePullRequests()

    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 1
    })

    expect(result.updated).toHaveLength(1)
    expect(result.updated.map((pr) => pr.number)).toContain(1)
    expect(result.failed).toHaveLength(0)
    expect(result.skipped).toHaveLength(0)
  })

  it('Invoke update all pull requests: One skipped because required label', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(1, [])],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config(
        'owner',
        'repo',
        'token',
        'main',
        ['required-label'],
        false,
        []
      ),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const result = await action.invokeUpdatePullRequests()

    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(0)
    expect(result.updated).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped.map((pr) => pr.number)).toContain(1)
  })

  it('Invoke update all pull requests: One skipped because skipped label', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(1, ['skip-update'])],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], false, ['skip-update']),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const result = await action.invokeUpdatePullRequests()

    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(0)
    expect(result.updated).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped.map((pr) => pr.number)).toContain(1)
  })

  it('Invoke update all pull requests: One skipped because no automerge', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(1, ['skip-update'])],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], true, []),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const result = await action.invokeUpdatePullRequests()

    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(0)
    expect(result.updated).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped.map((pr) => pr.number)).toContain(1)
  })

  it('Invoke update all pull requests: One success required auto merge', async () => {
    octokit.rest.pulls.list.mockResolvedValueOnce({
      status: 200 as const,
      data: [github.pullRequestData(1, [], true)],
      headers: {},
      url: ''
    })

    const action = new Action(
      new Config('owner', 'repo', 'token', 'main', [], true, []),
      octokit as unknown as ReturnType<typeof github.getOctokit>
    )

    const result = await action.invokeUpdatePullRequests()

    expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      base: 'main',
      state: 'open',
      owner: 'owner',
      repo: 'repo',
      per_page: 30,
      page: 1
    })
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 1
    })

    expect(result.updated).toHaveLength(1)
    expect(result.updated.map((pr) => pr.number)).toContain(1)
    expect(result.failed).toHaveLength(0)
    expect(result.skipped).toHaveLength(0)
  })

  it.each([
    { desc: 'string', error: 'Update failed' },
    { desc: 'exception', error: new Error('Update failed') }
  ])(
    'Invoke update all pull requests: One error ($desc)',
    async ({ error }) => {
      octokit.rest.pulls.list.mockResolvedValueOnce({
        status: 200 as const,
        data: [github.pullRequestData(1)],
        headers: {},
        url: ''
      })

      octokit.rest.pulls.updateBranch.mockRejectedValueOnce(error)

      const action = new Action(
        new Config('owner', 'repo', 'token', 'main', [], false, []),
        octokit as unknown as ReturnType<typeof github.getOctokit>
      )

      const result = await action.invokeUpdatePullRequests()

      expect(octokit.rest.pulls.list).toHaveBeenCalledTimes(1)
      expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
        base: 'main',
        state: 'open',
        owner: 'owner',
        repo: 'repo',
        per_page: 30,
        page: 1
      })
      expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(1)
      expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        pull_number: 1
      })

      expect(result.updated).toHaveLength(0)
      expect(result.failed).toHaveLength(1)
      expect(result.failed.map((pr) => pr.number)).toContain(1)
      expect(result.skipped).toHaveLength(0)
    }
  )
})
