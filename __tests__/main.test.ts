/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.ts'
import { updatePullRequest } from '../__fixtures__/updatePullRequest.ts'
import { Config, PRResult } from '../__fixtures__/models.ts'
import { Config as ConfigOriginal } from '../src/models.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('../src/updatePullRequest.ts', () => ({
  updatePullRequest
}))

jest.unstable_mockModule('../src/models.ts', () => ({
  Config
}))

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.ts')

const mockPRResult = jest.mocked(PRResult.prototype)

describe('main.ts', () => {
  beforeEach(() => {
    Config.fromCoreInputs.mockReturnValue(
      new ConfigOriginal(
        'test-owner',
        'test-repo',
        'test-token',
        'main',
        [],
        false,
        []
      )
    )
    updatePullRequest.mockResolvedValue(mockPRResult)
    jest.spyOn(mockPRResult, 'setOutputs').mockImplementation(() => {})
    jest.spyOn(mockPRResult, 'report').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Successful process', async () => {
    await run()

    expect(Config.fromCoreInputs).toHaveBeenCalledTimes(1)
    expect(updatePullRequest).toHaveBeenCalledWith(
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
    expect(mockPRResult.setOutputs).toHaveBeenCalledTimes(1)
    expect(core.debug).toHaveBeenCalledWith(
      expect.stringMatching(
        /^Using config .*(?<=.*\*\*\*.*)(?<!.*test-token.*)$/
      )
    )

    expect(core.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Action result:/)
    )
  })

  it('Error on get inputs', async () => {
    Config.fromCoreInputs.mockImplementation(() => {
      throw new Error('Failed to get inputs')
    })

    await run()

    expect(Config.fromCoreInputs).toHaveBeenCalledTimes(1)

    expect(updatePullRequest).toHaveBeenCalledTimes(0)
    expect(mockPRResult.setOutputs).toHaveBeenCalledTimes(0)
    expect(core.setFailed).toHaveBeenCalledWith('Failed to get inputs')
    expect(core.error).toHaveBeenCalledWith(
      expect.stringMatching(/An error occurred while running the action:/)
    )
  })

  it('Error on update branches', async () => {
    updatePullRequest.mockImplementation(() => {
      throw new Error('Failed to update branches')
    })

    await run()

    expect(Config.fromCoreInputs).toHaveBeenCalledTimes(1)

    expect(updatePullRequest).toHaveBeenCalledWith(
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
    expect(mockPRResult.setOutputs).toHaveBeenCalledTimes(0)
    expect(core.debug).toHaveBeenCalledWith(
      expect.stringMatching(
        /^Using config .*(?<=.*\*\*\*.*)(?<!.*test-token.*)$/
      )
    )
    expect(core.setFailed).toHaveBeenCalledWith('Failed to update branches')
    expect(core.error).toHaveBeenCalledWith(
      expect.stringMatching(/An error occurred while running the action:/)
    )
  })

  it('Error string on update branches', async () => {
    updatePullRequest.mockImplementation(() => {
      throw 'Failed to update branches'
    })

    await run()

    expect(Config.fromCoreInputs).toHaveBeenCalledTimes(1)

    expect(updatePullRequest).toHaveBeenCalledWith(
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
    expect(mockPRResult.setOutputs).toHaveBeenCalledTimes(0)
    expect(core.debug).toHaveBeenCalledWith(
      expect.stringMatching(
        /^Using config .*(?<=.*\*\*\*.*)(?<!.*test-token.*)$/
      )
    )
    expect(core.setFailed).toHaveBeenCalledWith(
      'An unknown error occurred: Failed to update branches'
    )
    expect(core.error).toHaveBeenCalledWith(
      expect.stringMatching(/An error occurred while running the action:/)
    )
  })
})
