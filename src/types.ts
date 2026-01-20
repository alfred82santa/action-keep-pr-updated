import type {
  GetResponseDataTypeFromEndpointMethod,
  GetResponseTypeFromEndpointMethod
} from '@octokit/types'

export type Unpacked<T> = T extends (infer U)[] ? U : T

export type Octokit = ReturnType<typeof import('@actions/github').getOctokit>

export type ListPullsParams = Parameters<Octokit['rest']['pulls']['list']>[0]

export type ListPullsResponse = GetResponseTypeFromEndpointMethod<
  Octokit['rest']['pulls']['list']
>
export type ListPullsMethod = (
  params: ListPullsParams
) => Promise<ListPullsResponse>

export type PullRequest = Unpacked<
  GetResponseDataTypeFromEndpointMethod<Octokit['rest']['pulls']['list']>
>

export type UpdateBranchParams = Parameters<
  Octokit['rest']['pulls']['updateBranch']
>[0]
export type UpdateBranchResponse = GetResponseTypeFromEndpointMethod<
  Octokit['rest']['pulls']['updateBranch']
>
export type UpdateBranchMethod = (
  params: UpdateBranchParams
) => Promise<UpdateBranchResponse>
