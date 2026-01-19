/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.ts'
import * as github from '../__fixtures__/github.ts'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { Config, PRResult } = await import('../src/models.ts')

describe('models.ts - Config', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Create from input values simple', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'owner':
          return 'test-owner'
        case 'repo':
          return 'test-repo'
        case 'github-token':
          return 'test-token'
        case 'base-branch':
          return 'main'
        case 'required-labels':
          return ''
        case 'required-automerge':
          return 'false'
        case 'avoided-labels':
          return ''
        default:
          return ''
      }
    })
    core.getBooleanInput.mockImplementation((name: string) => {
      if (name === 'required-automerge') return false
      return false
    })

    const config = Config.fromCoreInputs()

    expect(config).toEqual(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        githubToken: 'test-token',
        baseBranch: 'main',
        requiredLabels: [],
        requiredAutomerge: false,
        avoidedLabels: []
      })
    )

    expect(core.getInput).toHaveBeenCalledTimes(4)
    expect(core.getBooleanInput).toHaveBeenCalledTimes(1)
  })

  it('Create from input values with labels and required automerge', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'owner':
          return 'test-owner'
        case 'repo':
          return 'test-repo'
        case 'github-token':
          return 'test-token'
        case 'base-branch':
          return 'main'
        case 'required-labels':
          return 'label1, label2 , label3'
        case 'required-automerge':
          return 'true'
        case 'avoided-labels':
          return 'label4, label5'
        default:
          return ''
      }
    })
    core.getBooleanInput.mockImplementation((name: string) => {
      if (name === 'required-automerge') return true
      return false
    })

    const config = Config.fromCoreInputs()

    expect(config).toEqual(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        githubToken: 'test-token',
        baseBranch: 'main',
        requiredLabels: ['label1', 'label2', 'label3'],
        requiredAutomerge: true,
        avoidedLabels: ['label4', 'label5']
      })
    )

    expect(core.getInput).toHaveBeenCalledTimes(6)
    expect(core.getBooleanInput).toHaveBeenCalledTimes(1)
  })

  it('Create from input values with rare labels', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'owner':
          return 'test-owner'
        case 'repo':
          return 'test-repo'
        case 'github-token':
          return 'test-token'
        case 'base-branch':
          return 'main'
        case 'required-labels':
          return ' '
        case 'required-automerge':
          return 'true'
        case 'avoided-labels':
          return ' , , , rare-label , , '
        default:
          return ''
      }
    })
    core.getBooleanInput.mockImplementation((name: string) => {
      if (name === 'required-automerge') return true
      return false
    })

    const config = Config.fromCoreInputs()

    expect(config).toEqual(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        githubToken: 'test-token',
        baseBranch: 'main',
        requiredLabels: [],
        requiredAutomerge: true,
        avoidedLabels: ['rare-label']
      })
    )

    expect(core.getInput).toHaveBeenCalledTimes(6)
    expect(core.getBooleanInput).toHaveBeenCalledTimes(1)
  })

  it('Create using defaults', async () => {
    const config = new Config('test-owner', 'test-repo', 'test-token', 'main')

    expect(config).toEqual(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        githubToken: 'test-token',
        baseBranch: 'main',
        requiredLabels: [],
        requiredAutomerge: false,
        avoidedLabels: []
      })
    )
  })

  it('Custom toJSON', async () => {
    const config = new Config(
      'test-owner',
      'test-repo',
      'test-token',
      'main',
      ['label1'],
      true,
      ['label2']
    )

    expect(config.toJSON()).toEqual(
      Object.fromEntries([
        ['owner', 'test-owner'],
        ['repo', 'test-repo'],
        ['githubToken', '***'],
        ['baseBranch', 'main'],
        ['requiredLabels', ['label1']],
        ['requiredAutomerge', true],
        ['avoidedLabels', ['label2']]
      ])
    )

    expect(JSON.stringify(config)).toEqual(
      '{"owner":"test-owner","repo":"test-repo","githubToken":"***","baseBranch":"main","requiredLabels":["label1"],"requiredAutomerge":true,"avoidedLabels":["label2"]}'
    )
  })
})

describe('models.ts - PRResult', () => {
  it('Create from input values simple', async () => {
    const result = new PRResult(
      [github.pullRequestData(1), github.pullRequestData(2)],
      [github.pullRequestData(3)],
      [github.pullRequestData(4), github.pullRequestData(5)]
    )

    result.setOutputs()

    expect(core.setOutput).toHaveBeenCalledTimes(3)
    expect(core.setOutput).toHaveBeenCalledWith('pull-requests-updated', [1, 2])
    expect(core.setOutput).toHaveBeenCalledWith('pull-requests-failed', [3])
    expect(core.setOutput).toHaveBeenCalledWith('pull-requests-skipped', [4, 5])
  })

  it('Create from input values empty', async () => {
    const result = new PRResult()

    result.setOutputs()

    expect(core.setOutput).toHaveBeenCalledTimes(3)
    expect(core.setOutput).toHaveBeenCalledWith('pull-requests-updated', [])
    expect(core.setOutput).toHaveBeenCalledWith('pull-requests-failed', [])
    expect(core.setOutput).toHaveBeenCalledWith('pull-requests-skipped', [])
  })

  it('Report results: empty', async () => {
    const result = new PRResult()

    result.report()

    expect(core.summary.addHeading).toHaveBeenNthCalledWith(
      1,
      'Pull Request Updates Summary (0)',
      2
    )
    expect(core.summary.addRaw).toHaveBeenNthCalledWith(
      1,
      'No pull requests were updated.'
    )
    expect(core.summary.addHeading).toHaveBeenNthCalledWith(
      2,
      'Failed Pull Request Updates (0)',
      2
    )
    expect(core.summary.addRaw).toHaveBeenNthCalledWith(
      2,
      'No pull request updates failed.'
    )
    expect(core.summary.addHeading).toHaveBeenNthCalledWith(
      3,
      'Skipped Pull Requests (0)',
      2
    )
    expect(core.summary.addRaw).toHaveBeenNthCalledWith(
      3,
      'No pull requests were skipped.'
    )

    expect(core.summary.addList).not.toHaveBeenCalled()

    expect(core.summary.write).toHaveBeenCalledTimes(1)
  })

  it('Report results: with data', async () => {
    const result = new PRResult(
      [github.pullRequestData(1), github.pullRequestData(2)],
      [github.pullRequestData(3)],
      [github.pullRequestData(4), github.pullRequestData(5)]
    )

    result.report()

    expect(core.summary.addHeading).toHaveBeenNthCalledWith(
      1,
      'Pull Request Updates Summary (2)',
      2
    )
    expect(core.summary.addList).toHaveBeenNthCalledWith(1, [
      '<a href="https://github.com/test-owner/test-repo/pull/1" target="_blank">:git-pull-request: #1 Test PR 1</a>',
      '<a href="https://github.com/test-owner/test-repo/pull/2" target="_blank">:git-pull-request: #2 Test PR 2</a>'
    ])
    expect(core.summary.addHeading).toHaveBeenNthCalledWith(
      2,
      'Failed Pull Request Updates (1)',
      2
    )
    expect(core.summary.addList).toHaveBeenNthCalledWith(2, [
      '<a href="https://github.com/test-owner/test-repo/pull/3" target="_blank">:git-pull-request: #3 Test PR 3</a>'
    ])
    expect(core.summary.addHeading).toHaveBeenNthCalledWith(
      3,
      'Skipped Pull Requests (2)',
      2
    )
    expect(core.summary.addList).toHaveBeenNthCalledWith(3, [
      '<a href="https://github.com/test-owner/test-repo/pull/4" target="_blank">:git-pull-request: #4 Test PR 4</a>',
      '<a href="https://github.com/test-owner/test-repo/pull/5" target="_blank">:git-pull-request: #5 Test PR 5</a>'
    ])

    expect(core.summary.addRaw).not.toHaveBeenCalled()

    expect(core.summary.write).toHaveBeenCalledTimes(1)
  })
})
