import { deepCompare } from './deepCompare'

describe('deepCompare - partial properties', () => {
  function createPartialDeepCompareTest (a: any, b: any, op: number) {
    it(`should return ${op} when comparing ${JSON.stringify(a)} and ${JSON.stringify(b)}`, () => {
      let c = deepCompare(a, b, false)
      const msg = JSON.stringify({
        a,
        b,
        expect: op === 0 ? '==' : op === -1 ? '<' : '>',
        actual: c === 0 ? '==' : c === -1 ? '<' : '>'
      })
      if (c) { c = (c < 0 ? -1 : 1) }
      if (c !== op) { throw new Error(msg) }
    })
  }

  createPartialDeepCompareTest('a', 'a', 0)
  createPartialDeepCompareTest('a', 'aa', -1)
  createPartialDeepCompareTest('zz', 'z', 1)

  createPartialDeepCompareTest(undefined, undefined, 0)
  createPartialDeepCompareTest(undefined, 'a', -1)
  createPartialDeepCompareTest('a', undefined, 1)

  createPartialDeepCompareTest(null, null, 0)
  createPartialDeepCompareTest(null, 'a', -1)
  createPartialDeepCompareTest('a', null, 1)

  createPartialDeepCompareTest(1, 1, 0)
  createPartialDeepCompareTest(1, 10, -1)
  createPartialDeepCompareTest(10, 1, 1)

  createPartialDeepCompareTest(new Date(2016, 1, 28), new Date(2016, 1, 28), 0)
  createPartialDeepCompareTest(new Date(2015, 1, 28), new Date(2016, 1, 28), -1)
  createPartialDeepCompareTest(new Date(2016, 10, 28), new Date(2016, 2, 28), 1)

  createPartialDeepCompareTest('2015-01-28T00:00:00.00Z', new Date(2016, 2, 28), -1)
  createPartialDeepCompareTest('2016-10-28T00:00:00.00Z', new Date(2016, 2, 28), 1)

  createPartialDeepCompareTest(new Date(2016, 2, 28), '2015-01-28T00:00:00.00Z', 1)
  createPartialDeepCompareTest(new Date(2016, 2, 28), '2016-10-28T00:00:00.00Z', -1)

  createPartialDeepCompareTest(new Date(2016, 10, 28), {}, -1)
  createPartialDeepCompareTest({}, new Date(2016, 2, 28), 1)

  createPartialDeepCompareTest(false, false, 0)
  createPartialDeepCompareTest(true, true, 0)
  createPartialDeepCompareTest(false, true, -1)
  createPartialDeepCompareTest(true, false, 1)

  createPartialDeepCompareTest({}, {}, 0)
  createPartialDeepCompareTest({ x: 1 }, {}, 1)
  createPartialDeepCompareTest({ x: 1 }, { x: 1 }, 0)
  createPartialDeepCompareTest({ x: 1 }, { x: 2 }, -1)
  createPartialDeepCompareTest({ x: 1 }, { x: 1, y: 2 }, 0)
  createPartialDeepCompareTest({ x: 1, y: 3 }, { x: 1 }, 1)

  createPartialDeepCompareTest([], [], 0)
  createPartialDeepCompareTest([1], [], 1)
  createPartialDeepCompareTest([1], [1], 0)
  createPartialDeepCompareTest([1], [2], -1)
  createPartialDeepCompareTest([2], [1], 1)

  createPartialDeepCompareTest(() => 1, () => 2, 0)
})

describe('deepCompare - all properties', () => {
  function createFullDeepCompareTest (a: any, b: any, op: number) {
    it(`should return ${op} when comparing ${JSON.stringify(a)} and ${JSON.stringify(b)}`, () => {
      let c = deepCompare(a, b, true)
      const msg = JSON.stringify({
        a,
        b,
        expect: op === 0 ? '==' : op === -1 ? '<' : '>',
        actual: c === 0 ? '==' : c === -1 ? '<' : '>'
      })
      if (c) { c = (c < 0 ? -1 : 1) }
      if (c !== op) { throw new Error(msg) }
    })
  }

  createFullDeepCompareTest('a', 'a', 0)
  createFullDeepCompareTest('a', 'aa', -1)
  createFullDeepCompareTest('zz', 'z', 1)

  createFullDeepCompareTest(1, 1, 0)
  createFullDeepCompareTest(1, 10, -1)
  createFullDeepCompareTest(10, 1, 1)

  createFullDeepCompareTest(new Date(2016, 1, 28), new Date(2016, 1, 28), 0)
  createFullDeepCompareTest(new Date(2015, 1, 28), new Date(2016, 1, 28), -1)
  createFullDeepCompareTest(new Date(2016, 10, 28), new Date(2016, 2, 28), 1)

  createFullDeepCompareTest(false, false, 0)
  createFullDeepCompareTest(true, true, 0)
  createFullDeepCompareTest(false, true, -1)
  createFullDeepCompareTest(true, false, 1)

  createFullDeepCompareTest({}, {}, 0)
  createFullDeepCompareTest({ x: 1 }, { x: 1 }, 0)
  createFullDeepCompareTest({ x: 1 }, {}, 1)
  createFullDeepCompareTest({ x: 1 }, { x: 2 }, -1)
  createFullDeepCompareTest({ x: 1 }, { x: 1, y: 2 }, -1)
  createFullDeepCompareTest({ x: 1, y: 3 }, { x: 1 }, 1)
})
