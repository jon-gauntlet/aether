import React from 'react'
import styled from 'styled-components'

const IconWrapper = styled.svg`
  width: 1.5em;
  height: 1.5em;
  display: inline-block;
  flex-shrink: 0;
  user-select: none;
  vertical-align: middle;
`

export const FolderIcon = () => (
  <IconWrapper
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </IconWrapper>
)

export const SearchIcon = () => (
  <IconWrapper
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </IconWrapper>
) 