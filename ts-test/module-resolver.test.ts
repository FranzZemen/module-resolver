import {CheckFunction} from '@franzzemen/execution-context';
import {ModuleResolution} from '@franzzemen/module-factory';
import chai from 'chai';
import Validator, {ValidationError, ValidationSchema} from 'fastest-validator';
import 'mocha';
import {isPromise} from 'util/types';
import {
  LoadPackageType,
  ModuleResolutionActionInvocation, ModuleResolutionResult, ModuleResolutionSetterInvocation,
  ModuleResolver,
  PendingModuleResolution
} from '../publish/index.js';
import {MyObject} from './my-object.js';



const should = chai.should();
const expect = chai.expect;

const unreachableCode = false;

describe('@franzzemen/module-resolver', () => {
  describe('module resolver tests', () => {
    describe('module-resolver.test', () => {
      describe('module resolution = json', () => {
        it('should load json with no schema check', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): true {
            testJsonObj = _jsonObj;
            refName = _refName;
            return true;
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON,
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '../../../testing/test-json.json',
                moduleResolution: ModuleResolution.json
              },
              loadPackageType: LoadPackageType.json
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          resolver.pendingAsync.should.be.false;
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            return resultOrPromise
              .then(values => {
                unreachableCode.should.be.true;
              });
          } else {
            refName.should.equal('myJSONObj');
            (typeof testJsonObj).should.equal('object');
            testJsonObj.name.should.exist;
            testJsonObj.id.should.equal(1);
            testJsonObj.name.should.equal('Franz');
            testJsonObj.id.should.exist;
          }
        });
        it('should load json with passing schema check', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): true {
            testJsonObj = _jsonObj;
            refName = _refName;
            return true;
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON, 
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '../../../testing/test-json.json',
                moduleResolution: ModuleResolution.json,
                loadSchema: {
                  validationSchema: {
                    name: {type: 'string'},
                    id: {type: 'number'}
                  },
                  useNewCheckerFunction: false
                }
              },
              loadPackageType: LoadPackageType.json
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            unreachableCode.should.be.true;
          } else {
            expect(resultOrPromise[0].loadingResult.error).to.be.undefined;
            resultOrPromise[0].loadingResult.resolved.should.be.true;
            resultOrPromise[0].setterResult.resolved.should.be.true;
            (typeof testJsonObj).should.equal('object');
            testJsonObj.name.should.exist;
            testJsonObj.id.should.equal(1);
            testJsonObj.name.should.equal('Franz');
            testJsonObj.id.should.exist;
          }

        });

        it('should load json with failing schema check', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): true {
            testJsonObj = _jsonObj;
            refName = _refName;
            return true;
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON,
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '../../../testing/test-json.json',
                moduleResolution: ModuleResolution.json,
                loadSchema: {
                  validationSchema: {
                    name: {type: 'string'},
                    id: {type: 'number'},
                    doIt: {type: 'string'}
                  },
                  useNewCheckerFunction: false
                }
              },
              loadPackageType: LoadPackageType.json
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            unreachableCode.should.be.true;
          } else {
            resultOrPromise.length.should.equal(1);
            const result = resultOrPromise[0];
            expect(result.loadingResult.error).to.exist;
            result.loadingResult.resolved.should.be.false;
          }
        });
        it('should load json with async schema check', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): true {
            testJsonObj = _jsonObj;
            refName = _refName;
            return true;
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON,
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '../../../testing/test-json.json',
                moduleResolution: ModuleResolution.json,
                loadSchema: {
                  validationSchema: {
                    $$async: true,
                    name: {type: 'string'},
                    id: {type: 'number'},
                    label: {
                      type: 'string',
                      custom: async (v, errors: ValidationError[]) => {
                        if (v !== 'A') {
                          errors.push({type: 'unique', actual: v, field: 'label', expected: 'A'});
                        }
                        return v;
                      }
                    }
                  },
                  useNewCheckerFunction: true
                }
              },
              loadPackageType: LoadPackageType.json
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            return resultOrPromise
              .then(values => {
                expect(values[0].loadingResult.error).to.be.undefined;
                values[0].setterResult.resolved.should.be.true;
                values[0].loadingResult.resolved.should.be.true;
                (typeof testJsonObj).should.equal('object');
                testJsonObj.name.should.exist;
                testJsonObj.id.should.equal(1);
                testJsonObj.name.should.equal('Franz');
                testJsonObj.id.should.exist;
              });
          } else {
            unreachableCode.should.be.true;
          }
        });
        it('should load json with async schema fail', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): true {
            testJsonObj = _jsonObj;
            refName = _refName;
            return true;
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON,
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '../../../testing/test-json.json',
                moduleResolution: ModuleResolution.json,
                loadSchema: {
                  validationSchema: {
                    $$async: true,
                    name: {type: 'string'},
                    id: {type: 'number'},
                    label: {
                      type: 'string',
                      custom: async (v, errors: ValidationError[]) => {
                        if (v !== 'B') {
                          errors.push({
                            type: 'unique',
                            actual: v,
                            field: 'label',
                            expected: 'B',
                            message: 'Wrong value for label'
                          });
                        }
                        return v;
                      }
                    }
                  },
                  useNewCheckerFunction: true
                }
              },
              loadPackageType: LoadPackageType.json
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            return resultOrPromise
              .then(values => {
                values.length.should.equal(1);
                const result = values[0];
                expect(result.loadingResult.error).to.exist;
                result.loadingResult.resolved.should.be.false;
              });
          } else {
            unreachableCode.should.be.true;
          }

        });

        it('should load json with compiled async check', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): true {
            testJsonObj = _jsonObj;
            refName = _refName;
            return true;
          }


          const schema: ValidationSchema = {
            $$async: true,
            name: {type: 'string'},
            id: {type: 'number'},
            label: {
              type: 'string',
              custom: async (v, errors: ValidationError[]) => {
                if (v !== 'A') {
                  errors.push({type: 'unique', actual: v, field: 'label', expected: 'A'});
                }
                return v;
              }
            }
          };
          const loadSchema: CheckFunction = (new Validator({useNewCustomCheckerFunction: true})).compile(schema);

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON,
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '../../../testing/test-json.json',
                moduleResolution: ModuleResolution.json,
                loadSchema
              },
              loadPackageType: LoadPackageType.json
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            resultOrPromise.then(values => {
              expect(values[0].loadingResult.error).to.be.undefined;
              values[0].setterResult.resolved.should.be.true;
              values[0].loadingResult.resolved.should.be.true;
              (typeof testJsonObj).should.equal('object');
              testJsonObj.name.should.exist;
              testJsonObj.id.should.equal(1);
              testJsonObj.name.should.equal('Franz');
              testJsonObj.id.should.exist;
            });
          } else {
            unreachableCode.should.be.true;
          }
        });
      });
      describe('loadPackageType=json and moduleResolution=es', () => {
        it('should resolve loading JSON from a package and setting an object', () => {
          class A {
            public jsonObj;
            refName: string;

            setJSON(refName, jsonObj) {
              this.jsonObj = jsonObj;
              this.refName = refName;
            }
          }

          const a = new A();
          const pendingResolution: PendingModuleResolution = {
            refName: 'myA',
            setter: {
              ownerIsObject: true,
              objectRef: a,
              _function: 'setJSON',
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '@franzzemen/test',
                propertyName: 'nestedJsonStr.jsonStr',
                moduleResolution: ModuleResolution.es
              },
              loadPackageType: LoadPackageType.json
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            return resultOrPromise
              .then(values => {
                values.length.should.equal(1);
                a.refName.should.equal('myA');
                values[0].loadingResult.resolvedObject['prop'].should.equal('jsonStr');
                ('prop' in a.jsonObj).should.be.true;
                a.jsonObj.prop.should.equal('jsonStr');
              }, err => {
                console.log(err);
                unreachableCode.should.be.false;
              });
          } else {
            unreachableCode.should.be.true;
          }
        });
        it('should resolve loading JSON from a package and setting an object with extra params [5,"abc"]', () => {
          class A {
            public jsonObj;
            public num;
            public str;

            setJSON(refName, jsonObj, result, aNum, aStr) {
              this.jsonObj = jsonObj;
              this.num = aNum;
              this.str = aStr;
            }
          }

          const a = new A();
          const pendingResolution: PendingModuleResolution = {
            refName: 'myA',
            setter: {
              ownerIsObject: true,
              objectRef: a,
              _function: 'setJSON',
              paramsArray: [5, 'abc'],
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '@franzzemen/test',
                propertyName: 'nestedJsonStr.jsonStr',
                moduleResolution: ModuleResolution.es
              },
              loadPackageType: LoadPackageType.json
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            return resultOrPromise
              .then(values => {
                values.length.should.equal(1);
                values[0].loadingResult.resolvedObject['prop'].should.equal('jsonStr');
                ('prop' in a.jsonObj).should.be.true;
                a.jsonObj.prop.should.equal('jsonStr');
                a.num.should.equal(5);
                a.str.should.equal('abc');
              }, err => {
                console.log(err);
                unreachableCode.should.be.false;
              });
          } else {
            unreachableCode.should.be.true;
          }
        });
        it('should resolve loading JSON from a package and setting a function', () => {
          let jsonObj;

          function setJSON(refName, _jsonObj): true {
            jsonObj = _jsonObj;
            return true;
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myA',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON,
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '@franzzemen/test',
                propertyName: 'nestedJsonStr.jsonStr',
                moduleResolution: ModuleResolution.es
              },
              loadPackageType: LoadPackageType.json
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            return resultOrPromise
              .then(values => {
                values.length.should.equal(1);
                values[0].loadingResult.resolvedObject['prop'].should.equal('jsonStr');
                jsonObj.prop.should.equal('jsonStr');
              }, err => {
                console.log(err);
                unreachableCode.should.be.false;
              });
          } else {
            unreachableCode.should.be.true;

          }
        });
        it('should resolve loading JSON from a package and setting a function with extra params [5,"abc"]', () => {
          let jsonObj;
          let num: number;
          let str: string;

          function setJSON(refName, _jsonObj, result, aNum, aStr): true {
            jsonObj = _jsonObj;
            num = aNum;
            str = aStr;
            return true;
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myA',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON,
              paramsArray: [5, 'abc'],
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '@franzzemen/test',
                propertyName: 'nestedJsonStr.jsonStr',
                moduleResolution: ModuleResolution.es
              },
              loadPackageType: LoadPackageType.json
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            return resultOrPromise
              .then(values => {
                values.length.should.equal(1);
                values[0].loadingResult.resolvedObject['prop'].should.equal('jsonStr');
                jsonObj.prop.should.equal('jsonStr');
                num.should.equal(5);
                str.should.equal('abc');
                resolver.clear();
                resolver.pendingResolutions.length.should.equal(0);
                resolver.moduleResolutionResults.length.should.equal(0);
              }, err => {
                console.log(err);
                unreachableCode.should.be.false;
              });
          } else {
            unreachableCode.should.be.true;
          }
        });
        describe('loadPackageType=object', () => {
          it('should load a via module function from es extended with successful schema check on moduleDef', () => {
            let obj;

            function setObj(refName, _obj): true {
              obj = _obj;
              return true;
            }

            const pendingResolution: PendingModuleResolution = {
              refName: 'myA',
              setter: {
                ownerIsObject: false,
                objectRef: undefined,
                _function: setObj,
                isAsync: false
              }
              ,
              loader: {
                module: {
                  moduleName: '../../../testing/extended.js',
                  functionName: 'create2',
                  moduleResolution: ModuleResolution.es,
                  loadSchema: {
                    validationSchema: {
                      name: {type: 'string'}
                    },
                    useNewCheckerFunction: true
                  }
                },
                loadPackageType: LoadPackageType.package
              }
            };
            const resolver = new ModuleResolver();
            resolver.add(pendingResolution);
            const resultOrPromise = resolver.resolve();
            if (isPromise(resultOrPromise)) {
              return resultOrPromise
                .then(values => {
                  values.length.should.equal(1);
                  const result = values[0];
                  expect(result.loadingResult.resolvedObject['name']).to.equal('Test');
                }, err => {
                  console.log(err);
                  unreachableCode.should.be.true;
                });
            } else {
              unreachableCode.should.be.true;
            }
          });
          it('should load promise via module default from commonjs bad-extended, for function name createAsyncFunc', () => {
            let obj;

            function setObj(refName, _obj): true {
              obj = _obj;
              return true;
            }

            const pendingResolution: PendingModuleResolution = {
              refName: 'myA',
              setter: {
                ownerIsObject: false,
                objectRef: undefined,
                _function: setObj,
                isAsync: false
              },
              loader: {
                module: {
                  moduleName: '../../../testing/bad-extended.cjs',
                  moduleResolution: ModuleResolution.commonjs,
                  functionName: 'createAsyncFunc',
                  asyncFactory: true
                },
                loadPackageType: LoadPackageType.package
              }
            };
            const resolver = new ModuleResolver();
            resolver.add(pendingResolution);
            resolver.pendingAsync.should.be.true;
            const resultOrPromise = resolver.resolve();
            if (isPromise(resultOrPromise)) {
              resultOrPromise.then(values => {
                values.length.should.equal(1);
                const result = values[0];
                expect(result.loadingResult.resolvedObject).to.equal(50);
              });
            } else {
              unreachableCode.should.be.true;

            }
          });
        });
        it('should invoke action', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): true {
            testJsonObj = _jsonObj;
            refName = _refName;
            return true;
          }

          let actionCount = 0;

          function action(allSuccess: boolean, ec): true {
            actionCount++;
            return true;
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON,
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '../../../testing/test-json.json',
                moduleResolution: ModuleResolution.json
              },
              loadPackageType: LoadPackageType.json
            },
            action: {
              dedupId: 'actionTest',
              _function: action,
              objectRef: undefined,
              ownerIsObject: false,
              isAsync: false
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            return resultOrPromise
              .then(values => {
                unreachableCode.should.be.true;
              });
          } else {
            refName.should.equal('myJSONObj');
            (typeof testJsonObj).should.equal('object');
            testJsonObj.name.should.exist;
            testJsonObj.id.should.equal(1);
            testJsonObj.name.should.equal('Franz');
            testJsonObj.id.should.exist;
            actionCount.should.equal(1);
          }
        });
        it('should invoke action only once', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): true {
            testJsonObj = _jsonObj;
            refName = _refName;
            return true;
          }

          let actionCount = 0;

          function action(allSuccess: boolean, ec): true {
            actionCount++;
            return true;
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON,
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '../../../testing/test-json.json',
                moduleResolution: ModuleResolution.json
              },
              loadPackageType: LoadPackageType.json
            },
            action: {
              dedupId: 'actionTest',
              _function: action,
              objectRef: undefined,
              ownerIsObject: false,
              isAsync: false
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          resolver.add(pendingResolution);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            return resultOrPromise
              .then(values => {
                unreachableCode.should.be.true;
              });
          } else {
            refName.should.equal('myJSONObj');
            (typeof testJsonObj).should.equal('object');
            testJsonObj.name.should.exist;
            testJsonObj.id.should.equal(1);
            testJsonObj.name.should.equal('Franz');
            testJsonObj.id.should.exist;
            actionCount.should.equal(1);
          }
        });
        it('should invoke action only once with independent action', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): true {
            testJsonObj = _jsonObj;
            refName = _refName;
            return true;
          }

          let actionCount = 0;

          function action(allSuccess: boolean, ec): true {
            actionCount++;
            return true;
          }


          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON,
              isAsync: false
            },
            loader: {
              module: {
                moduleName: '../../../testing/test-json.json',
                moduleResolution: ModuleResolution.json
              },
              loadPackageType: LoadPackageType.json
            },
            action: {
              dedupId: 'actionTest',
              _function: action,
              objectRef: undefined,
              ownerIsObject: false,
              isAsync: false
            }
          };
          const pendingResolution2: PendingModuleResolution = {
            refName: 'actionTest1',
            action: {
              dedupId: 'actionTest',
              _function: action,
              objectRef: undefined,
              ownerIsObject: false,
              isAsync: false
            }
          };
          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          resolver.add(pendingResolution);
          resolver.add(pendingResolution2);
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            return resultOrPromise
              .then(values => {
                unreachableCode.should.be.true;
              });
          } else {
            refName.should.equal('myJSONObj');
            (typeof testJsonObj).should.equal('object');
            testJsonObj.name.should.exist;
            testJsonObj.id.should.equal(1);
            testJsonObj.name.should.equal('Franz');
            testJsonObj.id.should.exist;
            actionCount.should.equal(1);
          }
        });
        it('should invoke action only once with independent action and async', () => {

          class SomeObject {
            myObject?: MyObject;
            count?: number;
          }

          const someObject = new SomeObject();

          const action: ModuleResolutionActionInvocation = (successfulResolution, obj: SomeObject, count: number) => {
            if (successfulResolution) {
              someObject.myObject = container.myObject;
              someObject.count = count;
            }
            return Promise.reject(new Error('true'));
          };

          const container: { myObject: MyObject } = {
            myObject: MyObject
          };

          const setter: ModuleResolutionSetterInvocation = (refName: string, result: MyObject, def: ModuleResolutionResult, name: string) => {
            container.myObject = result;
            container.myObject.name = name;
            return Promise.resolve(true);
          };

          const pendingResolution: PendingModuleResolution = {
            refName: 'FunObject',
            loader: {
              module: {
                moduleName: '../../../testing/my-object.js',
                functionName: 'myObjectFactory',
                moduleResolution: ModuleResolution.es
              },
              loadPackageType: LoadPackageType.package
            },
            setter: {
              ownerIsObject: false,
              _function: setter,
              paramsArray: ['FunObject'],
              isAsync: true
            },
            action: {
              _function: action,
              objectRef: undefined,
              ownerIsObject: false,
              paramsArray: [someObject, 5],
              isAsync: true
            }
          };

          const resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          resolver.pendingAsync.should.be.true;
          const resultOrPromise = resolver.resolve();
          if (isPromise(resultOrPromise)) {
            return resultOrPromise
              .then(result => {
                someObject.myObject.name.should.equal('FunObject');
                someObject.count.should.equal(5);
              });
          } else {
            unreachableCode.should.be.true;
          }
        });
      });
    });
  });
});
