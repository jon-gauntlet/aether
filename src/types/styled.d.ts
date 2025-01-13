import { Theme } from '../core/types/theme';
declare module 'styled-components' {
  export interface DefaultTheme {
    [key: string]: any;
  }
}