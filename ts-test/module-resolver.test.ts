import {CheckFunction} from '@franzzemen/execution-context';
import {
  FactoryType,
  ModuleResolutionActionInvocation,
  ModuleResolutionSetterInvocation,
  ModuleResolver,
  PendingModuleResolution
  // @ts-ignore
} from '@franzzemen/module-resolver';
import chai from 'chai';
import Validator, {ValidationError, ValidationSchema} from 'fastest-validator';
import 'mocha';
import type {ModuleResolutionResult, ModuleResolver as Resolver} from '../publish';
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

          function setJSON(_refName: string, _jsonObj): Promise<true> {
            testJsonObj = _jsonObj;
            refName = _refName;
            return Promise.resolve(true);
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON
            },
            loader: {
              module: {
                moduleName: './testing-mjs/test-json.json'
              },
              factoryType: FactoryType.jsonFile
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();

          return resultPromise
            .then(values => {
              refName.should.equal('myJSONObj');
              (typeof testJsonObj).should.equal('object');
              testJsonObj.name.should.exist;
              testJsonObj.id.should.equal(1);
              testJsonObj.name.should.equal('Franz');
              testJsonObj.id.should.exist;
            });
        });
        it('should load json with passing schema check', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): Promise<true> {
            testJsonObj = _jsonObj;
            refName = _refName;
            return Promise.resolve(true);
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON
            },
            loader: {
              module: {
                moduleName: './testing-mjs/test-json.json',
                loadSchema: {
                  validationSchema: {
                    name: {type: 'string'},
                    id: {type: 'number'}
                  },
                  useNewCheckerFunction: false
                }
              },
              factoryType: FactoryType.jsonFile
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then(result => {
              expect(result[0].loadingResult.error).to.be.undefined;
              result[0].loadingResult.resolved.should.be.true;
              result[0].setterResult.resolved.should.be.true;
              (typeof testJsonObj).should.equal('object');
              testJsonObj.name.should.exist;
              testJsonObj.id.should.equal(1);
              testJsonObj.name.should.equal('Franz');
              testJsonObj.id.should.exist;
            });
        });

        it('should load json with failing schema check', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): Promise<true> {
            testJsonObj = _jsonObj;
            refName = _refName;
            return Promise.resolve(true);
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON
            },
            loader: {
              module: {
                moduleName: './testing-mjs/test-json.json',
                loadSchema: {
                  validationSchema: {
                    name: {type: 'string'},
                    id: {type: 'number'},
                    doIt: {type: 'string'}
                  },
                  useNewCheckerFunction: false
                }
              },
              factoryType: FactoryType.jsonFile
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then(result => {
              result.length.should.equal(1);
              const result1 = result[0];
              expect(result1.loadingResult.error).to.exist;
              result1.loadingResult.resolved.should.be.false;
            });
        });
        it('should load json with async schema check', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): Promise<true> {
            testJsonObj = _jsonObj;
            refName = _refName;
            return Promise.resolve(true);
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON
            },
            loader: {
              module: {
                moduleName: './testing-mjs/test-json.json',
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
              factoryType: FactoryType.jsonFile
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then(result => {
              expect(result[0].loadingResult.error).to.be.undefined;
              result[0].loadingResult.resolved.should.be.true;
              result[0].setterResult.resolved.should.be.true;
              (typeof testJsonObj).should.equal('object');
              testJsonObj.name.should.exist;
              testJsonObj.id.should.equal(1);
              testJsonObj.name.should.equal('Franz');
              testJsonObj.id.should.exist;
            });
        });
        it('should load json with async schema fail', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): Promise<true> {
            testJsonObj = _jsonObj;
            refName = _refName;
            return Promise.resolve(true);
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON
            },
            loader: {
              module: {
                moduleName: './testing-mjs/test-json.json',
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
              factoryType: FactoryType.jsonFile
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then(result => {
              result.length.should.equal(1);
              const result1 = result[0];
              expect(result1.loadingResult.error).to.exist;
              result1.loadingResult.resolved.should.be.false;
            });
        });

        it('should load json with compiled async check', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): Promise<true> {
            testJsonObj = _jsonObj;
            refName = _refName;
            return Promise.resolve(true);
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
              _function: setJSON
            },
            loader: {
              module: {
                moduleName: './testing-mjs/test-json.json',
                loadSchema
              },
              factoryType: FactoryType.jsonFile
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then(result => {
              expect(result[0].loadingResult.error).to.be.undefined;
              result[0].loadingResult.resolved.should.be.true;
              result[0].setterResult.resolved.should.be.true;
              (typeof testJsonObj).should.equal('object');
              testJsonObj.name.should.exist;
              testJsonObj.id.should.equal(1);
              testJsonObj.name.should.equal('Franz');
              testJsonObj.id.should.exist;
            });
        });
      });
      describe('factoryType=json and moduleResolution=es', () => {
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
              _function: 'setJSON'
            },
            loader: {
              module: {
                moduleName: '@franzzemen/test',
                propertyName: 'nestedJsonStr.jsonStr'
              },
              factoryType: FactoryType.jsonFactoryAttribute
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then((values: ModuleResolutionResult[]) => {
              values.length.should.equal(1);
              a.refName.should.equal('myA');
              values[0].loadingResult.resolvedObject['prop'].should.equal('jsonStr');
              ('prop' in a.jsonObj).should.be.true;
              a.jsonObj.prop.should.equal('jsonStr');
            }, err => {
              console.log(err);
              unreachableCode.should.be.false;
            });
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
              paramsArray: [5, 'abc']
            },
            loader: {
              module: {
                moduleName: '@franzzemen/test',
                propertyName: 'nestedJsonStr.jsonStr'
              },
              factoryType: FactoryType.jsonFactoryAttribute
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then((values: ModuleResolutionResult[]) => {
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
        });
        it('should resolve loading JSON from a package and setting a function', () => {
          let jsonObj;

          function setJSON(refName, _jsonObj): Promise<true> {
            jsonObj = _jsonObj;
            return Promise.resolve(true);
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myA',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON
            },
            loader: {
              module: {
                moduleName: '@franzzemen/test',
                propertyName: 'nestedJsonStr.jsonStr'
              },
              factoryType: FactoryType.jsonFactoryAttribute
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then((values: ModuleResolutionResult[]) => {
              values.length.should.equal(1);
              values[0].loadingResult.resolvedObject['prop'].should.equal('jsonStr');
              jsonObj.prop.should.equal('jsonStr');
            }, err => {
              console.log(err);
              unreachableCode.should.be.false;
            });
        });
        it('should resolve loading JSON from a package and setting a function with extra params [5,"abc"]', () => {
          let jsonObj;
          let num: number;
          let str: string;

          function setJSON(refName, _jsonObj, result, aNum, aStr): Promise<true> {
            jsonObj = _jsonObj;
            num = aNum;
            str = aStr;
            return Promise.resolve(true);
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myA',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON,
              paramsArray: [5, 'abc']
            },
            loader: {
              module: {
                moduleName: '@franzzemen/test',
                propertyName: 'nestedJsonStr.jsonStr'
              },
              factoryType: FactoryType.jsonFactoryAttribute
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then((values: ModuleResolutionResult[]) => {
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
        });
        describe('factoryType=object', () => {
          it('should load a via module function from es extended with successful schema check on moduleDef', () => {
            let obj;

            function setObj(refName, _obj): Promise<true> {
              obj = _obj;
              return Promise.resolve(true);
            }

            const pendingResolution: PendingModuleResolution = {
              refName: 'myA',
              setter: {
                ownerIsObject: false,
                objectRef: undefined,
                _function: setObj
              }
              ,
              loader: {
                module: {
                  moduleName: './testing-mjs/extended.js',
                  functionName: 'create2',
                  loadSchema: {
                    validationSchema: {
                      name: {type: 'string'}
                    },
                    useNewCheckerFunction: true
                  }
                },
                factoryType: FactoryType.moduleFactoryFunction
              }
            };
            const resolver: Resolver = new ModuleResolver();
            resolver.add(pendingResolution);
            const resultPromise = resolver.resolve();
            return resultPromise
              .then((values: ModuleResolutionResult[]) => {
                values.length.should.equal(1);
                const result = values[0];
                expect(result.loadingResult.resolvedObject['name']).to.equal('Test');
              }, err => {
                console.log(err);
                unreachableCode.should.be.true;
              });
          });
          /*
                    it('should load promise via module default from commonjs bad-extended, for function name createAsyncFunc', () => {
                      let obj;

                      function setObj(refName, _obj): Promise<true> {
                        obj = _obj;
                        return Promise.resolve(true);
                      }

                      const pendingResolution: PendingModuleResolution = {
                        refName: 'myA',
                        setter: {
                          ownerIsObject: false,
                          objectRef: undefined,
                          _function: setObj
                        },
                        loader: {
                          module: {
                            moduleName: './testing-mjs/bad-extended.cjs',
                            functionName: 'createAsyncFunc',
                            asyncFactory: true
                          },
                          factoryType: FactoryType.package
                        }
                      };
                      const resolver: Resolver = new ModuleResolver();
                      resolver.add(pendingResolution);
                      const resultPromise = resolver.resolve();
                      return resultPromise.then((values: ModuleResolutionResult[]) => {
                        values.length.should.equal(1);
                        const result = values[0];
                        expect(result.loadingResult.resolvedObject).to.equal(50);
                      });
                    });

           */
        });
        it('should invoke action', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): Promise<true> {
            testJsonObj = _jsonObj;
            refName = _refName;
            return Promise.resolve(true);
          }

          let actionCount = 0;

          function action(allSuccess: boolean, ec): Promise<true> {
            actionCount++;
            return Promise.resolve(true);
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON
            },
            loader: {
              module: {
                moduleName: './testing-mjs/test-json.json'
              },
              factoryType: FactoryType.jsonFile
            },
            action: {
              dedupId: 'actionTest',
              _function: action,
              objectRef: undefined,
              ownerIsObject: false
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then(result => {
              refName.should.equal('myJSONObj');
              (typeof testJsonObj).should.equal('object');
              testJsonObj.name.should.exist;
              testJsonObj.id.should.equal(1);
              testJsonObj.name.should.equal('Franz');
              testJsonObj.id.should.exist;
              actionCount.should.equal(1);
            });
        });
        it('should invoke action only once', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): Promise<true> {
            testJsonObj = _jsonObj;
            refName = _refName;
            return Promise.resolve(true);
          }

          let actionCount = 0;

          function action(allSuccess: boolean, ec): Promise<true> {
            actionCount++;
            return Promise.resolve(true);
          }

          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON
            },
            loader: {
              module: {
                moduleName: './testing-mjs/test-json.json'
              },
              factoryType: FactoryType.jsonFile
            },
            action: {
              dedupId: 'actionTest',
              _function: action,
              objectRef: undefined,
              ownerIsObject: false
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then(result => {
              refName.should.equal('myJSONObj');
              (typeof testJsonObj).should.equal('object');
              testJsonObj.name.should.exist;
              testJsonObj.id.should.equal(1);
              testJsonObj.name.should.equal('Franz');
              testJsonObj.id.should.exist;
              actionCount.should.equal(1);
            });

        });
        it('should invoke action only once with independent action', () => {
          let testJsonObj;
          let refName: string;

          function setJSON(_refName: string, _jsonObj): Promise<true> {
            testJsonObj = _jsonObj;
            refName = _refName;
            return Promise.resolve(true);
          }

          let actionCount = 0;

          function action(allSuccess: boolean, ec): Promise<true> {
            actionCount++;
            return Promise.resolve(true);
          }


          const pendingResolution: PendingModuleResolution = {
            refName: 'myJSONObj',
            setter: {
              ownerIsObject: false,
              objectRef: undefined,
              _function: setJSON
            },
            loader: {
              module: {
                moduleName: './testing-mjs/test-json.json'
              },
              factoryType: FactoryType.jsonFile
            },
            action: {
              dedupId: 'actionTest',
              _function: action,
              objectRef: undefined,
              ownerIsObject: false
            }
          };
          const pendingResolution2: PendingModuleResolution = {
            refName: 'actionTest1',
            action: {
              dedupId: 'actionTest',
              _function: action,
              objectRef: undefined,
              ownerIsObject: false
            }
          };
          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          resolver.add(pendingResolution);
          resolver.add(pendingResolution2);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then(values => {
              refName.should.equal('myJSONObj');
              (typeof testJsonObj).should.equal('object');
              testJsonObj.name.should.exist;
              testJsonObj.id.should.equal(1);
              testJsonObj.name.should.equal('Franz');
              testJsonObj.id.should.exist;
              actionCount.should.equal(1);
            });
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
                moduleName: './testing-mjs/my-object.js',
                functionName: 'myObjectFactory'
              },
              factoryType: FactoryType.moduleFactoryFunction
            },
            setter: {
              ownerIsObject: false,
              _function: setter,
              paramsArray: ['FunObject']
            },
            action: {
              _function: action,
              objectRef: undefined,
              ownerIsObject: false,
              paramsArray: [someObject, 5]
            }
          };

          const resolver: Resolver = new ModuleResolver();
          resolver.add(pendingResolution);
          const resultPromise = resolver.resolve();
          return resultPromise
            .then(result => {
              someObject.myObject.name.should.equal('FunObject');
              someObject.count.should.equal(5);
            });
        });
      });
    });
  });
});
