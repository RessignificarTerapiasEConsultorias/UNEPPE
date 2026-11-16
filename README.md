# Site da UNEPPE

Site completo da associação, em HTML, CSS e JavaScript puros (sem build), publicado pelo GitHub Pages.

## Páginas
- `index.html`: página de captação de associados
- `acaobolsa2026.1/`: cadastro da Bolsa Formação (mesmo endereço de antes, para os links já divulgados)
- `bolsa/`: atalho que leva para o cadastro da Bolsa Formação
- `area-interna/`: login da equipe (o painel com os cadastros vem depois)

## Arquivos
- `assets/img/`: logo, favicon, imagem de compartilhamento e artes dos posts
- `assets/css/forms.css`: estilos do formulário e da área interna
- `assets/js/config.js`: **dados do Supabase** (preencher quando o banco existir)
- `assets/js/bolsa.js` e `assets/js/area.js`: envio do formulário e login
- `supabase/setup.sql`: cria a tabela, a pasta privada de documentos e as regras de segurança

## Ligar o banco (Supabase)
1. Crie o projeto no Supabase e rode `supabase/setup.sql` (SQL Editor).
2. Em Authentication, Providers, Email: desligue "Allow new users to sign up".
3. Em `assets/js/config.js`, preencha `supabaseUrl` e `supabaseAnonKey` (chave **anon**). **Nunca** coloque a chave `service_role` no GitHub.
4. Crie o acesso do presidente em Authentication, Users, Add user.
5. Teste: envie um cadastro de teste e confira a linha na tabela e os arquivos em Storage.

Enquanto `config.js` estiver vazio, o formulário e o login ficam desativados e avisam isso.

## Trocar o site antigo pelo novo (nesta ordem)
1. Teste tudo no endereço `github.io`, com o banco ligado.
2. Exporte os cadastros e documentos do sistema antigo.
3. Só então aponte o domínio para o GitHub (DNS na HostGator) e informe o domínio em Settings, Pages.
4. Só depois cancele a hospedagem antiga.

## Outros ajustes
- WhatsApp do presidente e da equipe: bloco `CONFIGURAÇÃO` no fim do `index.html` (e `whatsappEquipe` em `config.js`).
- Meta Pixel: comentário `META PIXEL` no `<head>` do `index.html`.
- Domínio do site: `og:url` e `og:image` no `<head>` do `index.html` (hoje https://uneppe.com.br/).
