import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import multiInput from 'rollup-plugin-multi-input';

export default [
  {
    input: ['src/ok-computer.ts', 'src/parser.ts'],
    plugins: [multiInput(), typescript(), commonjs(), resolve()],
    output: [
      { dir: 'dist/cjs', format: 'cjs' },
      { dir: 'dist/es', format: 'es' }
    ]
  }
];
