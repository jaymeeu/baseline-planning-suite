import type { WeeklyHours } from './types';
export declare function isWeeklyHours(value: number): value is WeeklyHours;
export declare function assertWeeklyHours(value: number): WeeklyHours;
export declare function allowedWeeklyHours(): readonly WeeklyHours[];
