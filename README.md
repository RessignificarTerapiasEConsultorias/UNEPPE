# Site da UNEPPE

Página de captação de associados. HTML, CSS e JavaScript puros, sem build.

## Arquivos
- `index.html`: a página inteira
- `assets/img/`: logo, favicon e imagem de compartilhamento (`og.jpg`)
- `assets/img/posts/`: artes dos posts do Instagram usadas na página

## O que editar (tudo em `index.html`)
- **WhatsApp e mensagens prontas:** no final do arquivo, bloco `CONFIGURAÇÃO`. Há dois contatos: `presidente` e `equipe`. Formato do número: 55 + DDD + número, só dígitos. Também aparecem escritos no rodapé e na chamada final.
- **Número de especialidades:** procure por `mais de 20 especialidades` e `20+`.
- **Meta Pixel:** cole o código no comentário `META PIXEL` dentro do `<head>`. Os botões de WhatsApp já enviam o evento `Contact`.
- **Compartilhamento:** `og:url` e `og:image` assumem o endereço https://uneppe.com.br/.

## Publicar com GitHub Pages
Settings do repositório, Pages, Source: `Deploy from a branch`, branch `main`, pasta `/ (root)`.

## Observação
O rodapé mantém razão social, CNPJ, endereço e o telefone fixo (81) 3272-6381, que constam no cartão do CNPJ e servem de comprovação no portfólio do Meta.
O link da Bolsa Formação aponta para https://uneppe.com.br/acaobolsa2026.1/.
