import styled, { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Arial', sans-serif;
  }

  html, body {
    min-height: 100vh;
    background-color: #e3eefc;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
`;

export const Container = styled.div`
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 0 15px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 480px;

  @media (max-width: 600px) {
    padding: 24px;
    max-width: 100%;
    border-radius: 0;
    height: 100vh;
    box-shadow: none;
  }
`;

export const LeftPanel = styled.div`
  flex: 1;
  background-color: #e3eefc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

export const RightPanel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const LoginBox = styled.div`
  width: 100%;
  max-width: 1000px;
  padding: 50px;
  background: white;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 20px;
    box-shadow: none;
  }
`;

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const Row = styled.div`
  display: flex;
  gap: 10px;
  justify-content: space-between;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const InputField = styled.div<{ $hasError?: boolean }>`
  display: flex;
  align-items: center;
  border: 2px solid ${({ $hasError }) => ($hasError ? "red" : "#ccc")};
  border-radius: 6px;
  padding: 12px;
  background: #fff;
  font-size: 18px;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  transition: border 0.3s ease;

  input {
    border: none;
    outline: none;
    flex: 1;
    padding: 8px;
    font-size: 16px;
    width: 100%;
    background: transparent;
  }

  svg {
    margin-right: 8px;
    color: ${({ $hasError }) => ($hasError ? "red" : "#0066cc")};
    font-size: 20px;
    transition: color 0.3s ease;
  }

  &:focus-within {
    border: 2px solid ${({ $hasError }) => ($hasError ? "red" : "#0066cc")};
    box-shadow: ${({ $hasError }) =>
      $hasError ? "0 0 5px rgba(255, 0, 0, 0.5)" : "0 0 5px rgba(0, 102, 204, 0.5)"};
  }
`;

export const Footer = styled.div`
  margin-top: 20px;
  font-size: 16px;
  display: flex;
  justify-content: center;
  color: #0066cc;
  cursor: pointer;
`;

export const ErrorText = styled.p`
  font-size: 14px;
  color: red;
  margin-top: 5px;
  text-align: left;
`;

export const LogoText = styled.h1`
  font-size: 32px;
  font-weight: bold;
  color: #0066cc;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

export const ToggleText = styled.p`
  font-size: 16px;
  color: #0066cc;
  cursor: pointer;
  text-align: center;
  margin-top: 10px;
  &:hover {
    text-decoration: underline;
  }
`;
