import { Agenda } from ".";
import { Job, JobAttributesData } from "../job";
/**
 * Schedule a job or jobs at a specific time
 * @name Agenda#schedule
 * @function
 * @param when when the job gets run
 * @param names array of job names to run
 * @param data data to send to job
 * @returns job or jobs created
 */
export declare function schedule<T extends JobAttributesData>(this: Agenda, when: string | Date, names: string, data: T): Promise<Job>;
export declare function schedule<T extends JobAttributesData>(this: Agenda, when: string | Date, names: string[], data: T): Promise<Job[]>;
//# sourceMappingURL=schedule.d.ts.map