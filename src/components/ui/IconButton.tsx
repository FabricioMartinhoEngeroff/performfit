import styled from "styled-components";
import { ReactNode } from "react";

const Wrapper = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    color: #0066cc;
    font-size: 20px;
  }

  &:hover {
    background-color: #e6f0ff;
    border-radius: 6px;
  }
`;

export const IconButton = ({ icon, onClick, title }: { icon: ReactNode; onClick: () => void; title?: string }) => (
  <Wrapper onClick={onClick} title={title}>{icon}</Wrapper>
);