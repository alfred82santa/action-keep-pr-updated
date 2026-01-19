import type { updatePullRequest as updatePullRequestOriginal } from '../src/updatePullRequest'
import { jest } from '@jest/globals'

export const updatePullRequest = jest.fn<typeof updatePullRequestOriginal>()
