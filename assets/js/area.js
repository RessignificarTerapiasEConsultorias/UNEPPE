(function () {
  "use strict";

  var cfg = window.UNEPPE_CONFIG || {};
  var configurado = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  var base = configurado ? String(cfg.supabaseUrl).replace(/\/+$/, "") : "";
  var CHAVE = "uneppe_sessao";

  var aviso = document.getElementById("avisoConfig");
  var telaLogin = document.getElementById("telaLogin");
  var telaPainel = document.getElementById("telaPainel");
  var form = document.getElementById("formLogin");
  var botaoEntrar = document.getElementById("botaoEntrar");
  var botaoSair = document.getElementById("botaoSair");
  var statusEl = document.getElementById("statusLogin");
  var usuarioEmail = document.getElementById("usuarioEmail");

  function mensagem(texto, erro) {
    statusEl.textContent = texto;
    statusEl.className = "status" + (erro ? " status--error" : "");
  }
  function guardar(sessao) { try { sessionStorage.setItem(CHAVE, JSON.stringify(sessao)); } catch (e) {} }
  function lerSessao() { try { return JSON.parse(sessionStorage.getItem(CHAVE) || "null"); } catch (e) { return null; } }
  function limparSessao() { try { sessionStorage.removeItem(CHAVE); } catch (e) {} }

  function mostrarPainel(email) {
    usuarioEmail.textContent = email || "";
    telaLogin.hidden = true;
    telaPainel.hidden = false;
  }
  function mostrarLogin() {
    telaPainel.hidden = true;
    telaLogin.hidden = false;
  }

  if (!configurado) {
    aviso.hidden = false;
    botaoEntrar.disabled = true;
    form.querySelectorAll("input").forEach(function (el) { el.disabled = true; });
    return;
  }

  function cabecalhos(token) {
    return { apikey: cfg.supabaseAnonKey, Authorization: "Bearer " + (token || cfg.supabaseAnonKey), "Content-Type": "application/json" };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = form.elements.email.value.trim();
    var senha = form.elements.senha.value;
    if (!email || !senha) { mensagem("Digite o e-mail e a senha.", true); return; }
    botaoEntrar.disabled = true;
    mensagem("Entrando...", false);

    fetch(base + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: cabecalhos(),
      body: JSON.stringify({ email: email, password: senha })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (dados) { return { ok: res.ok, dados: dados }; });
    }).then(function (r) {
      botaoEntrar.disabled = false;
      if (!r.ok || !r.dados.access_token) {
        mensagem("E-mail ou senha incorretos.", true);
        return;
      }
      form.elements.senha.value = "";
      mensagem("", false);
      var emailUsuario = (r.dados.user && r.dados.user.email) || email;
      guardar({ token: r.dados.access_token, email: emailUsuario });
      mostrarPainel(emailUsuario);
    }).catch(function () {
      botaoEntrar.disabled = false;
      mensagem("Não foi possível conectar. Tente de novo.", true);
    });
  });

  botaoSair.addEventListener("click", function () {
    var sessao = lerSessao();
    limparSessao();
    mostrarLogin();
    if (sessao && sessao.token) {
      fetch(base + "/auth/v1/logout", { method: "POST", headers: cabecalhos(sessao.token) }).catch(function () {});
    }
  });

  /* Retoma a sessão da aba, se ainda for válida */
  var salva = lerSessao();
  if (salva && salva.token) {
    fetch(base + "/auth/v1/user", { headers: cabecalhos(salva.token) }).then(function (res) {
      if (res.ok) { mostrarPainel(salva.email); } else { limparSessao(); }
    }).catch(function () {});
  }
})();
