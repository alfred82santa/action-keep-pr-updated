import * as jest from 'jest-mock'
import * as github from '@actions/github'

import type { Octokit, PullRequest } from '../src/types'

export const context = {
  ...github.context,
  repo: {
    owner: 'test-owner',
    repo: 'test-repo'
  }
}

export const getOctokit = jest.fn<() => Octokit>()

export function pullRequestData(
  nmb: number = 1,
  labels: string[] = [],
  autoMerge: boolean = false
): PullRequest {
  return {
    id: nmb,
    number: nmb,
    title: 'Test PR',
    body: 'This is a test pull request',
    head: {
      ref: 'feature-branch',
      sha: 'abc123',
      repo: {}
    } as PullRequest['head'],
    base: { ref: 'main', sha: 'def456', repo: {} } as PullRequest['base'],
    user: {
      login: 'test-user',
      id: 123,
      type: 'User',
      name: 'Test User',
      events_url: ''
    } as PullRequest['user'],
    labels: labels.map((label, idx) => ({
      id: idx + 1,
      name: label,
      description: '',
      node_id: '',
      color: 'f29513',
      default: false,
      url: ''
    })),
    state: 'open',
    draft: false,
    author_association: 'CONTRIBUTOR',
    auto_merge: autoMerge
      ? {
          enabled_by: {
            login: 'test-user',
            id: 123,
            type: 'User',
            site_admin: false
          } as NonNullable<PullRequest['auto_merge']>['enabled_by'],
          merge_method: 'squash',
          commit_title: 'Auto-merged PR',
          commit_message: 'This PR was auto-merged'
        }
      : null
  } as PullRequest
}
