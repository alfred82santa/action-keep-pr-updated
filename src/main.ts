import * as core from '@actions/core'
import { updatePullRequest } from './updatePullRequest.js'
import { Config } from './models.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const config: Config = Config.fromCoreInputs()

    core.debug(`Using config ${JSON.stringify(config)}...`)

    const result = await updatePullRequest(config)

    core.debug(`Action result: ${JSON.stringify(result)}...`)

    // Report results to summary
    result.report()
    // Set outputs for other workflow steps to use
    result.setOutputs()
  } catch (error) {
    core.error(`An error occurred while running the action: ${error}`)
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
    else core.setFailed(`An unknown error occurred: ${error}`)
  }
}
