/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react-hooks'
import { createGlobalState, useGlobalState } from "./lstate";
import { defer, sleep } from 'pjobs'

const sample = createGlobalState({ 
  initial: {count: 0},
  reducers: (setter) => ({
      reset() {
        setter(() => ({count: 0}))
      },
      inc() {
        setter((old) => ({count: old.count + 1}))
      },
  })
})

describe("useGlobalState", () => {
  beforeEach(() => sample.reset())
  it("useState", async () => {
    const { result } = renderHook(() => useGlobalState(sample))
    expect(result.current).toEqual({count: 0})
  });
  it("inkove reducers", async () => {
    const { result, rerender } = renderHook(() => useGlobalState(sample))
    act(()=>{
      sample.inc()
    })
    expect(result.current).toEqual({count: 0})
    await act(async ()=>{
      await sleep(100)
    })
    expect(result.current).toEqual({count: 1})
  });

  // it("App loads with initial state of 0", async () => {
  //   const {container} = render(<SampleApp />);
  //   const val = container.querySelector("#val");
  //   expect(val && val.textContent).toEqual("0");
  // });

  // it("Increment buttons work", () => {
  //   const { container } = render(<SampleApp />);

  //   let val = container.querySelector("#val");
  //   expect(val && val.textContent).toEqual("0");

  //   const inc = container.querySelector("#inc");
  //   if (inc) fireEvent.click(inc)
  //   else throw new Error("inc button not found")

  //   val = container.querySelector("#val");
  //   expect(val && val.textContent).toEqual("1");
  // });
});
 