import Config from './Config'
import * as rt from 'runtypes'

let config: Config<any, any, any>

beforeEach(() => {
  config = Config.create()
    .useDataValidator('foo', rt.String)
    .usePredicate({
      name: 'weather',
      predicate: (q) => (t) => typeof q === 'string' && t.includes(q),
      validator: rt.Array(rt.String),
      queryValidator: rt.String,
    })
    .usePredicate({
      name: 'highTide',
      predicate: (q) => (t) => q === t,
      validator: rt.Boolean,
      queryValidator: rt.Boolean,
    })
    .addRules('foo', [
      {
        targeting: {
          weather: ['sunny'],
        },
        payload: '😎',
      },
      {
        targeting: {
          weather: ['rainy'],
        },
        payload: '☂️',
      },
      {
        targeting: {
          highTide: true,
        },
        payload: '🏄‍♂️',
      },
      {
        payload: 'bar',
      },
    ])
})

test('getPayload', () => {
  expect(config.getPayload('foo', {})).toBe('bar')
  expect(config.getPayload('foo', { weather: 'sunny' })).toBe('😎')
  expect(config.getPayload('foo', { weather: 'rainy' })).toBe('☂️')
  expect(config.getPayload('foo', { highTide: true })).toBe('🏄‍♂️')
})

test('payload runtype validation', () => {
  try {
    Config.create()
      .useDataValidator(
        'foo',
        rt.String.withConstraint((x) => x === 'bar' || 'Should be bar')
      )
      .addRules('foo', [
        {
          payload: 'rab',
        },
      ])
  } catch (error: any) {
    expect(error.details).toMatchInlineSnapshot(`
Object {
  "foo": Object {
    "rules": Array [
      "Expected { targeting?: {}; payload: string; } | { targeting?: {}; client: { targeting?: {}; payload: string; }[]; }, but was object",
    ],
  },
}
`)
    return
  }

  throw new Error('Didnt error correctly')
})
