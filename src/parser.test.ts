// import { object, array, trim, nullWhen, ObjectOptions } from './parser';
// import pipe from '@bitty/pipe';

test('WIP', () => {});

// describe('object', () => {
//   const createTestParser = (options?: ObjectOptions) =>
//     object(
//       {
//         firstName: trim,
//         lastName: pipe(trim, nullWhen('')),
//         location: object({
//           lng: Number,
//           lat: Number
//         }),
//         tags: array(pipe(trim, nullWhen(''))),
//         filteredTags: pipe(array(pipe(trim, nullWhen(''))), (value: any) =>
//           value.filter((value: any) => typeof value === 'string')
//         ),
//         carNumber: pipe(nullWhen(''), (value) => value ?? 44, Number)
//       },
//       options
//     );
//   [
//     {
//       parser: createTestParser(),
//       input: undefined,
//       output: undefined
//     },
//     {
//       parser: createTestParser(),
//       input: null,
//       output: null
//     },
//     {
//       parser: createTestParser(),
//       input: 123,
//       output: 123
//     },
//     {
//       parser: createTestParser(),
//       input: 0,
//       output: 0
//     },
//     {
//       parser: createTestParser(),
//       input: '',
//       output: ''
//     },
//     {
//       parser: createTestParser(),
//       input: 'foo',
//       output: 'foo'
//     },
//     {
//       parser: createTestParser(),
//       input: {},
//       output: {
//         firstName: undefined,
//         lastName: undefined,
//         location: undefined,
//         tags: undefined,
//         filteredTags: undefined,
//         carNumber: 44
//       }
//     },
//     {
//       parser: createTestParser(),
//       input: {
//         firstName: 'Lewis'
//       },
//       output: {
//         firstName: 'Lewis',
//         lastName: undefined,
//         location: undefined,
//         tags: undefined,
//         filteredTags: undefined,
//         carNumber: 44
//       }
//     },
//     {
//       parser: createTestParser(),
//       input: {
//         firstName: ' Lewis ',
//         lastName: ''
//       },
//       output: {
//         firstName: 'Lewis',
//         lastName: null,
//         location: undefined,
//         tags: undefined,
//         filteredTags: undefined,
//         carNumber: 44
//       }
//     },
//     {
//       parser: createTestParser(),
//       input: {
//         firstName: 'Lewis',
//         team: 'Mercedes' // unknown
//       },
//       output: {
//         firstName: 'Lewis',
//         lastName: undefined,
//         location: undefined,
//         tags: undefined,
//         filteredTags: undefined,
//         carNumber: 44
//       }
//     },
//     {
//       parser: createTestParser({ keepUnknown: true }),
//       input: {
//         firstName: 'Lewis',
//         team: 'Mercedes' // unknown
//       },
//       output: {
//         firstName: 'Lewis',
//         lastName: undefined,
//         location: undefined,
//         tags: undefined,
//         filteredTags: undefined,
//         carNumber: 44,
//         team: 'Mercedes'
//       }
//     },
//     {
//       parser: createTestParser(),
//       input: {
//         firstName: 'Lewis',
//         lastName: 123 // throws
//       },
//       output: {
//         firstName: 'Lewis',
//         lastName: 123,
//         location: undefined,
//         tags: undefined,
//         filteredTags: undefined,
//         carNumber: 44
//       }
//     },
//     {
//       parser: createTestParser(),
//       input: {
//         location: {
//           lng: '51.510357',
//           lat: '-0.116773'
//         }
//       },
//       output: {
//         firstName: undefined,
//         lastName: undefined,
//         location: {
//           lng: 51.510357,
//           lat: -0.116773
//         },
//         tags: undefined,
//         filteredTags: undefined,
//         carNumber: 44
//       }
//     },
//     {
//       parser: createTestParser(),
//       input: {
//         location: {
//           lng: 51.510357,
//           lat: 'erm'
//         }
//       },
//       output: {
//         firstName: undefined,
//         lastName: undefined,
//         location: {
//           lng: 51.510357,
//           lat: NaN
//         },
//         tags: undefined,
//         filteredTags: undefined,
//         carNumber: 44
//       }
//     },
//     {
//       parser: createTestParser(),
//       input: {
//         tags: ['foo', ' bar ', '', '  baz', 10, false, ''],
//         filteredTags: ['foo', ' bar ', '', '  baz', 10, false, '']
//       },
//       output: {
//         firstName: undefined,
//         lastName: undefined,
//         location: undefined,
//         tags: ['foo', 'bar', null, 'baz', 10, false, null],
//         filteredTags: ['foo', 'bar', 'baz'],
//         carNumber: 44
//       }
//     },
//     {
//       parser: createTestParser(),
//       input: {
//         carNumber: '33'
//       },
//       output: {
//         firstName: undefined,
//         lastName: undefined,
//         location: undefined,
//         tags: undefined,
//         filteredTags: undefined,
//         carNumber: 33
//       }
//     },
//     {
//       parser: createTestParser(),
//       input: {
//         carNumber: 63
//       },
//       output: {
//         firstName: undefined,
//         lastName: undefined,
//         location: undefined,
//         tags: undefined,
//         filteredTags: undefined,
//         carNumber: 63
//       }
//     },
//     {
//       parser: createTestParser(),
//       input: {
//         carNumber: ''
//       },
//       output: {
//         firstName: undefined,
//         lastName: undefined,
//         location: undefined,
//         tags: undefined,
//         filteredTags: undefined,
//         carNumber: 44
//       }
//     }
//   ].forEach(({ parser, input, output }, i) => {
//     test(`${JSON.stringify(input)}`, () => {
//       expect(parser(input as any)).toStrictEqual(output);
//     });
//   });
// });
