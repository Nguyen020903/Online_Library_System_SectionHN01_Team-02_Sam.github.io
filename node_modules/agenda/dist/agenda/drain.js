"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.drain = void 0;
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default("agenda:drain");
/**
 * Clear the interval that processes the jobs
 * @name Agenda#drain
 * @function
 * @returns resolves when all running jobs completes
 */
const drain = function () {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            debug("Agenda.drain called, clearing interval for processJobs()");
            clearInterval(this._processInterval);
            this._processInterval = undefined;
            if (this._runningJobs.length === 0) {
                resolve();
            }
            else {
                debug("Agenda.drain waiting for jobs to finish");
                this.on('complete', () => {
                    // running jobs are removed after the event
                    if (this._runningJobs.length === 1) {
                        resolve();
                    }
                });
            }
        });
    });
};
exports.drain = drain;
//# sourceMappingURL=drain.js.map