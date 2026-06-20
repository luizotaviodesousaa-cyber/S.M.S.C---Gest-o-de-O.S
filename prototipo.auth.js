document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});

function initAuth() {
  const loginBtn = document.getElementById('login-btn');
  const showRegisterBtn = document.getElementById('show-register');
  const cancelRegisterBtn = document.getElementById('cancel-register');
  const registerBtn = document.getElementById('register-btn');
  const profileBtn = document.getElementById('profile-btn');
  const photoInput = document.getElementById('profile-photo-input');

  loginBtn && loginBtn.addEventListener('click', handleLogin);
  showRegisterBtn && showRegisterBtn.addEventListener('click', () => toggleRegister(true));
  cancelRegisterBtn && cancelRegisterBtn.addEventListener('click', () => toggleRegister(false));
  registerBtn && registerBtn.addEventListener('click', handleRegister);
  profileBtn && profileBtn.addEventListener('click', () => {
    const menu = document.getElementById('profile-menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  });
  photoInput && photoInput.addEventListener('change', handleProfilePhotoUpload);

  document.addEventListener('click', (e) => {
    const area = document.getElementById('profile-area');
    const menu = document.getElementById('profile-menu');
    if (!area || !menu) return;
    if (!area.contains(e.target)) menu.style.display = 'none';
  });

  // seed admin if missing
  const usersExisting = getUsers();
  if (!usersExisting.some(u => u.role === 'admin')) {
    usersExisting.push({ name: 'Administrador', email: 'admin@local', password: 'admin123', role: 'admin' });
    saveUsers(usersExisting);
    console.log('Admin seeded: admin@local / admin123');
  }
  checkAuthState();
}

// Storage helpers
function getUsers() { return JSON.parse(localStorage.getItem('users') || '[]'); }
function saveUsers(users) { localStorage.setItem('users', JSON.stringify(users)); }
function getCurrentUserEmail() { return localStorage.getItem('currentUserEmail'); }
function setCurrentUserEmail(email) { localStorage.setItem('currentUserEmail', email); }
function clearCurrentUserEmail() { localStorage.removeItem('currentUserEmail'); }

function checkAuthState() {
  const email = getCurrentUserEmail();
  if (email) showAppForUser(email);
  else showLoginScreen();
}

function showLoginScreen() {
  const modal = document.getElementById('login-modal');
  const app = document.getElementById('app-root');
  if (app) app.style.display = 'none';
  if (!modal) return;
  modal.style.display = 'flex';
}

function hideLoginScreen() {
  const modal = document.getElementById('login-modal');
  const app = document.getElementById('app-root');
  if (modal) modal.style.display = 'none';
  if (app) app.style.display = 'block';
}

function showAppForUser(email) {
  hideLoginScreen();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  const profileBtn = document.getElementById('profile-btn');
  const profileMenu = document.getElementById('profile-menu');
  if (!user) { // if user missing, force logout
    clearCurrentUserEmail();
    showLoginScreen();
    return;
  }

  if (profileBtn) {
    profileBtn.innerHTML = '';
    profileBtn.style.display = 'inline-flex';
    profileBtn.style.alignItems = 'center';

    const avatar = document.createElement('span');
    avatar.className = 'profile-avatar';
    if (user.profilePhoto) {
      const img = document.createElement('img');
      img.src = user.profilePhoto;
      img.alt = 'Avatar';
      avatar.appendChild(img);
    } else {
      avatar.textContent = (user.name || user.email || 'U').charAt(0).toUpperCase();
      avatar.classList.add('placeholder');
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'profile-name';
    nameSpan.textContent = user.name || user.email;

    profileBtn.appendChild(avatar);
    profileBtn.appendChild(nameSpan);
  }
  if (profileMenu) {
    let menuHtml = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <span class="profile-avatar" style="margin:0;">${user.profilePhoto ? `<img src="${user.profilePhoto}" alt="Avatar">` : escapeHtml((user.name || user.email || 'U').charAt(0).toUpperCase())}</span>
        <div>
          <p style="margin:0; font-weight:bold;">${escapeHtml(user.name)}</p>
          <p style="margin:0; color:#666; font-size:13px;">${escapeHtml(user.email)}</p>
        </div>
      </div>
      <button class="btn btn-danger logout-btn" id="logout-btn">Sair</button>
    `;
    if ((user.role || 'user') === 'admin') {
      menuHtml += `<div style="margin-top:8px;"><button class="btn btn-warning" id="admin-panel-open">Admin Panel</button></div>`;
    }
    menuHtml += `<div style="margin-top:8px;"><button class="btn btn-primary" id="profile-photo-change">Alterar foto</button></div>`;
    profileMenu.innerHTML = menuHtml;
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn && logoutBtn.addEventListener('click', () => { doLogout(); });
    const adminOpen = document.getElementById('admin-panel-open');
    adminOpen && adminOpen.addEventListener('click', () => { openAdminPanel(); });
    const photoChange = document.getElementById('profile-photo-change');
    photoChange && photoChange.addEventListener('click', () => {
      const photoInput = document.getElementById('profile-photo-input');
      if (photoInput) photoInput.click();
    });
  }
}

function renderProfileButton(user) {
  const profileBtn = document.getElementById('profile-btn');
  if (!profileBtn) return;
  profileBtn.innerHTML = '';
  profileBtn.style.display = 'inline-flex';
  profileBtn.style.alignItems = 'center';
  profileBtn.style.gap = '8px';

  const avatar = document.createElement('span');
  avatar.className = 'profile-avatar';
  if (user.profilePhoto) {
    const img = document.createElement('img');
    img.src = user.profilePhoto;
    img.alt = 'Avatar';
    avatar.appendChild(img);
  } else {
    avatar.textContent = (user.name || user.email || 'U').charAt(0).toUpperCase();
    avatar.classList.add('placeholder');
  }

  const nameSpan = document.createElement('span');
  nameSpan.className = 'profile-name';
  nameSpan.textContent = user.name || user.email;

  profileBtn.appendChild(avatar);
  profileBtn.appendChild(nameSpan);
}

function handleLogin() {
  const email = (document.getElementById('login-email').value || '').trim().toLowerCase();
  const password = (document.getElementById('login-password').value || '');
  const err = document.getElementById('login-error');
  err.style.display = 'none';

  if (!email || !password) {
    showLoginError('Informe email e senha.');
    return;
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email);
  if (!user) {
    showLoginError('Email não cadastrado. Deseja criar uma conta?');
    toggleRegister(true);
    document.getElementById('reg-email').value = email;
    return;
  }

  if (user.password !== password) {
    showLoginError('Senha incorreta.');
    return;
  }

  setCurrentUserEmail(user.email);
  showAppForUser(user.email);
}

function showLoginError(msg) {
  const err = document.getElementById('login-error');
  if (!err) return;
  err.innerText = msg; err.style.display = 'block';
}

function toggleRegister(show) {
  const reg = document.getElementById('register-form');
  if (!reg) return;
  reg.style.display = show ? 'block' : 'none';
}

async function handleRegister() {
  const name = (document.getElementById('reg-name').value || '').trim();
  const email = (document.getElementById('reg-email').value || '').trim().toLowerCase();
  const password = (document.getElementById('reg-password').value || '');
  const photoInput = document.getElementById('reg-photo');

  if (!name || !email || !password) { alert('Preencha nome, email e senha.'); return; }

  const users = getUsers();
  if (users.some(u => u.email.toLowerCase() === email)) { alert('Este email já está cadastrado.'); return; }

  let profilePhoto = null;
  if (photoInput && photoInput.files && photoInput.files[0]) {
    const file = photoInput.files[0];
    if (!file.type.startsWith('image/')) { alert('Escolha uma imagem de perfil válida.'); return; }
    try {
      profilePhoto = await readFileAsDataURL(file);
    } catch (err) {
      alert('Erro ao carregar a imagem de perfil.');
      return;
    }
  }

  users.push({ name: name, email: email, password: password, role: 'user', profilePhoto: profilePhoto });
  saveUsers(users);
  setCurrentUserEmail(email);
  toggleRegister(false);
  hideLoginScreen();
  showAppForUser(email);
  alert('Conta criada com sucesso.');
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function handleProfilePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Escolha uma imagem de perfil válida.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const photoUrl = e.target.result;
    const users = getUsers();
    const currentEmail = getCurrentUserEmail();
    if (!currentEmail) return;

    const user = users.find(u => u.email.toLowerCase() === currentEmail.toLowerCase());
    if (!user) return;

    user.profilePhoto = photoUrl;
    saveUsers(users);
    setCurrentUserEmail(user.email);
    renderProfileButton(user);
    showAppForUser(user.email);
    event.target.value = '';
  };
  reader.readAsDataURL(file);
}

function doLogout() {
  clearCurrentUserEmail();
  // simple reload to reset UI state
  location.reload();
}

/* Admin features */
function openAdminPanel() {
  const panel = document.getElementById('admin-panel');
  if (!panel) return;
  panel.style.display = 'flex';
  adminListUsers();
  adminListOS();
}
function closeAdminPanel() {
  const panel = document.getElementById('admin-panel');
  if (panel) panel.style.display = 'none';
}
function adminListUsers() {
  const container = document.getElementById('admin-users-list');
  if (!container) return;
  const users = getUsers();
  if (users.length === 0) { container.innerHTML = '<div>Nenhum usuário.</div>'; return; }
  let html = '<table style="width:100%"><thead><tr><th>Nome</th><th>Email</th><th>Role</th><th>Ação</th></tr></thead><tbody>';
  users.forEach(u => {
    const canRemove = (u.email.toLowerCase() !== (getCurrentUserEmail()||'').toLowerCase());
    html += `<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td>${escapeHtml(u.role||'user')}</td><td>${canRemove?`<button class="btn btn-danger" onclick="adminDeleteUser('${escapeHtml(u.email)}')">Remover</button>`:''}</td></tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}
function adminDeleteUser(email) {
  if (!confirm('Remover usuário ' + email + ' ?')) return;
  let users = getUsers();
  users = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
  saveUsers(users);
  adminListUsers();
  alert('Usuário removido.');
}
function adminResetCounter() {
  const input = document.getElementById('admin-reset-input');
  const v = parseInt(input.value) || 1;
  localStorage.setItem('proximoNumero', v);
  window.proximoNumero = v;
  if (window.atualizarNumeracaoJanela) window.atualizarNumeracaoJanela();
  if (window.atualizarPainel) window.atualizarPainel();
  alert('Contador atualizado para ' + v);
}
function adminListOS() {
  const container = document.getElementById('admin-os-list');
  if (!container) return;
  const ords = JSON.parse(localStorage.getItem('ordensDeServico') || '[]');
  if (!ords.length) { container.innerHTML = '<div>Nenhuma O.S.</div>'; return; }
  let html = '<table style="width:100%"><thead><tr><th>Nº</th><th>Cliente</th><th>Valor</th><th>Ação</th></tr></thead><tbody>';
  ords.forEach(o => {
    html += `<tr><td>${o.numero}</td><td>${escapeHtml(o.cliente)}</td><td>${escapeHtml(o.valorTotalFormatado)}</td><td><button class="btn btn-primary" onclick="adminEditOS(${o.numero})">Editar</button> <button class="btn btn-danger" onclick="adminDeleteOS(${o.numero})">Excluir</button></td></tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}
function adminDeleteOS(numero) {
  if (!confirm('Excluir O.S. Nº ' + numero + ' ?')) return;
  if (window.excluirOS) window.excluirOS(numero);
  adminListOS();
}
function adminEditOS(numero) {
  window.isAdminEditing = true;
  if (window.visualizarOSSalva) window.visualizarOSSalva(numero);
  const panel = document.getElementById('admin-panel'); if (panel) panel.style.display = 'none';
  const saveBtn = document.getElementById('btn-save-edits'); if (saveBtn) saveBtn.style.display = 'inline-block';
}
function salvarAlteracoesOS() {
  if (typeof osSendoVisualizadaAtualmente === 'undefined' || !osSendoVisualizadaAtualmente) { alert('Nenhuma O.S. selecionada.'); return; }
  const numero = osSendoVisualizadaAtualmente;
  const os = ordensDeServico.find(o => o.numero === numero);
  if (!os) { alert('O.S. não encontrada.'); return; }

  // read fields
  os.tipo = document.getElementById('form-tipo-servico').value;
  os.prazo = document.getElementById('form-prazo').value;
  os.cliente = document.getElementById('form-cliente').value;
  os.documento = document.getElementById('form-documento').value;
  os.celular = document.getElementById('form-celular').value;
  os.endereco = document.getElementById('form-endereco').value;
  os.equipModelo = document.getElementById('form-equip-modelo').value;
  os.equipSerie = document.getElementById('form-equip-serie').value;
  os.escopo = document.getElementById('form-escopo').value;
  os.formaPagamento = document.getElementById('form-forma-pagamento').value;

  // items
  let itensOS = [];
  document.querySelectorAll('#corpo-tabela-itens tr').forEach(linha => {
    itensOS.push({ desc: linha.querySelector('.item-desc').value, qtd: linha.querySelector('.item-qtd').value, val: linha.querySelector('.item-val').value });
  });
  os.itens = itensOS;
  // recalcular total formatado
  const total = typeof calcularTotalOS === 'function' ? calcularTotalOS() : 0;
  os.valorTotalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  localStorage.setItem('ordensDeServico', JSON.stringify(ordensDeServico));
  window.isAdminEditing = false;
  const saveBtn = document.getElementById('btn-save-edits'); if (saveBtn) saveBtn.style.display = 'none';
  alert('Alterações salvas.');
  if (typeof atualizarPainel === 'function') atualizarPainel();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]);
}
