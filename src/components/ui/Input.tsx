import styled from "styled-components";
import { ChangeEvent, forwardRef } from "react";

interface StyledInputProps {
  $isMobile?: boolean;
}

const StyledInput = styled.input<StyledInputProps>`
  width: 100%;
  padding: ${({ $isMobile }) => ($isMobile ? "10px" : "12px")};
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: ${({ $isMobile }) => ($isMobile ? "15px" : "16px")};
  background-color: #f9f9f9;
  color: #000;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #0066cc;
    box-shadow: 0 0 5px rgba(0, 102, 204, 0.3);
    background-color: #fff;
  }
`;

interface InputProps {
  type: string;
  placeholder: string;
  name?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onClick?: () => void; // necessário para customInput funcionar
  isMobile?: boolean;
  styleProps?: React.CSSProperties;
}

// Agora com suporte ao customInput
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type,
      placeholder,
      name,
      value,
      onChange,
      onClick,
      isMobile = false,
      styleProps,
    },
    ref
  ) => {
    return (
      <StyledInput
        ref={ref}
        type={type}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={onChange}
        onClick={onClick}
        $isMobile={isMobile}
        style={styleProps}
        readOnly={!!onClick} // impede edição manual no caso de DatePicker
      />
    );
  }
);
