import Logger from "../logger";
import { ClassMethod } from "./shared";

namespace Trace {
  export interface Options {
    label: string;
    message?: string;
  }
}

function Trace<This, Args extends unknown[], Return>(
  options: Trace.Options,
): (
  target: ClassMethod<This, Args, Return>,
  context: ClassMethodDecoratorContext<This, ClassMethod<This, Args, Return>>,
) => void | ClassMethod<This, Args, Return> {
  const logger = Logger.get();
  const { label, message } = options;

  return (target) =>
    function (this, ...args) {
      logger.debug(`${label} called`);
      const s = performance.now();
      try {
        const result = target.apply(this, args);
        if (result instanceof Promise) {
          return result
            .then((value) => {
              if (message) logger.debug(message);
              logger.debug(`${label} ended ${elapsed(s)}`);
              return value;
            })
            .catch((err) => {
              logger.error(`${label} threw`, err);
              throw err;
            }) as typeof result;
        }
        if (message) logger.debug(message);
        logger.debug(`${label} ended ${elapsed(s)}`);
        return result;
      } catch (err) {
        logger.error(`${label} threw`, err);
        throw err;
      }
    };
}

function elapsed(start: number): string {
  const ms = performance.now() - start;
  const formatted =
    ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`;
  return `(${formatted})`;
}

export default Trace;
