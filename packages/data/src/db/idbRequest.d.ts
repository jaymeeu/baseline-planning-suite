/** Promise helpers around IndexedDB request APIs. */
export declare function requestToPromise<T>(request: IDBRequest<T>): Promise<T>;
export declare function transactionDone(transaction: IDBTransaction): Promise<void>;
