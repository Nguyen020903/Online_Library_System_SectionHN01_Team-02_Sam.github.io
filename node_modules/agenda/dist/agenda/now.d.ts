import { Agenda } from ".";
import { Job, JobAttributesData } from "../job";
/**
 * Create a job for this exact moment
 * @name Agenda#now
 * @function
 * @param name name of job to schedule
 * @param data data to pass to job
 */
export declare const now: <T extends JobAttributesData>(this: Agenda, name: string, data: T) => Promise<Job>;
//# sourceMappingURL=now.d.ts.map