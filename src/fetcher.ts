/* eslint-disable no-use-before-define */
import { LCollection, LStateExtractCollection, Unscribe } from './lstate'

export interface FetcherCollections {
    [name: string]: LCollection<any>
}

export interface FetcherDecl<T extends FetcherCollections> {
    collections: T,
    ttl: number,
    subscribe<COL extends {id:string}>(collection: keyof T, query: Query<any>, subscription: (rows: COL[], loading: boolean) => void): Unscribe
}

export type Query<T extends {id:string}> = QueryById | QueryExpr<T>
export type QueryById = string
export type QueryOp = '='|'!='
export type QueryExpr<T extends {id:string}> = QueryExprOp<T> | QueryExprOr<T> | QueryExprAnd<T>
export type QueryExprOp<T extends {id:string}> = [keyof T, QueryOp, any]
export type QueryExprOr<T extends {id:string}> = {
    or: QueryExpr<T>[]
}
export type QueryExprAnd<T extends {id:string}> = {
    and: QueryExpr<T>[]
}

export interface CollectionFetcher<T extends LCollection<any>> {
    collection: T,
    subscribe(query: Query<LStateExtractCollection<T>>, fn: (items: T[], loading: boolean)=>void): Unscribe
    close(): Promise<void>
}

export function createFetcher<T extends FetcherCollections> (
  decl: FetcherDecl<T>): FetcherDef<T> {
  const cache: {[collection: string]: {[id: string]: any}} = {}
  const { collections, ttl } = decl
  const fetchers: FetcherDef<T> = {} as any
  for (const name in collections) {
    const collection = collections[name]
    const fetcher: CollectionFetcher<any> = {
      collection,
      open (query) {
        return open(name, collection, query)
      },
      close () {
        return close(name, collection)
      }
    }
    fetchers[name] = fetcher
  }
  return fetchers
  async function open(name: string, collection: LCollection<any>, query: string) {

  }
  function close(name: string, collection: LCollection<any>) {

  }
}
