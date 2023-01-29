[![Node.js CI](https://github.com/teintinu/lstate/actions/workflows/test.yml/badge.svg)](https://github.com/teintinu/lstate/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/teintinu/lstate/badge.svg?branch=main)](https://coveralls.io/github/teintinu/lstate?branch=main)

# lstate
A simple, super-efficient and small (just 2.4kb) global state for React/Typescript applications. A greater alternative to redux, MobX, Zustand...

# install

```bash
npm install --save lstate
```

# usage

```typescript
// sample.ts

import React from 'react';
import { createLState, useLState } from "lstate";

export const sample = createLState({
    initial: {count: 0},
    reducers: (setter) => ({
        inc() {
            setter((old) => ({count: old.count + 1}))
        },
    })
})

export function App() {
  const { count } = useLState(sample)
  return  <div className="App">
    <h1>Testing lstate</h1>
    <h2>A simple, super-efficient and small (just 2.4kb) global state for React/Typescript applications</h2>
    <p>count: {count}</p>
    <button onClick={sample.inc}>+</button>
  </div>
}
```
[Click here to see a running demo](https://codesandbox.io/s/gallant-wind-ksplp?file=/src/state.ts)

# why?

LState was created with these directives:

- Reduce the boilerplate of UI external state
- Avoid unnecessary rendering
- Best Typescript integration

# Advanced features

## computed states

```typescript
// computed.ts
import React from 'react';
import { createLState, useLState } from "lstate";
import { sample } from './sample'

const double = createLState({
    default: {value: 0},
    deps: [sample],
    computed: (setter, [sampleState]) => ({
        setter((old) => ({count: sampleState.count * 2}))
    })
})
````

# collections of items

```typescript
// collection.ts
import React from 'react';
import { createLState, useLState } from "lstate";

interface Employee {
    _id: number
    name: string
    salary: number
}
const sampleEmployees: Employee[] = [
    { _id: 1, name: 'one', salary: 100 },
    { _id: 2, name: 'two', salary: 200 }
]

export employeeState = sample = createLState({
    id: '_id', // the id field of the collection
    items: sampleEmployees,
    reducers: ({ update }) => ({
        raiseSalary (id: number, amount:number) {
            update(id, (old) => ({ salary: (old.salary || 0) + amount }))
        }
    })
})

export function App() {
  const employees = useLState(employeeState)
  const specificEmployee = useLState(employeeState, 1)
  return  <div className="App">
    <h1>Testing lstate collections</h1>
    <div>
      listing all employees
      <ul>
      {employees.map( employee => (
        <li>{employee.id} {employee.name} {employee.salary}</li>
      ))}
      </ul>
    </div>
    <div>
      Specific employee salary = {employeeOne?.salary || 'not found'}
    </div>
    <button onClick={sample.inc}>raise salary of employee one</button>
  </div>
}
````
