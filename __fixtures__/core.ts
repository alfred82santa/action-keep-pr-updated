import type * as core from '@actions/core'
import { jest } from '@jest/globals'

export const debug = jest.fn<typeof core.debug>((message) => {
  // Simulate core.debug by logging to console.debug
  console.debug(message)
})
export const error = jest.fn<typeof core.error>((message) => {
  // Simulate core.error by logging to console.error
  console.error(message)
})
export const info = jest.fn<typeof core.info>((message) => {
  // Simulate core.info by logging to console.log
  console.log(message)
})
export const getInput = jest.fn<typeof core.getInput>()
export const getBooleanInput = jest.fn<typeof core.getBooleanInput>()
export const setOutput = jest.fn<typeof core.setOutput>()
export const setFailed = jest.fn<typeof core.setFailed>()
export const warning = jest.fn<typeof core.warning>()
export const summary = {
  addHeading: jest.fn(),
  addRaw: jest.fn(),
  addList: jest.fn(),
  write: jest.fn()
} as unknown as typeof core.summary
