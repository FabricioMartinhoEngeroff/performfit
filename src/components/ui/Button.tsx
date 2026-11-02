import styled from "styled-components";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger";
  fullWidth?: boolean;
}

export const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  flex-direction: row;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
`;

const StyledButton = styled.button<ButtonProps>`
  padding: 12px;
  width: ${({ fullWidth }) => (fullWidth ? "100%" : "auto")};
  font-size: 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
  background-color: ${({ variant }) => {
    switch (variant) {
      case "outline":
        return "transparent";
      case "danger":
        return "#dc3545";
      default:
        return "#0066cc";
    }
  }};
  color: ${({ variant }) => (variant === "outline" ? "#0066cc" : "white")};
  border: ${({ variant }) => (variant === "outline" ? "1px solid #0066cc" : "none")};

  &:hover {
    background-color: ${({ variant }) => {
      switch (variant) {
        case "danger":
          return "#b02a37";
        case "outline":
          return "#e6f0ff";
        default:
          return "#005bb5";
      }
    }};
  }
`;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};