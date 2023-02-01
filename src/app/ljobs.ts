// export interface JobDef<DATA extends object, ARG> {
//     description: string,
//     action: ActionDef<DATA, ARG>,
//     data: undefined | DATA,
//     arg: ARG,
//     defer: {
//       resolve: () => void,
//       reject: (err: Error) => void,
//       promise: Promise<void>,
//     }
//   }
  //   function createJobs () {
//     return createLState({
//       initial: [] as Array<JobDef<any, any>>,
//       actions: (setter) => {
//         return {
//           handle<DATA extends object, ARG> (job: JobDef<DATA, ARG>) {
//             setter((state) => [...state, job])
//             job.action.reducer(job.data as any, job.arg)
//               .then(job.defer.resolve, job.defer.reject)
//               .finally(() => {
//                 setter((state) => state.filter((j) => j !== job))
//               })
//           }
//         }
//       }
//     })
//   }