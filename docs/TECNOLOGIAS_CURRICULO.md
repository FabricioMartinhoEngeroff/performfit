# 🚀 TECNOLOGIAS - GYMWAVE STRENGTH
## Para Colocar no Seu Currículo

📱 **PROJETO:** GymWave Strength
Sistema web de gerenciamento de treinos de força com periodização ondulatória

---

## 📌 STACK COMPLETO

### 🎯 Core Technologies

- **React 19.1.0** - Biblioteca JavaScript para construção de interfaces
- **TypeScript 5.7.2** - Superset JavaScript com tipagem estática
- **JavaScript ES6+** - Async/Await, Arrow Functions, Destructuring, Promises
- **HTML5** - Markup semântico e acessível
- **CSS3** - Flexbox, Grid Layout, Responsive Design

### 🎨 Styling & UI

- **Styled Components 6.1.18** - CSS-in-JS para estilização de componentes
- **Phosphor Icons 2.1.10** - Biblioteca de ícones moderna (+6000 ícones)
- **Lucide React 0.555.0** - Ícones SVG otimizados
- **React Icons 5.5.0** - Ícones de múltiplas bibliotecas

### 🔧 Build Tools & Development

- **Vite 6.4.1** - Build tool de alta performance com HMR
- **npm** - Gerenciamento de dependências
- **ESLint 9.22.0** - Linting e qualidade de código
- **Git & GitHub** - Controle de versão e colaboração

### 🌐 Routing & Navigation

- **React Router DOM 7.5.3** - Roteamento SPA, rotas protegidas, navegação programática

### 📊 Data Visualization

- **Recharts 3.5.0** - Gráficos interativos (linha, barra, área), Dashboard com métricas

### 🔌 UI Components

- **React Select 5.10.1** - Select avançado com autocomplete e multiselect
- **React DatePicker 8.4.0** - Seleção de datas intuitiva

### 🌐 HTTP & APIs

- **Axios 1.12.0** - Cliente HTTP para requisições REST, Interceptors, Tratamento de erros

### 📅 Utilities

- **Date-fns 4.1.0** - Manipulação e formatação de datas

### 💾 State Management & Storage

- **React Context API** - Gerenciamento de estado global
- **Custom Hooks** - useAuth, useState, useEffect, etc
- **localStorage com isolamento por usuário** - Persistência de dados offline com chaves prefixadas por email (`{email}_logbook`, `{email}_dadosTreino`, `{email}_planoTreino`), garantindo que cada conta só enxerga seus próprios dados
- **Migração automática de dados legados** - Na primeira sessão após o isolamento, dados sem prefixo são copiados para a chave do usuário e a chave global é removida, sem perda de histórico

---

## 🏗️ ARQUITETURA & PADRÕES

- **Component-Based Architecture** - Componentes reutilizáveis
- **Custom Hooks Pattern** - Lógica de negócio isolada
- **Service Layer** - authService, userService (separação de lógica de API)
- **Type Safety** - Interfaces TypeScript personalizadas
- **Context Pattern** - Provider/Consumer pattern

---

## 🔐 FEATURES IMPLEMENTADAS

- Sistema de Autenticação (Login/Register)
- Protected Routes (rotas privadas)
- **Isolamento de dados por usuário** — localStorage prefixado por email; cada conta vê apenas seus próprios treinos
- **Migração automática de dados legados** — dados existentes sem prefixo são migrados para a conta no primeiro login, sem perda de histórico
- Importação de planilha Excel/CSV com dados salvos na conta do usuário logado
- Validação de formulários
- Tratamento de erros
- Design Responsivo (Mobile-First)
- Visualização de dados (gráficos)
- Armazenamento offline
- Acessibilidade (WCAG)

---

## 📝 VERSÃO RESUMIDA PARA CURRÍCULO

**Tecnologias:**
React 19 • TypeScript 5.7 • JavaScript ES6+ • HTML5 • CSS3 • Styled Components • Vite • React Router • Recharts • Axios • Context API • Git

**Competências:**
Frontend Development • SPA • Mobile-First Design • REST APIs • State Management • Data Visualization • Authentication • Responsive Design • Clean Code • Component Architecture

---

## 📝 DESCRIÇÃO PARA LINKEDIN/PORTFÓLIO

### GymWave Strength - Sistema de Gerenciamento de Treinos

Desenvolvi uma aplicação web full-featured para gerenciamento inteligente de treinos de força utilizando periodização ondulatória.

**Stack:** React 19 • TypeScript 5.7 • Vite • Styled Components • React Router • Recharts • Axios • Context API • localStorage

**Principais implementações:**
- Interface mobile-first responsiva com Styled Components
- Sistema de autenticação completo com rotas protegidas
- Visualização de dados com gráficos interativos (Recharts)
- Algoritmo de sugestão inteligente de cargas baseado em histórico
- Armazenamento local com localStorage (offline-first)
- Arquitetura componentizada e escalável
- Integração com APIs REST usando Axios
- Validação de formulários e tratamento de erros
- Design acessível (WCAG) com navegação por teclado

Documentação completa incluindo README, guia de contribuição, especificação técnica e templates para colaboração.

---

## 💼 PONTOS PARA DESTACAR EM ENTREVISTAS

1. "Desenvolvimento com **React 19 e TypeScript** para type safety"
2. "Implementei **sistema de autenticação** com rotas protegidas"
3. "Criei **visualizações de dados** com Recharts para análise de evolução"
4. "**Arquitetura componentizada** seguindo princípios de Clean Code"
5. "**Design mobile-first** com Styled Components"
6. "Integração com **APIs REST** usando Axios com tratamento de erros"
7. "**State management** com Context API e Custom Hooks"
8. "Aplicação **offline-first** com localStorage com **isolamento por usuário** — cada conta tem seu namespace (`{email}_chave`) e os dados nunca vazam entre contas"
9. "Implementei **migração automática** de dados legados: na primeira sessão após o isolamento, o histórico antigo é copiado para a chave do usuário sem nenhuma perda"
10. "**Documentação completa** seguindo melhores práticas da indústria"
11. "**Versionamento com Git** seguindo Conventional Commits"

---

## 🎯 SKILLS PARA LINKEDIN

React.js • TypeScript • JavaScript • HTML5 & CSS3 • Styled Components • Vite • React Router • REST APIs • Axios • Git & GitHub • Responsive Design • Mobile-First Design • Context API • Custom Hooks • Data Visualization • ESLint • npm • Component Architecture • Frontend Development • Web Development • Single Page Applications (SPA) • Clean Code • Agile Methodologies

---

## 🎓 CONHECIMENTOS DEMONSTRADOS

✅ Frontend Development
✅ React Ecosystem
✅ TypeScript
✅ State Management
✅ API Integration
✅ Responsive Design
✅ Data Visualization
✅ Authentication & Authorization
✅ Form Validation
✅ Error Handling
✅ Performance Optimization
✅ Build Tools & Bundlers
✅ Git & Version Control
✅ Project Documentation
✅ UI/UX Best Practices

---

## 📚 BOAS PRÁTICAS APLICADAS

- **Clean Code** - Código limpo e legível
- **DRY** - Don't Repeat Yourself
- **Separation of Concerns** - Modularização adequada
- **Error Handling** - Tratamento robusto de erros
- **Version Control** - Git Flow, Conventional Commits
- **Documentation** - README, CONTRIBUTING, CODE_OF_CONDUCT
- **Type Safety** - TypeScript em todo projeto
- **Responsive Design** - Mobile-First approach
- **Accessibility** - WCAG guidelines

---

## 🌟 DIFERENCIAIS DO PROJETO

1. **Documentação Profissional** - README, especificação técnica, guias de contribuição
2. **Type Safety Completo** - TypeScript em 100% do código
3. **Arquitetura Escalável** - Componentização e separação de responsabilidades
4. **UI/UX Moderno** - Design mobile-first e responsivo
5. **Offline-First** - Funciona sem conexão com internet
6. **Data Visualization** - Gráficos interativos para análise
7. **Autenticação Completa** - Sistema de login/registro seguro
8. **Código Limpo** - Seguindo princípios SOLID e Clean Code
9. **Isolamento de dados multi-usuário** - Cada conta tem seu namespace no localStorage (`{email}_chave`), com migração automática de dados legados e sem perda de histórico

---

<div align="center">

**Este documento serve como referência para currículos, portfolios, LinkedIn e entrevistas técnicas.**

💪 **GymWave Strength** | [Ver Projeto no GitHub](https://github.com/seu-usuario/GymWave-Strength)

</div>
