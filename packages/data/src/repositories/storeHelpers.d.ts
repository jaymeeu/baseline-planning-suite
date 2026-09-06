export declare function storeCount(db: IDBDatabase, storeName: string): Promise<number>;
export declare function storeGetAll<T>(db: IDBDatabase, storeName: string): Promise<T[]>;
export declare function storeGet<T>(db: IDBDatabase, storeName: string, id: string): Promise<T | undefined>;
export declare function storePut(db: IDBDatabase, storeName: string, value: unknown): Promise<void>;
export declare function storeDelete(db: IDBDatabase, storeName: string, id: string): Promise<void>;
export declare function storeGetAllFromIndex<T>(db: IDBDatabase, storeName: string, indexName: string, query: IDBValidKey | IDBKeyRange): Promise<T[]>;
export declare function storeClear(db: IDBDatabase, storeName: string): Promise<void>;
export declare function storePutAll(db: IDBDatabase, storeName: string, values: readonly unknown[]): Promise<void>;
