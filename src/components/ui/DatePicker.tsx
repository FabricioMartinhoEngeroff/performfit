import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import { Calendar } from "phosphor-react";
import { forwardRef, ChangeEvent } from "react";
import { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
registerLocale("pt-BR", ptBR);

// --- Container geral com título ---
const Container = styled.div`
  width: 100%;
  margin-bottom: 20px;
`;

// --- Título no estilo da imagem enviada ---
const Titulo = styled.label`
  display: block;
  margin-bottom: 2px; // antes era 6px
  font-weight: bold;
  color: #004080;
  font-size: 16px;
`;

// --- Wrapper do input com ícone de calendário ---
const InputWrapper = styled.div`
  position: relative;

  .calendar-icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #888;
    pointer-events: none;
  }

  input {
    width: 100%;
    padding: 12px;
    padding-right: 36px;
    border: 1px solid #ccc;
    margin-top: 0;
    border-radius: 5px;
    background-color: #f9f9f9;
    font-size: 16px;
    color: #000;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;

    &:focus {
      border-color: #0066cc;
      box-shadow: 0 0 5px rgba(0, 102, 204, 0.3);
      background-color: #fff;
    }
  }
`;

// --- Input customizado com ícone para o ReactDatePicker ---
const CustomInputWithIcon = forwardRef<HTMLInputElement, {
  value?: string;
  onClick?: () => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}>(({ value, onClick, onChange }, ref) => (
  <InputWrapper>
    <input
      type="text"
      value={value}
      onClick={onClick}
      onChange={onChange}
      ref={ref}
      placeholder="Selecione a data"
      readOnly
    />
    <Calendar size={20} className="calendar-icon" />
  </InputWrapper>
));

CustomInputWithIcon.displayName = "CustomInputWithIcon";

// --- Componente principal exportado ---
interface Props {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
}

export const DatePicker = ({ selected, onChange, label = "Data" }: Props) => (
  <Container>
    <Titulo>{label}</Titulo>
    <ReactDatePicker
  selected={selected}
  onChange={onChange}
  dateFormat="dd/MM/yyyy"
  showPopperArrow={false}
  customInput={<CustomInputWithIcon />}
  locale="pt-BR" // 👈 aqui!
/>
  </Container>
);
