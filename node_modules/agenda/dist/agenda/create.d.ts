import { Job, JobAttributesData } from "../job";
import { Agenda } from ".";
/**
 * Given a name and some data, create a new job
 * @name Agenda#create
 * @function
 * @param name name of job
 * @param data data to set for job
 */
export declare const create: <T extends JobAttributesData>(this: Agenda, name: string, data: T) => Job;
//# sourceMappingURL=create.d.ts.map