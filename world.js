/* world.js
   Código comentado e simples para entender passo a passo.
   - Armazena carrinho em localStorage (key: 'wc_cart')
   - Armazena usuários em localStorage (key: 'wc_users'), currentUser (wc_current)
*/

// ---------- Utilitários ----------
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const toCurrency = num => Number(num).toFixed(2);

// ---------- CARRINHO (localStorage) ----------
const CART_KEY = 'wc_cart';
function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  refreshCartUI();
}

// Adiciona item ao carrinho
function addToCart(item) {
  const cart = getCart();
  // item = {id, name, price, size, color, qty}
  const existsIndex = cart.findIndex(ci => ci.id === item.id && ci.size === item.size && ci.color === item.color);
  if (existsIndex >= 0) {
    cart[existsIndex].qty += item.qty;
  } else {
    cart.push(item);
  }
  saveCart(cart);
  alert('Produto adicionado ao carrinho');
}

// Remove item
function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index,1);
  saveCart(cart);
}

// Atualiza quantidade de item
function updateQty(index, qty) {
  const cart = getCart();
  cart[index].qty = qty;
  saveCart(cart);
}

// Atualiza UI do carrinho (se página de carrinho presente)
function refreshCartUI() {
  const cartItemsElem = $('#cart-items');
  const cartCount = $('#cart-count');
  const cartTotal = $('#cart-total');
  if (!cartItemsElem) return;
  const cart = getCart();
  cartItemsElem.innerHTML = '';
  let total = 0;
  cart.forEach((it, idx) => {
    total += it.price * it.qty;
    const box = document.createElement('div');
    box.className = 'cart-item';
    box.innerHTML = `
      <p><strong>${it.name}</strong> - R$ ${toCurrency(it.price)}</p>
      <p>Tamanho: ${it.size} • Cor: ${it.color}</p>
      <p>Quantidade: <input type="number" min="1" value="${it.qty}" data-idx="${idx}" class="cart-qty"></p>
      <p><button data-remove="${idx}" class="btn-remove">Remover</button></p>
      <hr>
    `;
    cartItemsElem.appendChild(box);
  });
  cartCount && (cartCount.textContent = cart.reduce((s,i)=>s+i.qty,0));
  cartTotal && (cartTotal.textContent = toCurrency(total));
  // event listeners para inputs/remover
  $$('.cart-qty').forEach(inp => {
    inp.addEventListener('change', (e)=>{
      const idx = Number(e.target.dataset.idx);
      let val = Number(e.target.value);
      if (val < 1) val = 1;
      updateQty(idx, val);
    });
  });
  $$('.btn-remove').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const idx = Number(e.target.dataset.remove);
      removeFromCart(idx);
    });
  });
}

// Checkout simulado
function checkout() {
  const cart = getCart();
  if (!cart.length) { alert('Seu carrinho está vazio.'); return; }
  // Verifica usuário logado
  const current = localStorage.getItem('wc_current');
  if (!current) {
    if (confirm('Você precisa estar logado para finalizar compra. Deseja entrar agora?')) {
      window.location.href = 'login.html';
      return;
    } else {
      return;
    }
  }
  // Simular finalização
  localStorage.removeItem(CART_KEY);
  refreshCartUI();
  $('#checkout-feedback') && ($('#checkout-feedback').textContent = 'Compra finalizada. Obrigado!');
  alert('Compra simulada com sucesso!');
}

// ---------- USUÁRIOS (localStorage) ----------
const USERS_KEY = 'wc_users';
function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveUser(user) {
  // user = {name, email, password}
  const users = getUsers();
  if (users.find(u => u.email === user.email)) return false;
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
}
function loginUser(email, password) {
  const users = getUsers();
  const u = users.find(x=>x.email===email && x.password===password);
  if (!u) return false;
  localStorage.setItem('wc_current', JSON.stringify(u));
  return true;
}
function logoutUser() {
  localStorage.removeItem('wc_current');
}

// ---------- MODAL DE PRODUTO ----------
function openProductModal(prodEl) {
  const modal = document.getElementById('produto-modal');
  if (!modal) return;
  const modalBody = modal.querySelector('#modal-body') || modal.querySelector('#modal-body-colecao');
  // Lê dados do produto
  const id = prodEl.dataset.id;
  const name = prodEl.dataset.name;
  const price = Number(prodEl.dataset.price);
  const colors = JSON.parse(prodEl.dataset.colors || '[]');
  const sizes = JSON.parse(prodEl.dataset.sizes || '[]');

  modalBody.innerHTML = `
    <h3>${name}</h3>
    <p>R$ ${toCurrency(price)}</p>
    <div>
      <label>Tamanho:</label>
      <select id="select-size">${sizes.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
    </div>
    <div>
      <label>Cor:</label>
      <select id="select-color">${colors.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
    </div>
    <div>
      <label>Quantidade:</label>
      <input id="select-qty" type="number" min="1" value="1">
    </div>
    <div style="margin-top:10px">
      <button id="modal-add">Adicionar ao carrinho</button>
    </div>
  `;
  modal.classList.remove('hidden');

  // listener para adicionar
  modal.querySelector('#modal-add').onclick = () => {
    const size = modal.querySelector('#select-size').value;
    const color = modal.querySelector('#select-color').value;
    const qty = Number(modal.querySelector('#select-qty').value || 1);
    addToCart({ id: id, name: name, price: price, size: size, color: color, qty: qty });
    modal.classList.add('hidden');
  };
}

// Fecha modal
function closeModal() {
  const modal = document.getElementById('produto-modal');
  if (modal) modal.classList.add('hidden');
}

// ---------- FILTROS (colecao) ----------
function applyFilters() {
  const gender = document.getElementById('filtro-genero')?.value || 'todos';
  const category = document.getElementById('filtro-categoria')?.value || 'todos';
  const search = document.getElementById('buscar-produto')?.value.toLowerCase() || '';
  const items = $$('.produtos .produto');
  items.forEach(it => {
    const itGender = (it.dataset.gender || '').toLowerCase();
    const itCategory = (it.dataset.category || '').toLowerCase();
    const itName = (it.dataset.name || '').toLowerCase();
    let visible = true;
    if (gender !== 'todos' && itGender !== gender) visible = false;
    if (category !== 'todos' && itCategory !== category) visible = false;
    if (search && !itName.includes(search)) visible = false;
    it.style.display = visible ? '' : 'none';
  });
}

// ---------- CONTATO (form) ----------
function setupContactForm() {
  const form = $('#contact-form');
  if (!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = $('#cont-name').value;
    const email = $('#cont-email').value;
    const msg = $('#cont-msg').value;
    // Simular envio por mailto (não envia via servidor) — também pode integrar backend depois
    const mailto = `mailto:worldcountry@gmail.com?subject=Contato%20de%20${encodeURIComponent(name)}&body=${encodeURIComponent(msg + '\n\nEmail: ' + email)}`;
    window.location.href = mailto;
    $('#contact-feedback').textContent = 'Seu e-mail foi aberto no cliente de e-mail. Caso não abra, copie a mensagem e envie para worldcountry@gmail.com';
    $('#contact-feedback').classList.remove('hidden');
    form.reset();
  });
}

// ---------- AUTENTICAÇÃO (forms) ----------
function setupAuthForms() {
  // Register
  const reg = $('#register-form');
  if (reg) {
    reg.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = $('#reg-name').value.trim();
      const email = $('#reg-email').value.trim();
      const pass = $('#reg-password').value;
      if (!name || !email || !pass) { $('#register-feedback').textContent = 'Preencha todos os campos.'; return; }
      if (saveUser({name, email, password: pass})) {
        $('#register-feedback').textContent = 'Cadastro realizado. Você pode entrar agora.';
        setTimeout(()=>{ window.location.href = 'login.html'; }, 900);
      } else {
        $('#register-feedback').textContent = 'Já existe um usuário com esse e-mail.';
      }
    });
  }
  // Login
  const ln = $('#login-form');
  if (ln) {
    ln.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = $('#login-email').value.trim();
      const pass = $('#login-password').value;
      if (loginUser(email, pass)) {
        $('#login-feedback').textContent = 'Login realizado.';
        setTimeout(()=>{ window.location.href = 'index.html'; }, 700);
      } else {
        $('#login-feedback').textContent = 'E-mail ou senha inválidos.';
      }
    });
  }

  // Mostrar nome do usuário no link (se logado)
  const current = localStorage.getItem('wc_current');
  if (current) {
    const u = JSON.parse(current);
    $('#login-link')?.setAttribute('href','login.html');
    $('#login-link').textContent = `Olá, ${u.name.split(' ')[0]}`;
    $('#login-link-2')?.setAttribute('href','login.html');
    $('#login-link-3')?.setAttribute('href','login.html');
    $('#login-link-4')?.setAttribute('href','login.html');
  }
}

// ---------- EVENTOS GERAIS e BIND ----------
document.addEventListener('DOMContentLoaded', ()=>{

  // Botões detalhes e adicionar (em todas páginas)
  $$('.btn-detalhes').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      const prod = e.target.closest('.produto');
      openProductModal(prod);
    });
  });

  $$('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      const prod = e.target.closest('.produto');
      // Se o produto tiver opções (tamanho/cor), abrir modal; caso contrário, add direto com defaults
      const sizes = JSON.parse(prod.dataset.sizes || '[]');
      const colors = JSON.parse(prod.dataset.colors || '[]');
      if (sizes.length > 1 || colors.length > 0) {
        openProductModal(prod);
      } else {
        addToCart({
          id: prod.dataset.id,
          name: prod.dataset.name,
          price: Number(prod.dataset.price),
          size: sizes[0] || 'Único',
          color: colors[0] || 'Padrão',
          qty: 1
        });
      }
    });
  });

  // Fechar modal
  document.addEventListener('click', (e)=>{
    if (e.target.classList.contains('modal')) closeModal();
    if (e.target.id === 'close-modal' || e.target.id === 'close-modal-colecao') closeModal();
  });

  // Filtros
  $('#aplicar-filtro')?.addEventListener('click', applyFilters);

  // Carregamento do carrinho na página carrinho
  refreshCartUI();
  $('#checkout-button')?.addEventListener('click', checkout);

  // Setup contact form
  setupContactForm();

  // Setup auth forms
  setupAuthForms();

  // Se houver botão de checkout no formulário de checkout fictício, etc.
});
