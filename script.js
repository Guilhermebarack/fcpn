/* ==========================================================================
   FCPN - Lógica e Interações
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. TELA DE CARREGAMENTO (LOADER)
       ========================================================================== */
    const loader = document.getElementById('loader');
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600);
        }, 800); // Garante um carregamento suave mínimo e sensação premium
    });

    /* ==========================================================================
       2. ROTEAMENTO SPA (SINGLE PAGE APPLICATION)
       ========================================================================== */
    const navLinks = document.querySelectorAll('.nav-link, .btn-nav-trigger');
    const sections = document.querySelectorAll('.section-pane');
    const header = document.querySelector('.glass-header');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');

    function switchSection(targetId) {
        // Encontra a seção correspondente
        const targetSection = document.getElementById(targetId);
        if (!targetSection) return;

        // Fecha menu de celular caso aberto
        navMenu.classList.remove('mobile-active');

        // Remove classes ativas de todas as seções e links
        sections.forEach(sec => sec.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

        // Ativa a seção alvo
        targetSection.classList.add('active');
        
        // Ativa o link correspondente no cabeçalho
        const activeLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Rola até o topo de forma suave
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Atualiza a URL hash sem quebrar a navegação
        if (window.location.hash !== `#${targetId}`) {
            history.pushState(null, null, `#${targetId}`);
        }
    }

    // Gerencia cliques nos links de navegação
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            switchSection(targetId);
        });
    });

    // Controla botão do logotipo para voltar à home
    document.getElementById('logo-trigger').addEventListener('click', (e) => {
        e.preventDefault();
        switchSection('home');
    });

    // Gerencia o histórico do navegador (botão voltar/avançar)
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.substring(1) || 'home';
        switchSection(hash);
    });

    // Roteamento inicial baseado no Hash da URL
    const initialHash = window.location.hash.substring(1) || 'home';
    // Se o carregamento total for lento, executa o switch
    switchSection(initialHash);



    // Menu Mobile Toggle
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('mobile-active');
    });

    // Fecha menu mobile ao clicar fora dele
    document.addEventListener('click', (e) => {
        if (!header.contains(e.target) && navMenu.classList.contains('mobile-active')) {
            navMenu.classList.remove('mobile-active');
        }
    });

    /* ==========================================================================
       3. ANIMAÇÃO DE SINAPSES (CANVAS DE PARTÍCULAS INTERATIVAS)
       ========================================================================== */
    const canvas = document.getElementById('synapse-canvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    let mouse = { x: null, y: null, radius: 150 };

    // Redimensionamento responsivo
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }
    window.addEventListener('resize', resizeCanvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Monitoramento do mouse
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Classe de Partícula (Neurônio)
    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
            this.baseSize = size;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            // Verifica limites da tela para rebater
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            // Interação com o mouse (efeito de sinapse ativa / repulsão suave)
            if (mouse.x !== null && mouse.y !== null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    // Atrai levemente as partículas em direção ao mouse
                    let forceDirectionX = dx / distance;
                    let forceDirectionY = dy / distance;
                    let force = (mouse.radius - distance) / mouse.radius;
                    
                    this.x += forceDirectionX * force * 1.2;
                    this.y += forceDirectionY * force * 1.2;
                    
                    // Aumenta o tamanho (impulso elétrico)
                    this.size = this.baseSize * 1.8;
                } else {
                    if (this.size > this.baseSize) {
                        this.size -= 0.1;
                    }
                }
            } else {
                if (this.size > this.baseSize) {
                    this.size -= 0.1;
                }
            }

            // Movimento regular
            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    // Inicializa Array de Partículas baseando-se na largura de tela
    function initParticles() {
        particles = [];
        let numberOfParticles = (canvas.width * canvas.height) / 12000;
        if (numberOfParticles > 120) numberOfParticles = 120; // Limite para evitar lentidão

        const isDark = document.body.classList.contains('dark-theme');
        const color = isDark ? 'rgba(0, 210, 255, 0.4)' : 'rgba(0, 119, 182, 0.35)';

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1.2;
            let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;

            particles.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    // Conecta partículas próximas por linhas (Rede Neural)
    function connectParticles() {
        const isDark = document.body.classList.contains('dark-theme');
        let maxDistance = 110;
        
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    // Opacidade da linha baseia-se na proximidade
                    let opacity = (1 - (distance / maxDistance)) * 0.18;
                    ctx.strokeStyle = isDark 
                        ? `rgba(0, 210, 255, ${opacity})`
                        : `rgba(0, 119, 182, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }

            // Conecta partículas ao mouse de forma ativa
            if (mouse.x !== null && mouse.y !== null) {
                let dx = particles[a].x - mouse.x;
                let dy = particles[a].y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    let opacity = (1 - (distance / mouse.radius)) * 0.28;
                    ctx.strokeStyle = isDark 
                        ? `rgba(157, 78, 221, ${opacity})` // Brilho roxo ao interagir no dark
                        : `rgba(114, 9, 183, ${opacity})`;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
    }

    // Loop de Animação
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
        connectParticles();
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();

    /* ==========================================================================
       4. SELETOR DE TEMA (DARK/LIGHT MODE)
       ========================================================================== */
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Recupera tema salvo ou detecta o do sistema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.className = savedTheme;
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.className = prefersDark ? 'dark-theme' : 'light-theme';
    }

    themeToggleBtn.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.replace('dark-theme', 'light-theme');
            localStorage.setItem('theme', 'light-theme');
        } else {
            document.body.classList.replace('light-theme', 'dark-theme');
            localStorage.setItem('theme', 'dark-theme');
        }
        // Reinicializa a cor das partículas para combinar com o novo tema
        initParticles();
    });

    /* ==========================================================================
       5. PORTAL DA TRANSPARÊNCIA (BUSCA E FILTRO)
       ========================================================================== */
    const docSearch = document.getElementById('doc-search');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const docCards = document.querySelectorAll('.doc-card');

    function filterDocs() {
        const query = docSearch.value.toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');

        docCards.forEach(card => {
            const docTitle = card.querySelector('h4').innerText.toLowerCase();
            const docDesc = card.querySelector('p').innerText.toLowerCase();
            const docCategory = card.getAttribute('data-category');

            const matchesSearch = docTitle.includes(query) || docDesc.includes(query);
            const matchesFilter = activeFilter === 'all' || docCategory === activeFilter;

            if (matchesSearch && matchesFilter) {
                card.style.display = 'flex';
                card.style.animation = 'fadeIn 0.3s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });
    }

    docSearch.addEventListener('input', filterDocs);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterDocs();
        });
    });

    /* ==========================================================================
       6. REGIMENTO INTERNO INTERATIVO (SUMÁRIO E PESQUISA)
       ========================================================================== */
    const regBtns = document.querySelectorAll('.reg-chapter-btn');
    const regBlocks = document.querySelectorAll('.reg-section-block');
    const regSearchInput = document.getElementById('regimento-search-input');
    const regTextContent = document.getElementById('regimento-text-content');

    // Mapeamento original para restauração fácil da busca
    const originalRegTexts = {};
    regBlocks.forEach(block => {
        originalRegTexts[block.id] = block.innerHTML;
    });

    // Alternar Capítulos do Regimento
    regBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            regBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetChapter = btn.getAttribute('data-chapter');
            regBlocks.forEach(block => {
                block.classList.remove('active');
                if (block.id === `chapter-${targetChapter}`) {
                    block.classList.add('active');
                }
            });
        });
    });

    // Sistema de Pesquisa Dinâmica no Regimento Interno com Realces (Highlights)
    regSearchInput.addEventListener('input', () => {
        const query = regSearchInput.value.trim().toLowerCase();

        if (query.length < 2) {
            // Restaura texto original
            regBlocks.forEach(block => {
                block.innerHTML = originalRegTexts[block.id];
            });
            return;
        }

        regBlocks.forEach(block => {
            let contentHtml = originalRegTexts[block.id];
            
            // Regex para buscar a query fora de tags HTML
            const regex = new RegExp(`(?![^<>]*>)(${query})`, 'gi');
            
            if (contentHtml.toLowerCase().includes(query)) {
                // Realiza substituição inserindo span de realce
                const newHtml = contentHtml.replace(regex, `<span class="search-highlight">$1</span>`);
                block.innerHTML = newHtml;
                
                // Se houver correspondência neste capítulo e ele estiver oculto, ativa sua exibição
                const chapterNav = block.id.replace('chapter-', '');
                const relatedBtn = document.querySelector(`.reg-chapter-btn[data-chapter="${chapterNav}"]`);
                
                // Força exibição do capítulo ativo da pesquisa para melhor usabilidade
                regBtns.forEach(b => b.classList.remove('active'));
                regBlocks.forEach(bl => bl.classList.remove('active'));
                
                if (relatedBtn) relatedBtn.classList.add('active');
                block.classList.add('active');
            } else {
                block.innerHTML = contentHtml;
            }
        });
    });

    /* ==========================================================================
       7. ENVIOS DE FORMULÁRIO (OUVIDORIA E TRABALHE CONOSCO)
       ========================================================================== */
    const ouvidoriaForm = document.getElementById('ouvidoria-form');
    const talentForm = document.getElementById('talent-form');

    // Ouvidoria
    ouvidoriaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = document.getElementById('form-type').value;
        const name = document.getElementById('form-name').value || 'Anônimo';
        const contact = document.getElementById('form-contact').value;
        const message = document.getElementById('form-message').value;

        // Assunto do e-mail
        const subject = encodeURIComponent(`Ouvidoria FCPN: Nova ${type} de ${name}`);
        
        // Corpo estruturado
        const bodyText = `Manifestação de Ouvidoria FCPN
--------------------------------------
Tipo: ${type}
Manifestante: ${name}
Informação de Retorno: ${contact}

Mensagem:
${message}
--------------------------------------
Mensagem gerada de forma automatizada pelo site institucional FCPN.`;

        const mailtoLink = `mailto:ouvidoria.fcpn@gmail.com?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

        // Abre cliente de e-mail local do usuário
        window.location.href = mailtoLink;

        alert('Sua mensagem de ouvidoria foi formatada! O seu cliente de e-mail padrão será aberto para conclusão do envio para ouvidoria.fcpn@gmail.com.');
        ouvidoriaForm.reset();
    });

    // Trabalhe Conosco / Banco de Talentos
    talentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('talent-name').value;
        const email = document.getElementById('talent-email').value;
        const area = document.getElementById('talent-area').value;

        // Feedback Premium de Sucesso simulando o envio
        alert(`Obrigado pelo seu cadastro, ${name}!\n\nSeu currículo para a área "${area}" foi recebido e integrado com sucesso ao Banco de Talentos da Fundação do Cérebro Paulo Niemeyer. Notificações serão enviadas para o e-mail: ${email} assim que novas vagas surgirem.`);
        
        talentForm.reset();
    });

    /* ==========================================================================
       8. SISTEMA DE LOGIN PARA MEMBROS
       ========================================================================== */
    const membersLoginForm = document.getElementById('members-login-form');
    const membersLoginContainer = document.getElementById('membros-login-container');
    const membersPortalContainer = document.getElementById('membros-portal-container');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const btnLogout = document.getElementById('btn-logout');
    const userDisplayEmail = document.getElementById('user-display-email');
    const adminManagementCard = document.getElementById('admin-management-card');
    const adminMembersList = document.getElementById('admin-members-list');

    const registerMemberForm = document.getElementById('register-member-form');
    const registerErrorMsg = document.getElementById('register-error-msg');
    const registerSuccessMsg = document.getElementById('register-success-msg');


    // ==========================================================================
    // INÍCIO DO SISTEMA MOCK (LOCALSTORAGE)
    // ==========================================================================
    function initMockDB() {
        if (!localStorage.getItem('fcpn_mock_db')) {
            const initialDB = [
                { id: 1, email: 'admin@fcpn.org', password: 'admin123', role: 'admin' },
                { id: 2, email: 'membro@fcpn.org', password: 'fcpn2026', role: 'member' }
            ];
            localStorage.setItem('fcpn_mock_db', JSON.stringify(initialDB));
        }
    }
    initMockDB();

    function getMockDB() {
        return JSON.parse(localStorage.getItem('fcpn_mock_db') || '[]');
    }

    function saveMockDB(db) {
        localStorage.setItem('fcpn_mock_db', JSON.stringify(db));
    }

    // Função para checar estado da sessão e atualizar a interface
    function checkLoginStatus() {
        const isLogged = sessionStorage.getItem('fcpn_member_logged') === 'true';
        const userEmail = sessionStorage.getItem('fcpn_member_email');
        const userRole = sessionStorage.getItem('fcpn_member_role');
        const portalContentGrid = document.querySelector('.portal-content-grid');
        const registerCard = document.querySelector('.register-member-card');
        const campaignCard = document.querySelector('.campaign-control-card');

        if (isLogged && userEmail) {
            if (membersLoginContainer) membersLoginContainer.classList.add('hidden');
            if (membersPortalContainer) membersPortalContainer.classList.remove('hidden');
            if (userDisplayEmail) userDisplayEmail.textContent = userEmail;

            if (portalContentGrid) portalContentGrid.classList.remove('hidden');

            if (userRole === 'admin') {
                if (registerCard) registerCard.classList.remove('hidden');
                if (campaignCard) campaignCard.classList.remove('hidden');
                if (adminManagementCard) adminManagementCard.classList.remove('hidden');
                loadMembers();
            } else {
                if (registerCard) registerCard.classList.add('hidden');
                if (campaignCard) campaignCard.classList.add('hidden');
                if (adminManagementCard) adminManagementCard.classList.add('hidden');
            }
        } else {
            if (membersLoginContainer) membersLoginContainer.classList.remove('hidden');
            if (membersPortalContainer) membersPortalContainer.classList.add('hidden');
            if (adminManagementCard) adminManagementCard.classList.add('hidden');
            if (portalContentGrid) portalContentGrid.classList.remove('hidden');
            
            if (registerCard) registerCard.classList.remove('hidden');
            if (campaignCard) campaignCard.classList.remove('hidden');
        }
    }

    // Listener de login (Mock LocalStorage)
    if (membersLoginForm) {
        membersLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('login-email').value.trim().toLowerCase();
            const passwordInput = document.getElementById('login-password').value;

            if (loginErrorMsg) loginErrorMsg.classList.add('hidden');

            const db = getMockDB();
            const user = db.find(u => u.email.toLowerCase() === emailInput && u.password === passwordInput);

            if (user) {
                sessionStorage.setItem('fcpn_member_logged', 'true');
                sessionStorage.setItem('fcpn_member_email', user.email);
                sessionStorage.setItem('fcpn_member_role', user.role);
                
                membersLoginForm.reset();
                checkLoginStatus();
                alert(`Login efetuado com sucesso! Bem-vindo, perfil: ${user.role === 'admin' ? 'Administrador' : 'Membro'}.`);
            } else {
                if (loginErrorMsg) {
                    loginErrorMsg.innerHTML = '❌ Credenciais inválidas. Tente novamente.';
                    loginErrorMsg.classList.remove('hidden');
                }
                const passField = document.getElementById('login-password');
                if (passField) passField.value = '';
            }
        });
    }

    // Listener de logout
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('fcpn_member_logged');
            sessionStorage.removeItem('fcpn_member_email');
            sessionStorage.removeItem('fcpn_member_role');
            sessionStorage.removeItem('fcpn_campaign'); 
            applyCampaign('default'); 
            checkLoginStatus();
            alert('Você saiu da Área de Membros.');
            switchSection('home'); 
        });
    }

    // Carregar membros (Mock)
    function loadMembers() {
        const userRole = sessionStorage.getItem('fcpn_member_role');
        if (userRole !== 'admin') return;
        const db = getMockDB();
        renderMembers(db);
    }

    // Renderizar lista
    function renderMembers(members) {
        if (!adminMembersList) return;
        adminMembersList.innerHTML = '';

        const currentUserEmail = sessionStorage.getItem('fcpn_member_email');

        members.forEach(member => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            
            const roleBadge = member.role === 'admin' 
                ? '<span style="background-color: rgba(0, 210, 255, 0.15); color: var(--accent-cyan); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 700;">Admin</span>' 
                : '<span style="background-color: rgba(255, 255, 255, 0.05); color: var(--text-secondary); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem;">Membro</span>';

            const isSelf = member.email.toLowerCase() === currentUserEmail.toLowerCase();
            
            let roleButton = '';
            if (!isSelf) {
                if (member.role === 'admin') {
                    roleButton = `<button class="btn admin-change-role-btn" data-id="${member.id}" data-email="${member.email}" data-role="member" style="background-color: rgba(230, 126, 34, 0.1); border: 1px solid #e67e22; color: #e67e22; padding: 0.35rem 0.8rem; border-radius: var(--border-radius-sm); font-size: 0.8rem; cursor: pointer; transition: all var(--transition-fast);">Tornar Membro</button>`;
                } else {
                    roleButton = `<button class="btn admin-change-role-btn" data-id="${member.id}" data-email="${member.email}" data-role="admin" style="background-color: rgba(46, 204, 113, 0.1); border: 1px solid #2ecc71; color: #2ecc71; padding: 0.35rem 0.8rem; border-radius: var(--border-radius-sm); font-size: 0.8rem; cursor: pointer; transition: all var(--transition-fast);">Tornar Admin</button>`;
                }
            }

            const actionButton = isSelf 
                ? '<span style="color: var(--text-secondary); font-size: 0.85rem; font-style: italic;">Você (Logado)</span>'
                : `<button class="btn admin-change-pass-btn" data-id="${member.id}" data-email="${member.email}" style="background-color: rgba(0, 210, 255, 0.1); border: 1px solid var(--accent-cyan); color: var(--accent-cyan); padding: 0.35rem 0.8rem; border-radius: var(--border-radius-sm); font-size: 0.8rem; cursor: pointer; transition: all var(--transition-fast);">Alterar Senha</button>` +
                  roleButton +
                  `<button class="btn delete-member-btn" data-id="${member.id}" data-email="${member.email}" style="background-color: rgba(255, 74, 74, 0.1); border: 1px solid #ff4a4a; color: #ff4a4a; padding: 0.35rem 0.8rem; border-radius: var(--border-radius-sm); font-size: 0.8rem; cursor: pointer; transition: all var(--transition-fast);">Excluir</button>`;

            tr.innerHTML = `
                <td style="padding: 0.8rem 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">${member.id}</td>
                <td style="padding: 0.8rem 0.5rem; font-weight: 500; font-size: 0.9rem; word-break: break-all;">${member.email}</td>
                <td style="padding: 0.8rem 0.5rem;">${roleBadge}</td>
                <td style="padding: 0.8rem 0.5rem;">
                    <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; align-items: center;">
                        ${actionButton}
                    </div>
                </td>
            `;
            adminMembersList.appendChild(tr);
        });

        const deleteButtons = adminMembersList.querySelectorAll('.delete-member-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const memberId = btn.getAttribute('data-id');
                const memberEmail = btn.getAttribute('data-email');
                if (confirm(`Atenção: Tem certeza que deseja excluir o membro "${memberEmail}"?`)) {
                    deleteMember(memberId);
                }
            });
        });

        const changePassButtons = adminMembersList.querySelectorAll('.admin-change-pass-btn');
        changePassButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const memberId = btn.getAttribute('data-id');
                const memberEmail = btn.getAttribute('data-email');
                
                const modal = document.getElementById('admin-password-modal');
                const modalEmail = document.getElementById('admin-modal-member-email');
                const modalIdInput = document.getElementById('admin-modal-member-id');
                const newPassInput = document.getElementById('admin-modal-new-pass');
                const errorMsg = document.getElementById('admin-modal-error-msg');
                const successMsg = document.getElementById('admin-modal-success-msg');

                if (modal && modalEmail && modalIdInput) {
                    modalEmail.textContent = memberEmail;
                    modalIdInput.value = memberId;
                    if (newPassInput) newPassInput.value = '';
                    if (errorMsg) errorMsg.classList.add('hidden');
                    if (successMsg) successMsg.classList.add('hidden');
                    modal.classList.remove('hidden');
                }
            });
        });

        const changeRoleButtons = adminMembersList.querySelectorAll('.admin-change-role-btn');
        changeRoleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const memberId = btn.getAttribute('data-id');
                const memberEmail = btn.getAttribute('data-email');
                const targetRole = btn.getAttribute('data-role');
                const roleName = targetRole === 'admin' ? 'Administrador' : 'Membro Padrão';
                
                if (confirm(`Deseja alterar o nível de acesso do membro "${memberEmail}" para ${roleName}?`)) {
                    adminChangeMemberRole(memberId, targetRole);
                }
            });
        });
    }

    // Excluir membro (Mock)
    function deleteMember(id) {
        const userRole = sessionStorage.getItem('fcpn_member_role');
        if (userRole !== 'admin') return;
        let db = getMockDB();
        db = db.filter(m => m.id !== parseInt(id));
        saveMockDB(db);
        alert('Membro excluído com sucesso!');
        loadMembers();
    }

    // Alterar Cargo (Mock)
    function adminChangeMemberRole(userId, newRole) {
        const userRole = sessionStorage.getItem('fcpn_member_role');
        if (userRole !== 'admin') return;
        let db = getMockDB();
        let user = db.find(m => m.id === parseInt(userId));
        if (user) {
            user.role = newRole;
            saveMockDB(db);
            alert(`Nível de acesso alterado para ${newRole === 'admin' ? 'Administrador' : 'Membro Padrão'}!`);
            loadMembers();
        } else {
            alert('Membro não encontrado.');
        }
    }

    // Cadastrar Membro via form
    if (registerMemberForm) {
        registerMemberForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('reg-email').value.trim().toLowerCase();
            const passwordInput = document.getElementById('reg-password').value;
            const roleInput = document.getElementById('reg-role')?.value || 'member';
            
            const userRole = sessionStorage.getItem('fcpn_member_role');
            if (userRole !== 'admin') return;
            
            if (registerErrorMsg) registerErrorMsg.classList.add('hidden');
            if (registerSuccessMsg) registerSuccessMsg.classList.add('hidden');

            let db = getMockDB();
            if (db.find(m => m.email.toLowerCase() === emailInput)) {
                if (registerErrorMsg) {
                    registerErrorMsg.textContent = '❌ Este e-mail já está cadastrado.';
                    registerErrorMsg.classList.remove('hidden');
                }
                return;
            }

            const newId = db.length > 0 ? Math.max(...db.map(m => m.id)) + 1 : 1;
            db.push({ id: newId, email: emailInput, password: passwordInput, role: roleInput });
            saveMockDB(db);

            if (registerSuccessMsg) {
                registerSuccessMsg.textContent = '✔️ Membro cadastrado com sucesso!';
                registerSuccessMsg.classList.remove('hidden');
            }
            registerMemberForm.reset();
            if (document.getElementById('reg-role')) document.getElementById('reg-role').value = 'member';
            loadMembers();
        });
    }

    // Alterar senha própria
    const changePasswordForm = document.getElementById('change-password-form');
    const changePassErrorMsg = document.getElementById('change-pass-error-msg');
    const changePassSuccessMsg = document.getElementById('change-pass-success-msg');

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentPass = document.getElementById('change-current-pass').value;
            const newPass = document.getElementById('change-new-pass').value;
            const confirmPass = document.getElementById('change-confirm-pass').value;
            const requesterEmail = sessionStorage.getItem('fcpn_member_email');

            if (changePassErrorMsg) changePassErrorMsg.classList.add('hidden');
            if (changePassSuccessMsg) changePassSuccessMsg.classList.add('hidden');

            if (newPass !== confirmPass) {
                if (changePassErrorMsg) {
                    changePassErrorMsg.textContent = '❌ A nova senha e a confirmação não coincidem.';
                    changePassErrorMsg.classList.remove('hidden');
                }
                return;
            }

            let db = getMockDB();
            let user = db.find(m => m.email === requesterEmail);
            
            if (user && user.password === currentPass) {
                user.password = newPass;
                saveMockDB(db);
                if (changePassSuccessMsg) {
                    changePassSuccessMsg.textContent = '✔️ Senha alterada com sucesso!';
                    changePassSuccessMsg.classList.remove('hidden');
                }
                changePasswordForm.reset();
            } else {
                if (changePassErrorMsg) {
                    changePassErrorMsg.textContent = '❌ Senha atual incorreta.';
                    changePassErrorMsg.classList.remove('hidden');
                }
            }
        });
    }

    // Alternar visibilidade da senha (olho)
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.password-input-wrapper');
            if (!wrapper) return;
            const input = wrapper.querySelector('input');
            const eyeIcon = btn.querySelector('.eye-icon');
            const eyeOffIcon = btn.querySelector('.eye-off-icon');

            if (input && input.type === 'password') {
                input.type = 'text';
                if (eyeIcon) eyeIcon.classList.remove('hidden');
                if (eyeOffIcon) eyeOffIcon.classList.add('hidden');
            } else if (input) {
                input.type = 'password';
                if (eyeIcon) eyeIcon.classList.add('hidden');
                if (eyeOffIcon) eyeOffIcon.classList.remove('hidden');
            }
        });
    });

    // Admin alterar senha de membro
    const adminPasswordModal = document.getElementById('admin-password-modal');
    const closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
    const adminPasswordForm = document.getElementById('admin-password-form');
    const adminModalErrorMsg = document.getElementById('admin-modal-error-msg');
    const adminModalSuccessMsg = document.getElementById('admin-modal-success-msg');

    if (closeAdminModalBtn && adminPasswordModal) {
        closeAdminModalBtn.addEventListener('click', () => {
            adminPasswordModal.classList.add('hidden');
        });
        adminPasswordModal.addEventListener('click', (e) => {
            if (e.target === adminPasswordModal) {
                adminPasswordModal.classList.add('hidden');
            }
        });
    }

    if (adminPasswordForm) {
        adminPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const memberId = document.getElementById('admin-modal-member-id').value;
            const newPassword = document.getElementById('admin-modal-new-pass').value;
            const userRole = sessionStorage.getItem('fcpn_member_role');

            if (userRole !== 'admin') return;
            
            if (adminModalErrorMsg) adminModalErrorMsg.classList.add('hidden');
            if (adminModalSuccessMsg) adminModalSuccessMsg.classList.add('hidden');

            let db = getMockDB();
            let user = db.find(m => m.id === parseInt(memberId));
            if (user) {
                user.password = newPassword;
                saveMockDB(db);
                if (adminModalSuccessMsg) {
                    adminModalSuccessMsg.textContent = '✔️ Senha alterada com sucesso!';
                    adminModalSuccessMsg.classList.remove('hidden');
                }
                adminPasswordForm.reset();
                setTimeout(() => {
                    if (adminPasswordModal) adminPasswordModal.classList.add('hidden');
                }, 1500);
            } else {
                if (adminModalErrorMsg) {
                    adminModalErrorMsg.textContent = '❌ Membro não encontrado.';
                    adminModalErrorMsg.classList.remove('hidden');
                }
            }
        });
    }


    /* ==========================================================================
       9. CONTROLE DE CAMPANHAS DE SAÚDE (OUTUBRO ROSA & NOVEMBRO AZUL)
       ========================================================================== */
    const btnOutubroRosa = document.getElementById('btn-outubro-rosa');
    const btnNovembroAzul = document.getElementById('btn-novembro-azul');
    const btnResetTema = document.getElementById('btn-reset-tema');
    const campaignRibbon = document.getElementById('campaign-ribbon');

    function applyCampaign(campaign) {
        // Remove classes de campanhas anteriores
        document.body.classList.remove('theme-outubro-rosa', 'theme-novembro-azul');

        if (campaign === 'outubro-rosa') {
            document.body.classList.add('theme-outubro-rosa');
            if (campaignRibbon) {
                campaignRibbon.classList.remove('hidden');
                campaignRibbon.style.color = '#ff2a85'; // Cor rosa para o laço
            }
            sessionStorage.setItem('fcpn_campaign', 'outubro-rosa');
        } else if (campaign === 'novembro-azul') {
            document.body.classList.add('theme-novembro-azul');
            if (campaignRibbon) {
                campaignRibbon.classList.remove('hidden');
                campaignRibbon.style.color = '#1e88e5'; // Cor azul para o laço
            }
            sessionStorage.setItem('fcpn_campaign', 'novembro-azul');
        } else {
            // Padrão FCPN
            if (campaignRibbon) {
                campaignRibbon.classList.add('hidden');
            }
            sessionStorage.removeItem('fcpn_campaign');
        }
    }

    // Listeners dos botões de campanha
    if (btnOutubroRosa) {
        btnOutubroRosa.addEventListener('click', () => {
            applyCampaign('outubro-rosa');
            alert('Campanha Outubro Rosa Ativada! O site foi personalizado com tons rosa e o laço de conscientização.');
        });
    }

    if (btnNovembroAzul) {
        btnNovembroAzul.addEventListener('click', () => {
            applyCampaign('novembro-azul');
            alert('Campanha Novembro Azul Ativada! O site foi personalizado com tons azul e o laço de conscientização.');
        });
    }

    if (btnResetTema) {
        btnResetTema.addEventListener('click', () => {
            applyCampaign('default');
            alert('Identidade visual restaurada para o padrão FCPN (Ciano & Roxo).');
        });
    }

    // Carrega campanha salva na sessão se houver
    const savedCampaign = sessionStorage.getItem('fcpn_campaign');
    if (savedCampaign) {
        applyCampaign(savedCampaign);
    }

    // Executa verificação inicial no carregamento
    checkLoginStatus();
});

