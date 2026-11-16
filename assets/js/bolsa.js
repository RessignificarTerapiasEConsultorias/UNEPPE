(function () {
  "use strict";

  var cfg = window.UNEPPE_CONFIG || {};
  var configurado = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  var base = configurado ? String(cfg.supabaseUrl).replace(/\/+$/, "") : "";

  var form = document.getElementById("formBolsa");
  var botao = document.getElementById("botaoEnviar");
  var statusEl = document.getElementById("status");
  var aviso = document.getElementById("avisoConfig");
  var sucesso = document.getElementById("sucesso");
  var protocoloEl = document.getElementById("protocolo");
  var linkWhats = document.getElementById("linkWhats");

  var LIMITE = 20 * 1024 * 1024; // 20 MB por arquivo
  var MIME = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif" };
  var ARQUIVOS = ["identidade_frente", "identidade_verso", "comprovante_residencia", "comprovante_bolsa"];
  var CAMPOS_TEXTO = ["nome", "rg", "matricula", "cpf", "telefone", "email", "cep", "endereco"];
  var DECLARACOES = ["decl1", "decl2", "decl3"];

  if (cfg.whatsappEquipe && linkWhats) { linkWhats.href = "https://wa.me/" + cfg.whatsappEquipe; }

  if (!configurado) {
    aviso.hidden = false;
    botao.disabled = true;
    return;
  }

  /* ---------- máscaras ---------- */
  function digitos(v) { return String(v || "").replace(/\D/g, ""); }
  function mascaraCpf(v) {
    var d = digitos(v).slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
  }
  function mascaraTelefone(v) {
    var d = digitos(v).slice(0, 11);
    if (d.length <= 2) { return d.length ? "(" + d : ""; }
    if (d.length <= 6) { return "(" + d.slice(0, 2) + ") " + d.slice(2); }
    if (d.length <= 10) { return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6); }
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }
  function mascaraCep(v) {
    var d = digitos(v).slice(0, 8);
    return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
  }
  function ligarMascara(id, fn) {
    var el = form.elements[id];
    el.addEventListener("input", function () { el.value = fn(el.value); });
  }
  ligarMascara("cpf", mascaraCpf);
  ligarMascara("telefone", mascaraTelefone);
  ligarMascara("cep", mascaraCep);

  /* ---------- validações ---------- */
  function cpfValido(valor) {
    var c = digitos(valor);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) { return false; }
    for (var t = 9; t < 11; t++) {
      var soma = 0;
      for (var i = 0; i < t; i++) { soma += Number(c[i]) * (t + 1 - i); }
      var dv = ((soma * 10) % 11) % 10;
      if (dv !== Number(c[t])) { return false; }
    }
    return true;
  }
  function extensao(nome) {
    var m = /\.([a-zA-Z0-9]+)$/.exec(nome || "");
    return m ? m[1].toLowerCase() : "";
  }

  function marcar(nome, msg) {
    var campo = document.getElementById("campo-" + nome);
    var erro = document.getElementById("erro-" + nome);
    var input = form.elements[nome];
    if (campo) { campo.classList.add("has-error"); }
    if (erro) { erro.textContent = msg; }
    if (input) { input.setAttribute("aria-invalid", "true"); }
  }
  function limparErros() {
    form.querySelectorAll(".has-error").forEach(function (el) { el.classList.remove("has-error"); });
    form.querySelectorAll(".field__error").forEach(function (el) { el.textContent = ""; });
    form.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
  }

  function validar() {
    var primeiro = null;
    function falha(nome, msg) {
      marcar(nome, msg);
      if (!primeiro) { primeiro = form.elements[nome]; }
    }

    CAMPOS_TEXTO.forEach(function (nome) {
      var valor = form.elements[nome].value.trim();
      if (!valor) { falha(nome, "Preencha este campo."); return; }
      if (nome === "cpf" && !cpfValido(valor)) { falha(nome, "CPF inválido. Confira os números."); }
      if (nome === "telefone" && digitos(valor).length < 10) { falha(nome, "Telefone incompleto. Use o DDD e o número."); }
      if (nome === "cep" && digitos(valor).length !== 8) { falha(nome, "CEP incompleto."); }
      if (nome === "email" && !form.elements[nome].checkValidity()) { falha(nome, "E-mail inválido."); }
    });

    ARQUIVOS.forEach(function (nome) {
      var arq = form.elements[nome].files[0];
      if (!arq) { falha(nome, "Envie este documento."); return; }
      if (!MIME[extensao(arq.name)]) { falha(nome, "Formato não aceito. Envie PDF, JPG, PNG ou HEIC."); return; }
      if (arq.size > LIMITE) { falha(nome, "Arquivo acima de 20 MB. Envie uma versão menor."); }
    });

    DECLARACOES.forEach(function (nome) {
      if (!form.elements[nome].checked) { falha(nome, "Marque esta declaração para continuar."); }
    });
    return primeiro;
  }

  /* ---------- envio ---------- */
  function cabecalhos(extra) {
    var h = { apikey: cfg.supabaseAnonKey, Authorization: "Bearer " + cfg.supabaseAnonKey };
    Object.keys(extra || {}).forEach(function (k) { h[k] = extra[k]; });
    return h;
  }
  function checar(res) {
    if (!res.ok) { throw new Error("HTTP " + res.status); }
    return res;
  }
  function novoId() {
    if (window.crypto && crypto.randomUUID) { return crypto.randomUUID(); }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 3) | 8).toString(16);
    });
  }
  function enviarArquivo(caminho, arquivo, ext) {
    var tipo = MIME[ext] || arquivo.type || "application/octet-stream";
    return fetch(base + "/storage/v1/object/" + cfg.bucket + "/" + caminho, {
      method: "POST",
      headers: cabecalhos({ "Content-Type": tipo, "x-upsert": "false" }),
      body: arquivo
    }).then(checar);
  }
  function gravarRegistro(registro) {
    return fetch(base + "/rest/v1/" + cfg.tabela, {
      method: "POST",
      headers: cabecalhos({ "Content-Type": "application/json", Prefer: "return=minimal" }),
      body: JSON.stringify(registro)
    }).then(checar);
  }

  function mensagem(texto, erro) {
    statusEl.textContent = texto;
    statusEl.className = "status" + (erro ? " status--error" : "");
  }
  function travar(sim) {
    botao.disabled = sim;
    botao.textContent = sim ? "Enviando..." : "Enviar cadastro e documentos";
  }
  function mostrarSucesso(id) {
    protocoloEl.textContent = String(id).slice(0, 8).toUpperCase();
    form.hidden = true;
    sucesso.hidden = false;
    sucesso.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function enviar() {
    var id = novoId();
    var caminhos = {};
    var i = 0;
    travar(true);

    function proximo() {
      if (i >= ARQUIVOS.length) { return gravar(); }
      var nome = ARQUIVOS[i];
      var arq = form.elements[nome].files[0];
      var ext = extensao(arq.name);
      var caminho = id + "/" + nome + "." + ext;
      mensagem("Enviando documento " + (i + 1) + " de " + ARQUIVOS.length + "...", false);
      return enviarArquivo(caminho, arq, ext).then(function () {
        caminhos[nome] = caminho;
        i++;
        return proximo();
      });
    }

    function gravar() {
      mensagem("Finalizando o cadastro...", false);
      return gravarRegistro({
        id: id,
        nome: form.elements.nome.value.trim(),
        rg: form.elements.rg.value.trim(),
        matricula: form.elements.matricula.value.trim(),
        cpf: digitos(form.elements.cpf.value),
        telefone: digitos(form.elements.telefone.value),
        email: form.elements.email.value.trim(),
        cep: digitos(form.elements.cep.value),
        endereco: form.elements.endereco.value.trim(),
        arquivos: caminhos,
        declaracoes: { decl1: true, decl2: true, decl3: true, aceitas_em: new Date().toISOString() }
      });
    }

    proximo().then(function () {
      mensagem("", false);
      mostrarSucesso(id);
    }).catch(function () {
      travar(false);
      mensagem("Não foi possível enviar agora. Seus dados continuam na tela. Confira a internet e tente de novo. Se o erro continuar, fale com a UNEPPE pelo WhatsApp.", true);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.elements.website.value) { mostrarSucesso("00000000"); return; } // robô
    limparErros();
    mensagem("", false);
    var primeiro = validar();
    if (primeiro) {
      mensagem("Confira os campos destacados.", true);
      primeiro.focus();
      return;
    }
    enviar();
  });
})();
