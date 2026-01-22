# Dashboard de Expedição - Frontend

Sistema de gerenciamento de carregamentos de expedição.

## 📁 Estrutura do Projeto

```
frontend/
├── public/                 # Arquivos públicos estáticos
├── src/
│   ├── assets/            # Imagens e recursos estáticos
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Actions.jsx    # Botões de ação (iniciar, finalizar, pausar)
│   │   ├── Header.jsx     # Cabeçalho com logo
│   │   ├── InformacoesForm.jsx # Formulário de informações gerais
│   │   ├── PlateDetails.jsx    # Detalhes da placa selecionada
│   │   ├── PlateTable.jsx      # Tabela de placas
│   │   └── StatusMessage.jsx   # Componente de mensagens
│   ├── pages/             # Páginas/Views da aplicação
│   │   ├── Dashboard.jsx  # Página principal
│   │   ├── Consulta.jsx   # Página de consulta de carregamentos
│   │   └── Placas.jsx     # Página de gerenciamento de placas
│   ├── services/          # Serviços e APIs
│   │   └── api.js         # Configuração do Axios
│   ├── styles/            # Arquivos de estilo CSS
│   │   ├── variables.css  # Design System (cores, fontes, espaçamentos)
│   │   ├── Dashboard.css
│   │   ├── Consulta.css
│   │   ├── Placas.css
│   │   └── ...
│   ├── utils/             # Funções utilitárias
│   │   └── timeUtils.js   # Funções para manipulação de tempo
│   ├── App.jsx            # Componente raiz com rotas
│   ├── index.js           # Ponto de entrada
│   └── index.css          # Estilos globais
└── package.json
```

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm start

# Build para produção
npm run build
```

## 📱 Responsividade

O sistema é totalmente responsivo, adaptando-se a:

- Desktop (> 1024px)
- Tablet (768px - 1024px)
- Mobile (< 768px)

## 🎨 Design System

O projeto utiliza um design system profissional com:

- Paleta de cores consistente (azul primário)
- Tipografia Inter
- Espaçamentos padronizados
- Sombras e bordas arredondadas
- Transições suaves

## 🔧 Tecnologias

- React 19
- React Router DOM
- Axios
- FontAwesome Icons
- jsPDF (geração de relatórios)
- JsBarcode

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
