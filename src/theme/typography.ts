import { TextStyle } from 'react-native';
import { TEXT } from './colors';

type Weight = '400' | '500' | '600' | '700' | '800';

const base = (size: number, weight: Weight, lineHeight: number, letter = 0): TextStyle => ({
  fontSize: size,
  fontWeight: weight,
  lineHeight,
  letterSpacing: letter,
  color: TEXT.primary,
});

export const TYPE = {
  display: base(34, '800', 40, -0.5),
  h1: base(28, '700', 34, -0.3),
  h2: base(22, '700', 28, -0.2),
  h3: base(18, '600', 24),
  h4: base(16, '600', 22),
  bodyLg: base(16, '500', 24),
  body: base(14, '500', 20),
  bodySm: base(13, '500', 18),
  caption: base(12, '500', 16),
  tiny: base(10, '600', 14, 0.4),
  button: base(16, '600', 22, 0.2),
  buttonSm: base(14, '600', 18, 0.2),
  label: base(12, '600', 16, 0.4),
  numeric: base(22, '700', 26, -0.2),
};

export type TypeVariant = keyof typeof TYPE;
