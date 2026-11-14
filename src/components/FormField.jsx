import { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  X,
} from 'lucide-react';

export function TextField({
  id,
  label,
  icon: Icon,
  error,
  hint,
  labelAction,
  trailing,
  className = '',
  ...inputProps
}) {
  const describedBy = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined;

  return (
    <div className={`login-field ${error ? 'has-error' : ''} ${className}`}>
      <div className="login-label-row">
        <label htmlFor={id}>{label}</label>
        {labelAction}
      </div>
      <div
        className={`login-input-wrapper ${
          trailing ? 'has-trailing' : ''
        }`.trim()}
      >
        {Icon ? <Icon className="login-input-icon" size={18} /> : null}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {trailing}
      </div>
      {error ? (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function PasswordField({
  id,
  label,
  error,
  hint,
  labelAction,
  autoComplete = 'current-password',
  placeholder = '••••••••',
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      id={id}
      label={label}
      error={error}
      hint={hint}
      labelAction={labelAction}
      autoComplete={autoComplete}
      placeholder={placeholder}
      type={visible ? 'text' : 'password'}
      {...inputProps}
      trailing={
        <button
          type="button"
          className="login-toggle-password"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
    />
  );
}

export function FormAlert({ tone = 'error', children }) {
  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'info'
        ? Info
        : AlertCircle;

  return (
    <div
      className={`form-alert ${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

const PASSWORD_RULES = [
  {
    key: 'length',
    label: 'Mínimo de 10 caracteres',
    test: (value) => value.length >= 10,
  },
  {
    key: 'lower',
    label: 'Uma letra minúscula',
    test: (value) => /[a-z]/.test(value),
  },
  {
    key: 'upper',
    label: 'Uma letra maiúscula',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    key: 'number',
    label: 'Um número',
    test: (value) => /[0-9]/.test(value),
  },
  {
    key: 'symbol',
    label: 'Um caractere especial',
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export function PasswordRules({ password }) {
  const value = String(password ?? '');
  const isComplete =
    value.length <= 128 &&
    PASSWORD_RULES.every((rule) => rule.test(value));

  return (
    <ul className="password-rules" aria-label="Requisitos da senha">
      {PASSWORD_RULES.map((rule) => {
        const valid = rule.test(value);
        return (
          <li key={rule.key} className={valid ? 'ok' : ''}>
            {valid ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <X size={14} aria-hidden="true" />
            )}
            {rule.label}
          </li>
        );
      })}
      {isComplete ? (
        <li className="ok password-strong">
          <CheckCircle2 size={14} aria-hidden="true" />
          Senha forte
        </li>
      ) : null}
    </ul>
  );
}
