import * as Models from '../src/models'
import { jest } from '@jest/globals'

export const PRResult = jest.mocked(Models.PRResult)
export const Config = jest.mocked(Models.Config)
Config.fromCoreInputs = jest.fn()
