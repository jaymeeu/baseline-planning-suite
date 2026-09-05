export declare const PEOPLE_DB_NAME = "bps-people";
export declare const DELIVERY_DB_NAME = "bps-delivery";
export declare const DB_VERSION = 1;
export type PeopleStoreName = 'employees' | 'rates';
export type DeliveryStoreName = 'projects' | 'breakdownItems' | 'allocations';
export declare function openPeopleDatabase(): Promise<IDBDatabase>;
export declare function openDeliveryDatabase(): Promise<IDBDatabase>;
/** Empty People stores (avoids deleteDatabase hangs with open connections). */
export declare function clearPeopleDatabase(): Promise<void>;
/** Empty Delivery stores (avoids deleteDatabase hangs with open connections). */
export declare function clearDeliveryDatabase(): Promise<void>;
