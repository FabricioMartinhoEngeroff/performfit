import styled from "styled-components";

const GroupWrapper = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: -10px; // diminui mais o espaço vertical
  padding-top: 4px;

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const Item = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 13px;
  color: #0d47a1;
  cursor: pointer;
  min-width: 80px;
  text-align: center;

  .linha-cima {
    font-weight: bold;
    margin-bottom: -4px; // cola com a linha de baixo
    font-size: 14px;
    color: #0d47a1;
  }

  .linha-baixo {
    font-size: 12px;
    color: #555;
    margin-bottom: 1px; // reduz distância do checkbox
    white-space: nowrap;
  }

  input {
  width: 26px;   
  height: 26px;
  cursor: pointer;
}
`;

interface CheckboxGroupProps {
  options: { linhaCima: string; linhaBaixo: string; value: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
}

export const CheckboxGroup = ({
  options,
  selected,
  onChange,
  multiple,
}: CheckboxGroupProps) => {
  const toggle = (value: string) => {
    const alreadySelected = selected.includes(value);
    if (multiple) {
      onChange(
        alreadySelected
          ? selected.filter((v) => v !== value)
          : [...selected, value]
      );
      return;
    }

    onChange(alreadySelected ? selected.filter((v) => v !== value) : [value]); // única seleção
  };

  return (
    <GroupWrapper>
      {options.map(({ linhaCima, linhaBaixo, value }) => (
        <Item key={value}>
          <div className="linha-cima">{linhaCima}</div>
          <div className="linha-baixo">{linhaBaixo}</div>
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={() => toggle(value)}
          />
        </Item>
      ))}
    </GroupWrapper>
  );
};
