/*
Created by Franz Zemen 11/05/2022
License Type: MIT
*/
import {EnhancedError, logErrorAndReturn, logErrorAndThrow} from '@franzzemen/enhanced-error';
import {LogExecutionContext, LoggerAdapter} from '@franzzemen/logger-adapter';
import {loadFromModule, loadJSONFromModule, loadJSONResource, ModuleDefinition} from '@franzzemen/module-factory';


export enum FactoryType {
  jsonFile = 'jsonFile',
  jsonFactoryAttribute = 'jsonFactoryAttribute',
  moduleFactoryFunction = 'moduleFactoryFunction',
}

// If an error is encountered, it is expected that Promise.reject will be returned.
export type ModuleResolutionSetterInvocation = ((refName: string, result: any, def?: ModuleResolutionResult, ...params) => Promise<true>);
/**
 * Invoked once the resolver has resolved ALL module loads and setters
 * Only called if the any associated module load and any setter was successful for all identical dedup ids.
 * Be careful, "successfulResolution" indicates overall module resolver successful for all resolutions.  This action
 * is not invoked if "this" resolution loading or setting failed or any actions that have the same dedup id.
 *
 * If error an Error is expected or a Promise that resolves to one (Promise.reject)
 */
export type ModuleResolutionActionInvocation = (successfulResolution: boolean, ...params) => Promise<true>;


export interface ModuleResolutionInvocationSpecification<I> {
  // Whether this invocation is on an object or not
  ownerIsObject: boolean,
  // If an object, its reference
  objectRef?: any,
  // The invocation to call.  If the owner is an object, this will be the name of the matching method.  If it is not an
  // object, this will be the function itself (be careful when defining inline that your closures are what you want).
  _function: string | I,
  // Any parameters the function requires
  paramsArray?: any[]
}

export interface ModuleResolutionAction extends ModuleResolutionInvocationSpecification<ModuleResolutionActionInvocation> {
  /**
   * This is an id that if set will ensure all actions with this id execute only once.
   *
   * This can be helpful, for example, if one is initializing the same instance more than once
   * through an action; if sensitive state is involved one can use this unique id so that action occurs
   * only against that instance once.
   *
   * For example, if one is dynamically loading from a loop inside an object instance, and uses this method
   * to complete the loading process, it may or may not create adverse effects, but setting the same dedupId
   * will ensure the action is called only once, remembering that the action is called only once.
   */
  dedupId?: string,
}

export interface ModuleResolutionSetter extends ModuleResolutionInvocationSpecification<ModuleResolutionSetterInvocation> {
}

export interface ModuleResolutionLoader {
  /**
   * Module to be loaded and eventually resolved
   */
  module: ModuleDefinition;

  factoryType?: FactoryType;
}

export interface PendingModuleResolution {
  /**
   * This is the reference name to the resolution, and will be passed to the setter invocation, presumably to be used
   * as an id for a loaded item.  We're specifically constraining so that it isn't a function.  That could create tons of problems.
   */
  refName: BigInt | string | number | object;
  loader?: ModuleResolutionLoader;
  setter?: ModuleResolutionSetter;
  action?: ModuleResolutionAction;
}

export interface ModuleResolutionLoadingResult {
  // Loading successful
  resolved: boolean;
  resolvedObject?: any;
  error?: Error;
}

export interface ModuleResolutionSetterResult {
  // Field was successfully set
  resolved: boolean;
  error?: Error;
}

export interface ModuleResolutionActionResult {
  // Action successfully executed
  resolved: boolean;
  error?: Error;
}


export interface ModuleResolutionResult {
  resolution: PendingModuleResolution;
  loadingResult?: ModuleResolutionLoadingResult;
  setterResult?: ModuleResolutionSetterResult;
  actionResult?: ModuleResolutionActionResult;
}

export class ModuleResolver {
  pendingResolutions: PendingModuleResolution[] = [];
  moduleResolutionResults: ModuleResolutionResult[] = [];
  isResolving = false;

  // Simply a flag that remembers if resolutions contain async behavior.

  constructor() {
  }

  static resolutionsHaveErrors(results: ModuleResolutionResult[]): boolean {
    return results.some(result => result.loadingResult?.error || result.setterResult?.error || result.actionResult?.error);
  }

  private static invokeSetter(result: ModuleResolutionResult, ec?: LogExecutionContext): Promise<true> {
    const log = new LoggerAdapter(ec, 'module-resolver', 'index', 'invokeSetter');
    let setterResult: Promise<true>;
    if (result.resolution?.setter) {
      try {
        let paramsArray: any[];
        if (result.resolution.setter.paramsArray) {
          paramsArray = [result.resolution.refName, result.loadingResult.resolvedObject, result, ...result.resolution.setter.paramsArray];
        } else {
          paramsArray = [result.resolution.refName, result.loadingResult.resolvedObject, result];
        }
        setterResult = this.invoke<true>(result.resolution.setter, paramsArray, ec);
        return setterResult
          .then(trueVal => {
            result.setterResult = {
              resolved: true
            };
            return true;
          }, err => {
            log.warn(result, `Setter could not be successfully invoked`);
            logErrorAndReturn(err, log);
            result.setterResult = {
              resolved: false,
              error: err
            };
            return true;
          });
      } catch (err) {
        log.warn(result, `Setter could not be successfully invoked`);
        const enhancedError = logErrorAndReturn(err, log);
        result.setterResult = {
          resolved: false,
          error: enhancedError
        };
        Promise.reject(enhancedError);
      }
    } else {
      Promise.resolve(true);
    }
  }

  private static invoke<R>(spec: ModuleResolutionInvocationSpecification<any>, enhancedParamsArray: any[], ec?: LogExecutionContext): Promise<R> {
    const log = new LoggerAdapter(ec, 'module-resolver', 'index', 'invoke');
    if (spec.ownerIsObject === true && typeof spec._function !== 'string') {
      const err = new EnhancedError(`Invalid owner function ${spec._function} for ownerIsObject ${spec.ownerIsObject} - it should be a string (not a function)`);
      return Promise.reject(logErrorAndReturn(err, log));
    } else if (spec.ownerIsObject === false && typeof spec._function === 'string') {
      const err = new EnhancedError(`Invalid owner function ${spec._function} for ownerIsObject ${spec.ownerIsObject} - it should be a function (not a string)`);
      return Promise.reject(logErrorAndReturn(err, log));
    }
    let actionResult: Promise<R>;
    try {
      if (spec.ownerIsObject === true) {
        actionResult = spec.objectRef[spec._function as string](...enhancedParamsArray);
      } else {
        actionResult = (spec._function as ((...params) => Promise<R>))(...enhancedParamsArray);
      }
      return actionResult;
    } catch (err) {
      return Promise.reject(logErrorAndReturn(err, log));
    }
  }

  private static hasErrors(result: ModuleResolutionResult): boolean {
    return result.loadingResult?.error !== undefined || result.setterResult?.error !== undefined || result.actionResult?.error !== undefined;
  }

  hasPendingResolution(refName: string): boolean {
    return this.pendingResolutions.find(pendingResolution => pendingResolution.refName === refName) !== undefined;
  }

  hasPendingResolutions(): boolean {
    return (this.isResolving === true || this.pendingResolutions.length != this.moduleResolutionResults.length);
  }

  add(pendingResolution: PendingModuleResolution, ec?: LogExecutionContext) {
    if (this.isResolving) {
      logErrorAndThrow(new EnhancedError(`Cannot add while isResolving is ${this.isResolving}`), new LoggerAdapter(ec, 'module-resolver', 'index', 'add'));
    }
    if (!this.pendingResolutions) {
      this.pendingResolutions = [];
    }
    // At least one of loading or action needs to be defined.
    if (!pendingResolution.loader && !pendingResolution.action) {
      logErrorAndThrow(new EnhancedError(`At least one of either loader or action needs to be defined on PendingModuleResolution`));
    }
    this.pendingResolutions.push(pendingResolution);
  }

  resolve(ec?: LogExecutionContext): Promise<ModuleResolutionResult[]> {
    const log = new LoggerAdapter(ec, 'module-resolver', 'index', 'resolve');
    if (this.isResolving) {
      logErrorAndThrow(new EnhancedError(`Cannot launch resolve again while isResolving is ${this.isResolving}`), log);
    } else {
      this.isResolving = true;
    }
    if (!this.pendingResolutions || this.pendingResolutions.length === 0) {
      this.isResolving = false;
      return Promise.resolve([]);
    }
    if (!this.moduleResolutionResults) {
      this.moduleResolutionResults = [];
    }
    // The resolver may be resolving incrementally.  Only work on pending resolutions that haven't yet been resolved.
    let pendingResolutions: PendingModuleResolution[];
    let moduleResolutionResultPromises: Promise<ModuleResolutionResult>[] = [];
    let incremental = false;
    if (this.moduleResolutionResults.length > 0 && this.pendingResolutions.length > this.moduleResolutionResults.length) {
      pendingResolutions = this.pendingResolutions.slice(this.moduleResolutionResults.length - 1);
      incremental = true;
    } else {
      pendingResolutions = this.pendingResolutions;
    }
    pendingResolutions.forEach(pendingResolution => {
      let loadFunction: <T>(ModuleDefinition, LogExecutionContext) => Promise<T>;
      if (pendingResolution?.loader !== undefined) {
        if(pendingResolution.loader.factoryType === FactoryType.jsonFile) {
          loadFunction = loadJSONResource
        } else if (pendingResolution.loader.factoryType === FactoryType.jsonFactoryAttribute) {
          loadFunction =loadJSONFromModule
        } else {
          loadFunction = loadFromModule;
        }
        try {
          const loadResult = loadFunction<any>(pendingResolution.loader.module, ec);
          if (loadResult) {
            const moduleResolutionPromise = loadResult
              .then(obj => {
                const result: ModuleResolutionResult = {
                  resolution: pendingResolution,
                  loadingResult: {
                    resolved: true,
                    resolvedObject: obj
                  }
                };
                const setterResult = ModuleResolver.invokeSetter(result, ec);
                return setterResult
                  .then(trueVal => {
                    return result;
                  });
              }, err => {
                log.warn(pendingResolution, `Pending resolution could not be successfully resolved`);
                logErrorAndReturn(err, log);
                return ({
                  resolution: pendingResolution,
                  loadingResult: {
                    resolved: false,
                    error: err
                  }
                } as ModuleResolutionResult);
              });
            moduleResolutionResultPromises.push(moduleResolutionPromise);
          } else {
            // No result
            const result: ModuleResolutionResult | Promise<ModuleResolutionResult> = {
              resolution: pendingResolution,
              loadingResult: {
                resolved: true,
                resolvedObject: undefined
              }
            };
            const setterResult = ModuleResolver.invokeSetter(result, ec);
            const resultPromise = setterResult
              .then(trueVal => {
                result.setterResult = {
                  resolved: true
                };
                return result;
              });
            moduleResolutionResultPromises.push(resultPromise);
          }
        } catch (err) {
          log.warn(pendingResolution, `Pending resolution could not be successfully resolved`);
          logErrorAndReturn(err, log);
          moduleResolutionResultPromises.push(Promise.resolve({
            resolution: pendingResolution,
            loadingResult: {
              resolved: false,
              error: err
            }
          }));
        }
      } else if (pendingResolution.action !== undefined) {
        // If there was no loader, no result has been created yet.  Therefore we need to create a result to house the actions
        moduleResolutionResultPromises.push(Promise.resolve({resolution: pendingResolution}));
      }
    });
    if (moduleResolutionResultPromises.length > 0) {
      return Promise.all(moduleResolutionResultPromises)
        .then(moduleResolutionResults => {
          const actionResultOrPromise = this.invokeActions(moduleResolutionResults, ec);
          return actionResultOrPromise
            .then((trueVal: true) => {
              if (incremental) {
                this.moduleResolutionResults = this.moduleResolutionResults.concat(moduleResolutionResults);
              } else {
                this.moduleResolutionResults = moduleResolutionResults;
              }
              this.isResolving = false;
              return moduleResolutionResults;
            });
        }, err => {
          this.isResolving = false;
          return Promise.reject(logErrorAndReturn(err));
        });
    } else {
      this.isResolving = false;
      return Promise.resolve([]);
    }
  }


  clear(ec?: LogExecutionContext) {
    if (this.isResolving) {
      logErrorAndThrow(new EnhancedError(`Cannot clear while isResolving is ${this.isResolving}`), new LoggerAdapter(ec, 'module-resolver', 'index', 'add'));
    }
    this.pendingResolutions = [];
    this.moduleResolutionResults = [];
  }

  hasResolutionErrors(): boolean {
    return this.moduleResolutionResults.some(moduleResolutionResult => moduleResolutionResult.loadingResult?.error || moduleResolutionResult.setterResult?.error || moduleResolutionResult.actionResult?.error);
  }

  private invokeActions(moduleResolutionResults: (ModuleResolutionResult)[], ec?: LogExecutionContext): Promise<true> {
    const log = new LoggerAdapter(ec, 'module-resolver', 'index', 'invokeActions');
    if (moduleResolutionResults.length === 0) {
      Promise.resolve(true);
    }
    // Keep track of same actions and only invoke unique actions, including those that have errors
    const dedupSet: Set<string> = new Set<string>();
    // Actionable results will be invoked if there is an action and are no loading errors and no setter errors in the whole process as well as no duplicates
    // First filter out only those that have actions
    let actionableModuleResolutionResults: ModuleResolutionResult[] = moduleResolutionResults.filter(moduleResolutionResult => moduleResolutionResult.resolution?.action !== undefined);
    // Remove any that have errors associated with them, but remember that those actions were associated with errors
    actionableModuleResolutionResults = actionableModuleResolutionResults.filter(actionableModuleResolutionResult => {
      if (ModuleResolver.hasErrors(actionableModuleResolutionResult)) {
        dedupSet.add(actionableModuleResolutionResult.resolution.action.dedupId);
        return false;
      } else {
        return true;
      }
    });
    // Remove duplicates noting that we have to check against errors as well.
    actionableModuleResolutionResults = actionableModuleResolutionResults.filter(actionableModuleResolutionResult => {
      if (dedupSet.has(actionableModuleResolutionResult.resolution.action.dedupId)) {
        return false;
      } else {
        dedupSet.add(actionableModuleResolutionResult.resolution.action.dedupId);
        return true;
      }
    });
    if (actionableModuleResolutionResults.length === 0) {
      return Promise.resolve(true);
    }
    const overallSuccess = actionableModuleResolutionResults.length === moduleResolutionResults.length;
    let actionResult: Promise<true>;
    const actionResultsOrPromises: (Promise<true>)[] = [];
    actionableModuleResolutionResults.forEach(result => {
      try {
        let paramsArray: any[];
        if (result.resolution.action.paramsArray) {
          paramsArray = [overallSuccess, ...result.resolution.action.paramsArray];
        } else {
          paramsArray = [overallSuccess];
        }
        actionResult = ModuleResolver.invoke<true>(result.resolution.action, paramsArray, ec);
      } catch (err) {
        log.warn(result, `Action could not be successfully invoked`);
        logErrorAndReturn(err, log);
        result.actionResult = {
          resolved: false,
          error: err
        };
        return;
      }
      let promise: Promise<true> = actionResult
        .then(() => {
          result.actionResult = {
            resolved: true
          };
          return true;
        }, err => {
          log.warn(result, `Action could not be successfully invoked`);
          logErrorAndReturn(err, log);
          result.actionResult = {
            resolved: false,
            error: err
          };
          return true;
        });
      actionResultsOrPromises.push(promise);
    });
    return Promise.all(actionResultsOrPromises)
      .then(trueVal => {
        return true;
      });
  }
}
