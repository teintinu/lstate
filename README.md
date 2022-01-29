[![Node.js CI](https://github.com/teintinu/lstate/actions/workflows/test.yml/badge.svg)](https://github.com/teintinu/lstate/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/teintinu/lstate/badge.svg?branch=main)](https://coveralls.io/github/teintinu/lstate?branch=main)

# lstate
A simple, super-efficient and small (just 1.2kb) global state for React/Typescript applications

# install

```bash
npm install --save lstate
```

# usage

```typescript

import React from 'react';
import { createGlobalState, useGlobalState } from "./lstate";

const sample = createGlobalState({
    initial: {count: 1},
    reducers: (setter) => ({
        inc() {
            setter((old) => ({count: old.count + 1}))
        },
    })
})

export function App() {
  const { count } = useGlobalState(sample)
  return  <div className="App">
    <h1>Testing lstate</h1>
    <h2>A simple, efficient and small (just 2kb) global state for React applications</h2>
    <p>count: {count}</p>
    <button onClick={state.inc}>+</button>
  </div>
}
```
