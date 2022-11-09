import { ChangeEvent, FocusEvent, FormEvent, useReducer } from 'react';
import {
  all,
  and,
  err,
  Infer,
  integer,
  isError,
  length,
  max,
  maxLength,
  min,
  minLength,
  object,
  okay,
  or,
  string,
  undef
} from 'ok-computer';
import * as parse from 'ok-computer/parser';
import { Button, TextInputField } from 'evergreen-ui';
import pipe from '@bitty/pipe';
import DebugPanel from './lib/debug-panel';

const StackedErrorMessagesForm: React.FunctionComponent = () => {
  const [state, dispatch] = useReducer(reducer, {
    fields: {},
    submitted: false
  });

  const { fields, submitted } = state;

  const fieldValues = Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, field.value])
  ) as FieldValues;

  const parsedFieldValues = parser(fieldValues);
  const errors = validator(parsedFieldValues);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    dispatch({
      type: 'FIELD_VALUE_CHANGED',
      payload: {
        name: e.target.name as keyof FieldValues,
        value: e.target.value
      }
    });

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    dispatch({
      type: 'FIELD_TOUCHED',
      payload: {
        name: e.target.name as keyof FieldValues,
        value: e.target.value
      }
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'FORM_SUBMITTED' });
    const values: unknown = parsedFieldValues;
    if (!okay(values, validator)) {
      return;
    }
    alert(JSON.stringify({ status: 'ok', values }, null, 2));
  };

  return (
    <>
      <form noValidate onSubmit={handleSubmit}>
        <TextInputField
          label="First name"
          name="firstName"
          required
          onChange={handleChange}
          onBlur={handleBlur}
          value={fields.firstName?.value ?? ''}
          isInvalid={
            (submitted || fields.firstName?.touched) &&
            isError(errors.firstName)
          }
          validationMessage={
            (submitted || fields.firstName?.touched) &&
            errors.firstName?.errors[0]
          }
        />
        <TextInputField
          label="Last name"
          name="lastName"
          onChange={handleChange}
          onBlur={handleBlur}
          value={fields.lastName?.value ?? ''}
          isInvalid={
            (submitted || fields.lastName?.touched) && isError(errors.lastName)
          }
          validationMessage={
            (submitted || fields.lastName?.touched) &&
            errors.lastName?.errors[0]
          }
        />
        <TextInputField
          label="Age"
          name="age"
          required
          onChange={handleChange}
          onBlur={handleBlur}
          value={fields.age?.value ?? ''}
          isInvalid={(submitted || fields.age?.touched) && isError(errors.age)}
          validationMessage={
            (submitted || fields.age?.touched) && errors.age?.errors[0]
          }
        />
        <Button type="submit" appearance="primary" marginBottom={16}>
          Submit
        </Button>
      </form>
      <DebugPanel
        state={{ state, computed: { fieldValues, parsedFieldValues, errors } }}
      />
    </>
  );
};

export default StackedErrorMessagesForm;

const validator = object({
  firstName: all(
    err(and(string, minLength(1)), 'Enter your first name'),
    err(maxLength(24), 'Your first name is too long (maximum 24 characters)')
  ),
  lastName: all(
    err(
      or(undef, and(string, length(1, 24))),
      'Your last name is too long (maximum 24 characters)'
    )
  ),
  age: all(
    err(and(integer, min(0)), 'Enter your age in years'),
    err(max(130), 'Are you sure?')
  )
});

const parser = parse.object(
  {
    firstName: pipe(parse.trim, parse.undefinedWhen('')),
    lastName: pipe(parse.trim, parse.undefinedWhen('')),
    age: pipe(parse.trim, parse.undefinedWhen(''), (value) =>
      typeof value === 'undefined' ? value : Number(value)
    )
  },
  { keepUnknown: true }
);

type ValidValues = Infer<typeof validator>;

interface Field {
  readonly value: any;
  readonly touched: boolean;
}

type Fields = Partial<Record<keyof ValidValues, Field>>;

type FieldValues = Partial<Record<keyof Fields, Field['value']>>;

interface State {
  readonly fields: Fields;
  readonly submitted: boolean;
}

type Action =
  | {
      type: 'FIELD_VALUE_CHANGED';
      payload: { name: keyof FieldValues; value: string };
    }
  | {
      type: 'FIELD_TOUCHED';
      payload: { name: keyof FieldValues; value: string };
    }
  | { type: 'FORM_SUBMITTED' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FIELD_VALUE_CHANGED':
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.payload.name]: {
            ...state.fields[action.payload.name],
            value: action.payload.value
          }
        }
      };
    case 'FIELD_TOUCHED':
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.payload.name]: {
            ...state.fields[action.payload.name],
            touched: true
          }
        }
      };
    case 'FORM_SUBMITTED':
      return { ...state, submitted: true };
    default:
      throw new Error('Unknown action');
  }
};
