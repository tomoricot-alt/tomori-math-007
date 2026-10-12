import type { Grade, Level, Operation } from './types';

export interface Range {
  min: number;
  max: number;
}

/**
 * 学年・計算・段階ごとの数の範囲。
 * - add/sub/mul: a, b それぞれの範囲
 * - div: divisor (わる数) と quotient (答え) の範囲。わられる数 = わる数 × 答え
 */
export interface Spec {
  a: Range;
  b: Range;
}

type Table = Record<Grade, Record<Operation, Record<Level, Spec>>>;

const r = (min: number, max: number): Range => ({ min, max });

export const SPECS: Table = {
  3: {
    add: {
      easy: { a: r(1, 20), b: r(1, 20) },
      normal: { a: r(10, 99), b: r(10, 99) },
      challenge: { a: r(100, 999), b: r(100, 999) },
    },
    sub: {
      easy: { a: r(5, 20), b: r(1, 20) },
      normal: { a: r(20, 99), b: r(10, 99) },
      challenge: { a: r(100, 999), b: r(100, 999) },
    },
    mul: {
      easy: { a: r(2, 9), b: r(2, 9) },
      normal: { a: r(10, 99), b: r(2, 9) },
      challenge: { a: r(100, 999), b: r(2, 9) },
    },
    // a = わる数, b = 答え
    div: {
      easy: { a: r(2, 9), b: r(2, 9) },
      normal: { a: r(2, 9), b: r(10, 20) },
      challenge: { a: r(2, 9), b: r(20, 99) },
    },
  },
  4: {
    add: {
      easy: { a: r(100, 999), b: r(10, 99) },
      normal: { a: r(1000, 9999), b: r(1000, 9999) },
      challenge: { a: r(10000, 99999), b: r(10000, 99999) },
    },
    sub: {
      easy: { a: r(100, 999), b: r(10, 99) },
      normal: { a: r(1000, 9999), b: r(1000, 9999) },
      challenge: { a: r(10000, 99999), b: r(10000, 99999) },
    },
    mul: {
      easy: { a: r(10, 99), b: r(2, 9) },
      normal: { a: r(10, 99), b: r(10, 99) },
      challenge: { a: r(100, 999), b: r(11, 99) },
    },
    div: {
      easy: { a: r(2, 9), b: r(10, 99) },
      normal: { a: r(2, 9), b: r(100, 200) },
      challenge: { a: r(11, 30), b: r(5, 30) },
    },
  },
};

export const OPERATIONS: readonly Operation[] = ['add', 'sub', 'mul', 'div'];
