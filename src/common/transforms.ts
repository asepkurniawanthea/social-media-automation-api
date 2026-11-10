import { TransformFnParams } from 'class-transformer';

export const normalizeEmail = ({ value }: TransformFnParams): unknown => {
  const v: unknown = value;
  return typeof v === 'string' ? v.trim().toLowerCase() : v;
};

export const toBoolean = ({ value }: TransformFnParams): unknown => {
  const v: unknown = value;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
};

export const emptyToUndefined = ({ value }: TransformFnParams): unknown => {
  const v: unknown = value;
  if (typeof v !== 'string') return v;
  return v === '' ? undefined : v;
};

export const trimToUndefined = ({ value }: TransformFnParams): unknown => {
  const v: unknown = value;
  if (typeof v !== 'string') return v;
  const t = v.trim();
  return t === '' ? undefined : t;
};

export const normalizeDomain = ({ value }: TransformFnParams): unknown => {
  const v: unknown = value;
  if (typeof v !== 'string') return v;
  return v
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '') // protokol
    .replace(/[/?#].*$/, '') // path, query, hash
    .replace(/^www\./, '');
};
