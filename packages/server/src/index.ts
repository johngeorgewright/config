import { Data } from '@targetd/api'
import cors from 'cors'
import express from 'express'
import queryTypes from 'query-types'
import { z } from 'zod'
import { errorHandler } from './middleware/error'
import { StatusError } from './StatusError'

export function createServer<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape,
  StateValidators extends z.ZodRawShape,
  StateTargetingValidators extends z.ZodRawShape,
>(
  data:
    | Data<
        DataValidators,
        TargetingValidators,
        QueryValidators,
        FallThroughTargetingValidators,
        StateValidators,
        StateTargetingValidators
      >
    | (() => Data<
        DataValidators,
        TargetingValidators,
        QueryValidators,
        FallThroughTargetingValidators,
        StateValidators,
        StateTargetingValidators
      >),
) {
  const getData = typeof data === 'function' ? data : () => data

  return express()
    .use(cors())

    .get('/:name', queryTypes.middleware(), async (req, res, next) => {
      const data = getData()

      if (!(req.params.name in data.dataValidators)) {
        return next(
          new StatusError(404, `Unknown data property ${req.params.name}`),
        )
      }

      let payload: any
      try {
        payload = await data.getPayload(req.params.name, req.query as any)
      } catch (err) {
        return next(err)
      }
      if (payload === undefined) res.sendStatus(204)
      else res.json(payload)
    })

    .get('/', queryTypes.middleware(), async (req, res, next) => {
      let payloads: Record<string, any>
      try {
        payloads = await getData().getPayloadForEachName(req.query as any)
      } catch (err) {
        return next(err)
      }
      res.json(payloads)
    })

    .use(errorHandler())
}
