import {cwd} from 'node:process';
import * as gulpBase from '@franzzemen/gulp-base';
import { createRequire } from "node:module";
import {join, dirname} from 'node:path';
import {npmu as npmuFunc} from '@franzzemen/npmu';
import {fileURLToPath} from 'node:url';

const requireModule = createRequire(import.meta.url);
gulpBase.init(requireModule('./package.json'), cwd());


export const npmu  = (cb) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));

  npmuFunc([
    {
      path: join(__dirname, '../gulp-base'), packageName: '@franzzemen/gulp-base',
    }, {
      path: join(__dirname, '../npmu'), packageName: '@franzzemen/npmu',
    }, {
      path: join(__dirname, '../module-factory'), packageName: '@franzzemen/module-factory',
    }, {
      path: join(__dirname, '../execution-context'), packageName: '@franzzemen/execution-context',
    }, {
      path: join(__dirname, '../app-execution-context'), packageName: '@franzzemen/app-execution-context',
    }, {
      path: join(__dirname, '../logger-adapter'), packageName: '@franzzemen/logger-adapter',
    }, {
      path: join(__dirname, '../enhanced-error'), packageName: '@franzzemen/enhanced-error',
    }, {
      path: join(__dirname, './'), packageName: '@franzzemen/module-resolver',
    }])
    .then(() => {
      console.log('cb...');
      cb();
    })
}



export const test = gulpBase.test;

export const clean = gulpBase.clean;
export const buildTest = gulpBase.buildTest;
export default gulpBase.default;

export const patch = gulpBase.patch;
export const minor = gulpBase.minor;
export const major = gulpBase.major;
