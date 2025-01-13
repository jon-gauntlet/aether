import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  body {
    background: ${({ theme }) => theme?.colors?.background};
    color: ${({ theme }) => theme?.colors?.text};
    line-height: 1.5;
    font-family: ${({ theme }) => theme?.fonts?.body};
  }

  h1, h2, h3, h4, h5, h6 {
    margin: ${({ theme }) => theme?.space?.md} 0;
    font-family: ${({ theme }) => theme?.fonts?.body};
    color: ${({ theme }) => theme?.colors?.text};
  }

  p {
    margin: ${({ theme }) => theme?.space?.sm} 0;
    color: ${({ theme }) => theme?.colors?.text};
  }

  button {
    border-radius: ${({ theme }) => theme?.borderRadius?.md};
    background: ${({ theme }) => theme?.colors?.primary};
    color: ${({ theme }) => theme?.colors?.onPrimary};
    cursor: pointer;
    transition: ${({ theme }) => theme?.transitions?.default};
    &:hover {
      box-shadow: ${({ theme }) => theme?.shadows?.sm};
    }
  }

  input, textarea {
    border: 1px solid ${({ theme }) => theme?.colors?.secondary};
    border-radius: ${({ theme }) => theme?.borderRadius?.sm};
    padding: ${({ theme }) => theme?.space?.sm};
    background: ${({ theme }) => theme?.colors?.surface};
    color: ${({ theme }) => theme?.colors?.text};
  }

  code {
    padding: ${({ theme }) => theme?.space?.xs};
    border-radius: ${({ theme }) => theme?.borderRadius?.sm};
    background: ${({ theme }) => theme?.colors?.surface};
  }

  pre {
    padding: ${({ theme }) => theme?.space?.md};
    border-radius: ${({ theme }) => theme?.borderRadius?.md};
    background: ${({ theme }) => theme?.colors?.surface};
    overflow-x: auto;
  }
`; 