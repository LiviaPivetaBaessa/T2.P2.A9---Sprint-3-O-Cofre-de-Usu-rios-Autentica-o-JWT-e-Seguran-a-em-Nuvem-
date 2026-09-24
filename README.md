# 🔐 Mestre do Jogo — SaaS Seguro com Autenticação JWT

API de um **Mestre de Jogo** com **Google Gemini**, agora como um **SaaS seguro**: só usuários cadastrados e logados (senha com **bcrypt** + token **JWT**) conseguem jogar e ver o ranking.

A IA propõe charadas de tecnologia e, sozinha, chama a função `adicionarXP` para premiar ou penalizar o jogador. O XP fica salvo no usuário, no **MongoDB Atlas**, e aparece num **Ranking Global (Top 10)**. O agente também mantém as ferramentas de **clima** (OpenWeatherMap) e **moedas** (AwesomeAPI).

Projeto da disciplina **Serviços em Nuvem** — IFPR Campus Assis Chateaubriand.

## 🧠 Como funciona o Function Calling

```
Usuário pergunta
      ↓
Gemini decide: responder direto OU pedir uma ferramenta (functionCall)
      ↓                                   ↓
Resposta em texto          Servidor executa a função local (clima / moeda)
                                          ↓
                           Servidor devolve o resultado (functionResponse)
                                          ↓
                           Gemini formula a resposta final
```

## 🛠️ Ferramentas do Agente

| Ferramenta | O que faz | API |
|---|---|---|
| `buscarClimaTempoReal(cidade)` | Temperatura, sensação térmica e descrição do clima atual | OpenWeatherMap |
| `converterMoeda(valor, moedaOrigem, moedaDestino)` | Converte valores com a cotação atual | AwesomeAPI |
| `adicionarXP(quantidade)` | Soma ou tira XP do usuário logado (limite de -50 a +100 por vez) | MongoDB (`$inc`) |

> 🔒 O jogador **não** é parâmetro da IA: o servidor pega o usuário de dentro do **Token JWT**, então ninguém consegue jogar ou pontuar no lugar de outra pessoa.

## 🔐 Segurança

```
Cadastro  → senha criptografada com bcrypt ($2a$10$...) → MongoDB
Login     → bcrypt.compare() → jwt.sign({ id, nome }) → Token (7 dias)
Front-end → localStorage('token_saas') → Header: Authorization: Bearer <token>
Back-end  → autenticarToken (middleware) → jwt.verify() → req.usuario → rota
             ↳ sem token ou token inválido → 401 Unauthorized
```

## 🎮 Regras do Jogo

| Ação do jogador | XP |
|---|---|
| Acertou a charada | **+50** |
| Pediu a resposta / desistiu | **-10** |
| Foi especialmente educado | **+10** (bônus) |

**Títulos no ranking:** Novato (< 100 XP) · Aventureiro (100–499) · Lenda (≥ 500)

## 📁 Estrutura

```
├── controllers/
│   ├── authController.js   # Cadastro, login e perfil
│   ├── chatController.js   # Regras do jogo + loop de ferramentas
│   ├── rankingController.js# Top 10 + títulos dinâmicos
│   └── pdfController.js    # Gera o PDF com o resumo da conversa
├── models/
│   ├── Mensagem.js         # Histórico por usuário
│   └── Usuario.js          # nome, email (único), senha (bcrypt), xp
├── middlewares/
│   └── authMiddleware.js   # autenticarToken (JWT)
├── routes/
│   ├── authRoutes.js       # /api/auth
│   ├── chatRoutes.js       # /api/chat
│   ├── pdfRoutes.js        # /api/pdf
│   └── rankingRoutes.js    # /api/ranking
├── services/
│   ├── climaService.js     # Chamada à OpenWeatherMap
│   ├── moedaService.js     # Chamada à AwesomeAPI
│   └── xpService.js        # adicionarXP (MongoDB)
├── tools/
│   └── ferramentas.js      # Declarações (JSON Schema) + mapa de funções
├── .env.example
├── package.json
└── server.js
```

## 🔌 Rotas

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | Pública | `{ nome, email, senha }` → cria a conta |
| POST | `/api/auth/login` | Pública | `{ email, senha }` → `{ token, nome }` |
| GET | `/api/auth/perfil` | 🔒 Token | Nome, e-mail e XP do usuário logado |
| POST | `/api/chat` | 🔒 Token | `{ pergunta }` → `{ resposta, xpGanho }` |
| DELETE | `/api/chat/limpar` | 🔒 Token | Apaga o histórico do usuário (o XP continua) |
| GET | `/api/ranking` | 🔒 Token | Top 10 por XP, com título |
| POST | `/api/pdf` | 🔒 Token | `{ historico }` → PDF com o resumo |

## ▶️ Como rodar

1. `npm install`
2. Copie `.env.example` para `.env` e preencha:
   - `GEMINI_API_KEY` → https://aistudio.google.com/apikey
   - `MONGO_URI` → MongoDB Atlas (Connect → Drivers)
   - `WEATHER_API_KEY` → https://home.openweathermap.org/api_keys
   - `JWT_SECRET` → invente um texto longo e difícil (é a "chave" que assina os tokens)
3. `npm start` → `http://localhost:3000`

## 🧪 Testes de aceite

| Teste | Comportamento esperado |
|---|---|
| MongoDB Atlas → `usuarios` | A senha aparece criptografada (`$2a$10$...`) |
| `POST /api/chat` no Insomnia sem `Authorization` | `401 - Não Autorizado` |
| Cadastro + login na Vercel | Token salvo em `localStorage` (`token_saas`), chat e ranking funcionando |
| Identidade | O back-end sabe quem é o usuário pelo Token (o Front não envia nome) |
| F5 com token salvo | Pula o login e vai direto para o chat |
| Botão "Sair" | Remove o token e volta para o login |

## 🛠️ Tecnologias

Node.js · Express · bcryptjs · JSON Web Token · Mongoose · MongoDB Atlas · Google Gemini (Function Calling) · canvas-confetti · OpenWeatherMap · AwesomeAPI · PDFKit