import { ChangeEvent, FocusEvent, FormEvent, useReducer } from 'react';
import {
  all,
  and,
  annotate,
  err,
  ExtractErr,
  Infer,
  isError,
  match,
  maxLength,
  minLength,
  not,
  object,
  okay,
  or,
  pattern,
  peer,
  string,
  undef
} from 'ok-computer';
import * as parse from 'ok-computer/parser';
import {
  Button,
  IntentTypes,
  Pane,
  StatusIndicator,
  TextInputField
} from 'evergreen-ui';
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

  const getPasswordStatusFor = (
    key: PasswordErrorKey
  ): IntentTypes | undefined => {
    const pass = !errors.password?.errors.some((error) => error.key === key);
    return pass
      ? 'success'
      : submitted || fields.password?.touched
      ? 'danger'
      : undefined;
  };

  return (
    <>
      <form noValidate onSubmit={handleSubmit}>
        <TextInputField
          label="Password"
          name="password"
          required
          onChange={handleChange}
          onBlur={handleBlur}
          value={fields.password?.value ?? ''}
          isInvalid={
            (submitted || fields.password?.touched) && isError(errors.password)
          }
        />
        <Pane display="flex" flexDirection="column" marginBottom={16}>
          <StatusIndicator color={getPasswordStatusFor('length')}>
            Between 8 and 130 characters
          </StatusIndicator>
          <StatusIndicator color={getPasswordStatusFor('uppercase')}>
            Contains uppercase characters
          </StatusIndicator>
          <StatusIndicator color={getPasswordStatusFor('lowercase')}>
            Contains lowercase characters
          </StatusIndicator>
          <StatusIndicator color={getPasswordStatusFor('number')}>
            Contains numbers
          </StatusIndicator>
        </Pane>
        <TextInputField
          label="Repeat password"
          name="repeatPassword"
          required
          onChange={handleChange}
          onBlur={handleBlur}
          value={fields.repeatPassword?.value ?? ''}
          isInvalid={
            (submitted || fields.repeatPassword?.touched) &&
            isError(errors.repeatPassword)
          }
          validationMessage={
            (submitted || fields.repeatPassword?.touched) &&
            errors.repeatPassword?.errors[0]
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
  password: all(
    err(and(string, minLength(8), maxLength(130)), { key: 'length' as const }),
    err(pattern(/[A-Z]/), { key: 'uppercase' as const }),
    err(pattern(/[a-z]/), { key: 'lowercase' as const }),
    err(pattern(/[0-9]/), { key: 'number' as const })
  ),
  repeatPassword: all(
    annotate<string>()(
      err(or(not(undef), peer('password')(not(undef))), 'Required')
    ),
    err(match('password'), 'Does not match password')
  )
});

type PasswordErrorKey = Exclude<
  ExtractErr<typeof validator>['password'],
  undefined
>['errors'][number]['key'];

const parser = parse.object(
  {
    password: pipe(parse.trim, parse.undefinedWhen('')),
    repeatPassword: pipe(parse.trim, parse.undefinedWhen(''))
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
