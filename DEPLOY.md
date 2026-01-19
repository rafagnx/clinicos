# PROCESSO DE DEPLOY (Como colocar o site no ar)

Seu site funciona em DUAS partes separadas. Você precisa atualizar AMBAS para que tudo funcione.

## 1. BACKEND (Render.com)
O "Cérebro" do sistema (Banco de Dados, Login, API).

Se você fez alterações em `server/`, `api/`, ou `schema.sql`:
1.  **Git Push**:
    ```bash
    git push origin main
    ```
2.  **Acesse o Render**: [dashboard.render.com](https://dashboard.render.com/)
3.  Vá em **Manual Deploy** -> **Clear Cache and Deploy**.
4.  *Espere terminar.* (Isso corrige o Erro 500 no banco de dados).

---

## 2. FRONTEND (ProFreeHost)
A "Cara" do site (Telas, Botões, Cores, Perfis).

Se você fez alterações em `pages/`, `components/`, ou `Layout.jsx`:
1.  **Construir o Site (Build)**:
    No seu terminal VS Code:
    ```bash
    npm run build
    ```
    *Isso cria uma pasta nova chamada `dist` no seu computador.*

2.  **Enviar para o Site (Upload)**:
    *   Abra o **FileZilla** (ou gerenciador de arquivos do ProFreeHost).
    *   Conecte-se ao seu servidor FTP.
    *   Entre na pasta `htdocs`.
    *   **APAGUE** todos os arquivos antigos dentro de `htdocs`.
    *   **ARRASTE** todo o conteúdo de dentro da pasta `dist` (do seu computador) para dentro da pasta `htdocs`.

## RESUMO
- **npm run build** = Cria os arquivos NO SEU COMPUTADOR.
- **Upload (FTP)** = Coloca os arquivos NA INTERNET.

**Se você não fizer o passo 2 (Upload), o site "clinicos.unaux.com" continuará velho!**
