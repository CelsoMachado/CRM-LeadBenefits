const form = document.querySelector('#search-form');
const statusEl = document.querySelector('#status');
const clearButton = document.querySelector('#clear-button');
const advancedSearchToggle = document.querySelector('#advanced-search-toggle');
const advancedSearchPanel = document.querySelector('#advanced-search-panel');
const mainCrmViews = document.querySelectorAll('.main-crm-view');
const importacaoPage = document.querySelector('#empresas-importacao-page');
const cadastroEmpresaPage = document.querySelector('#empresas-cadastrar-page');
const companyImportForm = document.querySelector('#company-import-form');
const companyImportFile = document.querySelector('#company-import-file');
const companyImportSubmit = document.querySelector('#company-import-submit');
const companyImportStatus = document.querySelector('#company-import-status');
const companyImportResult = document.querySelector('#company-import-result');
const companyImportErrorsWrap = document.querySelector('#company-import-errors-wrap');
const companyImportErrors = document.querySelector('#company-import-errors');
const companyImportHistory = document.querySelector('#company-import-history');
const importedCompanyForm = document.querySelector('#imported-company-form');
const importedCompanyStatus = document.querySelector('#imported-company-status');
const simpleSearchLabels = document.querySelectorAll('.simple-search-row label');
const clearSelectionButton = document.querySelector('#clear-selection-button');
const selectionCountEl = document.querySelector('#selection-count');
const selectPageCheckbox = document.querySelector('#select-page');
const leadPanelSummary = document.querySelector('#lead-panel-summary');
const selectedLeadsEl = document.querySelector('#selected-leads');
const queryFilter = document.querySelector('#query-filter');
const cnpjFilter = document.querySelector('#cnpj-filter');
const razaoFilter = document.querySelector('#razao-filter');
const fantasiaFilter = document.querySelector('#fantasia-filter');
const ufSelect = document.querySelector('#uf');
const municipioInput = document.querySelector('#municipio');
const cnaeInput = document.querySelector('#cnae');
const cnaesList = document.querySelector('#cnaes-list');
const aberturaInicioInput = document.querySelector('#abertura-inicio');
const aberturaFimInput = document.querySelector('#abertura-fim');
const dashboardTotalCadastros = document.querySelector('#dashboard-total-cadastros');
const dashboardTrabalhadosMes = document.querySelector('#dashboard-trabalhados-mes');
const dashboardLeadsNegociacao = document.querySelector('#dashboard-leads-negociacao');
const dashboardUpdatedAt = document.querySelector('#dashboard-updated-at');
const dashboardRefreshButton = document.querySelector('#dashboard-refresh');
const dashboardAtrasadosCount = document.querySelector('#dashboard-atrasados-count');
const dashboardHojeCount = document.querySelector('#dashboard-hoje-count');
const dashboardAmanhaCount = document.querySelector('#dashboard-amanha-count');
const dashboardHojeImportadas = document.querySelector('#dashboard-hoje-importadas');
const dashboardContatosHojeCount = document.querySelector('#dashboard-contatos-hoje-count');
const dashboardAtrasadosList = document.querySelector('#dashboard-atrasados-list');
const dashboardAtrasadosAllButton = document.querySelector('#dashboard-atrasados-all');
const dashboardHojeList = document.querySelector('#dashboard-hoje-list');
const dashboardAmanhaList = document.querySelector('#dashboard-amanha-list');
const dashboardContatosHojeList = document.querySelector('#dashboard-contatos-hoje-list');
const overdueModal = document.querySelector('#overdue-modal');
const overdueModalClose = document.querySelector('#overdue-modal-close');
const overdueModalList = document.querySelector('#overdue-modal-list');
const manualCompanyOpenButton = document.querySelector('#manual-company-open');
const manualCompanyModal = document.querySelector('#manual-company-modal');
const manualCompanyForm = document.querySelector('#manual-company-form');
const manualCompanyCloseButton = document.querySelector('#manual-company-close');
const manualCompanyStatus = document.querySelector('#manual-company-status');
const tableWrap = document.querySelector('.table-wrap');
const notesPanel = document.querySelector('.notes-panel');
const tableShowSummary = document.querySelector('#table-show-summary');
const notesTitle = document.querySelector('#notes-title');
const companySnapshot = document.querySelector('#company-snapshot');
const companyDetailsNotepad = document.querySelector('#company-details-notepad');
const companyRecordModal = document.querySelector('#company-record-modal');
const companyRecordModalTitle = document.querySelector('#company-record-modal-title');
const companyRecordModalSubtitle = document.querySelector('#company-record-modal-subtitle');
const companyRecordModalBody = document.querySelector('#company-record-modal-body');
const companyRecordModalClose = document.querySelector('#company-record-modal-close');
const companyRecordOpenNotes = document.querySelector('#company-record-open-notes');
const prospectionForm = document.querySelector('#prospection-form');
const prospectionNotes = document.querySelector('#prospection-notes');
const prospectionEditor = document.querySelector('#prospection-editor');
const prospectionStatus = document.querySelector('#prospection-status');
const saveProspectionButton = document.querySelector('#save-prospection-button');
const backToTableButton = document.querySelector('#back-to-table-button');
const contactPersonInput = document.querySelector('#contact-person');
const contactRoleInput = document.querySelector('#contact-role');
const nextContactInput = document.querySelector('#next-contact');
const contactPhoneInput = document.querySelector('#contact-phone');
const contactWhatsappInput = document.querySelector('#contact-whatsapp');
const contactEmailInput = document.querySelector('#contact-email');
const employeeCountInput = document.querySelector('#employee-count');
const benefitsInput = document.querySelector('#benefits');
const healthPlanInput = document.querySelector('#health-plan');
const healthPlanAllEmployeesInput = document.querySelector('#health-plan-all-employees');
const healthPlanOperatorInput = document.querySelector('#health-plan-operator');
const healthPlanExpirationInput = document.querySelector('#health-plan-expiration');
const dentalPlanInput = document.querySelector('#dental-plan');
const dentalPlanOperatorInput = document.querySelector('#dental-plan-operator');
const dentalPlanExpirationInput = document.querySelector('#dental-plan-expiration');
const lifeInsuranceInput = document.querySelector('#life-insurance');
const lifeInsuranceOperatorInput = document.querySelector('#life-insurance-operator');
const lifeInsuranceExpirationInput = document.querySelector('#life-insurance-expiration');
const reasonCostReductionInput = document.querySelector('#reason-cost-reduction');
const reasonBetterServiceInput = document.querySelector('#reason-better-service');
const reasonExpandedCoverageInput = document.querySelector('#reason-expanded-coverage');
const switchInterestInput = document.querySelector('#switch-interest');
const contactHistoryEl = document.querySelector('#contact-history');
const nextContactField = document.querySelector('.next-contact-field');
const historyTitle = document.querySelector('.history-column > strong');
const appVersionEl = document.querySelector('#app-version');
const loginPage = document.querySelector('#login-page');
const appShell = document.querySelector('#app-shell');
const loginForm = document.querySelector('#login-form');
const loginEmail = document.querySelector('#login-email');
const loginPassword = document.querySelector('#login-password');
const loginSubmit = document.querySelector('#login-submit');
const loginStatus = document.querySelector('#login-status');
const authenticatedUser = document.querySelector('#authenticated-user');
const logoutButton = document.querySelector('#logout-button');
let municipalityRequestId = 0;
let cnaeRequestId = 0;
let resultsTable;
let importHistoryDataTable;
let appInitialized = false;
let currentAuthUser = null;
let hasSearched = false;
let currentSearchSource = 'rfb';
let currentCompany = null;
let currentProspectionState = { draftHtml: '', history: [] };
let lastFocusedElement = null;
let isSelectingAllFiltered = false;
let allFilteredSelectionActive = false;
const selectedCompanies = new Set();
const selectedLeadDrafts = new Map();
const dashboardCompanyRecords = new Map();
const selectionFetchLimit = 200;

if (nextContactField?.firstChild) {
    nextContactField.firstChild.textContent = 'Próximo contato';
}

if (historyTitle) {
    historyTitle.textContent = 'Histórico de Contatos';
}

if (simpleSearchLabels.length >= 2) {
    simpleSearchLabels[0].childNodes[0].textContent = 'Razão Social';
    simpleSearchLabels[1].childNodes[0].textContent = 'CNPJ';
}

const dataTableColumnMap = {
    5: 4,
    8: 8
};

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatCnpj(value) {
    const digits = String(value || '');

    if (digits.length !== 14) {
        return escapeHtml(value || '');
    }

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatTelefone(item) {
    const ddd1 = item.DDD_1 ? `(${item.DDD_1}) ` : '';
    const telefone1 = item.TELEFONE_1 || '';
    const ddd2 = item.DDD_2 ? `(${item.DDD_2}) ` : '';
    const telefone2 = item.TELEFONE_2 || '';
    const principal = `${ddd1}${telefone1}`.trim();
    const secundario = `${ddd2}${telefone2}`.trim();

    if (principal && secundario) {
        return `${escapeHtml(principal)}<span>${escapeHtml(secundario)}</span>`;
    }

    return escapeHtml(principal || secundario || '-');
}

function getPhoneText(item) {
    const ddd1 = item.DDD_1 ? `(${item.DDD_1}) ` : '';
    const telefone1 = item.TELEFONE_1 || '';
    const ddd2 = item.DDD_2 ? `(${item.DDD_2}) ` : '';
    const telefone2 = item.TELEFONE_2 || '';

    return `${ddd1}${telefone1}`.trim() || `${ddd2}${telefone2}`.trim();
}

function formatDate(value) {
    const digits = String(value || '');

    if (digits.length !== 8) {
        return escapeHtml(valueOrDash(value));
    }

    return `${digits.slice(6, 8)}/${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
}

function valueOrDash(value) {
    return value === null || value === undefined || value === '' ? '-' : value;
}

function formatDateTime(value) {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeHtml(value);
    }

    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function loadAppMetadata() {
    if (!appVersionEl) {
        return;
    }

    try {
        const response = await fetch('/api/app-metadata');
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao carregar versao.');
        }

        const app = payload.app || {};
        const name = app.name || 'LeadBenefits';
        const version = app.version || '-';

        appVersionEl.textContent = `${name.replace(/\s+CRM$/i, '')} v${version}`;

        if (app.build || app.environment) {
            appVersionEl.title = [
                app.environment ? `Ambiente: ${app.environment}` : '',
                app.build ? `Build: ${app.build}` : ''
            ].filter(Boolean).join(' | ');
        }
    } catch {
        appVersionEl.textContent = 'LeadBenefits v-';
    }
}

function setLoginStatus(message = '', isError = false) {
    if (!loginStatus) {
        return;
    }

    loginStatus.textContent = message;
    loginStatus.classList.toggle('is-error', isError);
}

function showLogin(message = '') {
    currentAuthUser = null;

    if (loginPage) {
        loginPage.hidden = false;
    }

    if (appShell) {
        appShell.hidden = true;
    }

    if (authenticatedUser) {
        authenticatedUser.textContent = '-';
    }

    setLoginStatus(message);
    loginEmail?.focus();
}

function showApp(user) {
    currentAuthUser = user || null;

    if (loginPage) {
        loginPage.hidden = true;
    }

    if (appShell) {
        appShell.hidden = false;
    }

    if (authenticatedUser) {
        const organization = user?.organizacao?.nome ? ` - ${user.organizacao.nome}` : '';
        authenticatedUser.textContent = `${user?.nome || user?.email || 'Usuario'}${organization}`;
        authenticatedUser.title = user?.perfil?.codigo || '';
    }
}

function initializeApp() {
    if (appInitialized) {
        return;
    }

    initializeDataTable();
    updateMunicipioAvailability();
    updateSelectionCount();
    renderSelectedLeads();
    renderCompanyNotes(null);
    loadDashboard();
    handleNavigation();
    appInitialized = true;
}

async function initializeAuthentication() {
    await loadAppMetadata();

    try {
        const response = await fetch('/api/auth/me');
        const payload = await response.json();

        if (!response.ok || !payload.authenticated) {
            showLogin();
            return;
        }

        showApp(payload.user);
        initializeApp();
    } catch {
        showLogin('Nao foi possivel validar a sessao.');
    }
}

async function handleLogin(event) {
    event.preventDefault();

    if (!loginForm || !loginEmail || !loginPassword) {
        return;
    }

    setLoginStatus('Entrando...');

    if (loginSubmit) {
        loginSubmit.disabled = true;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: loginEmail.value,
                password: loginPassword.value
            })
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Nao foi possivel entrar.');
        }

        loginPassword.value = '';
        showApp(payload.user);
        initializeApp();
    } catch (error) {
        setLoginStatus(error.message, true);
    } finally {
        if (loginSubmit) {
            loginSubmit.disabled = false;
        }
    }
}

async function handleLogout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST'
        });
    } finally {
        showLogin('Sessao encerrada.');
    }
}

function setMainView(view) {
    const showImportacao = view === 'importacao';
    const showCadastro = view === 'cadastrar';

    mainCrmViews.forEach((element) => {
        element.hidden = showImportacao || showCadastro;
    });

    if (importacaoPage) {
        importacaoPage.hidden = !showImportacao;
    }

    if (cadastroEmpresaPage) {
        cadastroEmpresaPage.hidden = !showCadastro;
    }

    if (showImportacao) {
        loadImportHistory();
    }
}

function handleNavigation() {
    const hash = window.location.hash || '#inicio';

    if (hash === '#pesquisa-avancada') {
        setMainView('inicio');
        if (advancedSearchPanel && advancedSearchToggle) {
            advancedSearchPanel.hidden = false;
            advancedSearchToggle.setAttribute('aria-expanded', 'true');
            advancedSearchToggle.classList.add('is-active');
        }
        form?.scrollIntoView({ block: 'start' });
        return;
    }

    if (hash === '#empresas/importacao') {
        setMainView('importacao');
        return;
    }

    if (hash === '#empresas/cadastrar') {
        setMainView('cadastrar');
        return;
    }

    setMainView('inicio');
    loadDashboard();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.includes(',') ? result.split(',').pop() : result);
        };
        reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo selecionado.'));
        reader.readAsDataURL(file);
    });
}

function renderImportHistory(importacoes = []) {
    if (!companyImportHistory) {
        return;
    }

    if (importHistoryDataTable) {
        importHistoryDataTable.destroy();
        importHistoryDataTable = null;
    }

    if (!importacoes.length) {
        companyImportHistory.innerHTML = '<tr><td colspan="7">Nenhuma importacao registrada.</td></tr>';
        return;
    }

    companyImportHistory.innerHTML = importacoes.map((item) => `
        <tr>
            <td>${formatDateTime(item.DATA_HORA_IMPORTACAO)}</td>
            <td>${escapeHtml(item.NOME_ARQUIVO || '-')}</td>
            <td>${Number(item.TOTAL_LINHAS || 0).toLocaleString('pt-BR')}</td>
            <td>${Number(item.TOTAL_IMPORTADAS || 0).toLocaleString('pt-BR')}</td>
            <td>${Number(item.TOTAL_CNPJ_PENDENTE || 0).toLocaleString('pt-BR')}</td>
            <td>
                ${Number(item.TOTAL_ERROS || 0).toLocaleString('pt-BR')}
                ${Number(item.TOTAL_ERROS || 0) > 0 ? `<button class="link-button import-error-open" type="button" data-id="${item.ID_IMPORTACAO}">ver</button>` : ''}
            </td>
            <td>${escapeHtml(item.USUARIO || '-')}</td>
        </tr>
    `).join('');

    if (typeof DataTable === 'function') {
        importHistoryDataTable = new DataTable('#company-import-history-table', {
            paging: true,
            searching: false,
            info: false,
            ordering: true,
            pageLength: 10,
            language: {
                emptyTable: 'Nenhuma importacao registrada.',
                lengthMenu: 'Mostrar _MENU_ registros',
                paginate: {
                    previous: 'Anterior',
                    next: 'Proxima'
                }
            }
        });
    }
}

async function loadImportHistory() {
    if (!companyImportHistory) {
        return;
    }

    try {
        const response = await fetch('/api/importacoes');
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao carregar historico.');
        }

        renderImportHistory(payload.importacoes || []);
    } catch (error) {
        companyImportHistory.innerHTML = `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
    }
}

function renderImportErrors(erros = []) {
    if (!companyImportErrors || !companyImportErrorsWrap) {
        return;
    }

    companyImportErrorsWrap.hidden = erros.length === 0;
    companyImportErrors.innerHTML = erros.map((erro) => `
        <tr>
            <td>${escapeHtml(erro.LINHA || '-')}</td>
            <td>${escapeHtml(erro.CAMPO || '-')}</td>
            <td>${escapeHtml(erro.MOTIVO || '-')}</td>
        </tr>
    `).join('');
}

function renderImportResult(resultado, erros = []) {
    if (!companyImportResult || !resultado) {
        return;
    }

    companyImportResult.hidden = false;
    document.querySelector('#import-result-file').textContent = resultado.arquivo || '-';
    document.querySelector('#import-result-total').textContent = Number(resultado.totalLinhas || 0).toLocaleString('pt-BR');
    document.querySelector('#import-result-imported').textContent = Number(resultado.importadas || 0).toLocaleString('pt-BR');
    document.querySelector('#import-result-updated').textContent = Number(resultado.atualizadas || 0).toLocaleString('pt-BR');
    document.querySelector('#import-result-duplicated').textContent = Number(resultado.duplicadas || 0).toLocaleString('pt-BR');
    document.querySelector('#import-result-pending').textContent = Number(resultado.cnpjPendente || 0).toLocaleString('pt-BR');
    document.querySelector('#import-result-errors').textContent = Number(resultado.erros || 0).toLocaleString('pt-BR');
    renderImportErrors(erros);
}

async function handleCompanyImport(event) {
    event.preventDefault();

    const file = companyImportFile?.files?.[0];

    if (!file) {
        companyImportStatus.textContent = 'Selecione um arquivo XLSX ou CSV.';
        return;
    }

    const extension = file.name.split('.').pop().toLowerCase();

    if (!['xlsx', 'csv'].includes(extension)) {
        companyImportStatus.textContent = 'Formato nao permitido. Use XLSX ou CSV.';
        return;
    }

    companyImportSubmit.disabled = true;
    companyImportStatus.textContent = 'Lendo arquivo e importando registros...';

    try {
        const contentBase64 = await fileToBase64(file);
        const response = await fetch('/api/importacoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileName: file.name,
                contentBase64
            })
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao importar arquivo.');
        }

        renderImportResult(payload.resultado, payload.erros || []);
        renderImportHistory(payload.importacoes || []);
        companyImportStatus.textContent = 'Importacao concluida.';
    } catch (error) {
        companyImportStatus.textContent = error.message;
    } finally {
        companyImportSubmit.disabled = false;
    }
}

function formDataToObject(form) {
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }

    return data;
}

async function saveImportedCompany(event) {
    event.preventDefault();

    if (!importedCompanyForm || !importedCompanyStatus) {
        return;
    }

    const submitButton = importedCompanyForm.querySelector('button[type="submit"]');
    importedCompanyStatus.textContent = 'Salvando empresa no banco de importacao...';

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const response = await fetch('/api/empresas-importadas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formDataToObject(importedCompanyForm))
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao salvar empresa.');
        }

        const pendingMessage = payload.cnpjPendente === 'S' ? ' CNPJ marcado como pendente.' : '';
        importedCompanyStatus.textContent = `Empresa salva (${payload.status}).${pendingMessage}`;
        importedCompanyForm.reset();
    } catch (error) {
        importedCompanyStatus.textContent = error.message;
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}

function truncateCell(value, className = '') {
    const text = valueOrDash(value);
    const escaped = escapeHtml(text);

    return `<span class="cell-truncate ${className}" title="${escaped}">${escaped}</span>`;
}

function renderFlagButton(item) {
    const isFlagged = Number(item?.FLAG_ATIVA || 0) === 1;
    const title = isFlagged ? 'Remover flag da empresa' : 'Marcar empresa com flag';

    return `
        <button
            class="company-flag-button${isFlagged ? ' is-flagged' : ''}"
            type="button"
            data-cnpj="${escapeHtml(item?.CNPJ || '')}"
            aria-pressed="${isFlagged ? 'true' : 'false'}"
            title="${title}"
        >
            <span aria-hidden="true"></span>
            <span class="visually-hidden">${title}</span>
        </button>
    `;
}

function eyeIconHtml() {
    return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    `;
}

function whatsappIconHtml() {
    return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3.5a8.3 8.3 0 0 0-7.1 12.6L4 20.5l4.5-1.1A8.3 8.3 0 1 0 12 3.5z"></path>
            <path d="M8.8 8.2c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.3 0 .5-.1.6l-.4.5c-.1.1-.2.3-.1.5.3.6.8 1.3 1.4 1.8.7.6 1.4 1 2.1 1.2.2.1.4 0 .5-.1l.7-.8c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .5-.2 1.4-.7 1.8-.5.4-1.5.6-2.7.2-2.1-.7-3.8-2-5.1-3.7-1-1.4-1.6-2.8-1.5-3.8 0-.5.2-.8.3-1z"></path>
        </svg>
    `;
}

function maskDate(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);

    if (digits.length <= 2) {
        return digits;
    }

    if (digits.length <= 4) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function toDatabaseDate(value) {
    const digits = String(value || '').replace(/\D/g, '');

    if (digits.length !== 8) {
        return '';
    }

    return `${digits.slice(4, 8)}${digits.slice(2, 4)}${digits.slice(0, 2)}`;
}

function syncQueryFilter(includeFantasia = true) {
    if (!queryFilter) {
        return;
    }

    queryFilter.value = cnpjFilter.value.trim()
        || razaoFilter.value.trim()
        || (includeFantasia ? fantasiaFilter.value.trim() : '');
}

function appendFormFilters(params, source = currentSearchSource) {
    const includeAdvancedFilters = source === 'prospeccoes';

    syncQueryFilter(includeAdvancedFilters);
    const data = new FormData(form);

    for (const [key, value] of data.entries()) {
        if (!includeAdvancedFilters && key !== 'q') {
            continue;
        }

        let normalizedValue = String(value).trim();

        if (key === 'aberturaInicio' || key === 'aberturaFim') {
            normalizedValue = toDatabaseDate(normalizedValue);
        }

        if (normalizedValue !== '') {
            params.set(key, normalizedValue);
        }
    }

    params.set('source', source);
}

function syncSwitchConflicts(input) {
    const conflicts = input.dataset.conflicts;

    if (!input.checked || !conflicts) {
        return;
    }

    for (const id of conflicts.split(',')) {
        const conflictingInput = document.getElementById(id.trim());

        if (conflictingInput) {
            conflictingInput.checked = false;
        }
    }
}

function buildDataTableParams(data) {
    const params = new URLSearchParams();
    const order = data.order?.[0];

    params.set('draw', data.draw ?? 0);
    params.set('start', data.start ?? 0);
    params.set('length', data.length ?? 25);

    if (order && dataTableColumnMap[order.column] !== undefined) {
        params.set('order[0][column]', dataTableColumnMap[order.column]);
        params.set('order[0][dir]', order.dir || 'asc');
    }

    if (data.search?.value) {
        params.set('search[value]', data.search.value);
    }

    appendFormFilters(params);

    return params;
}

function getSubmitSearchSource(event) {
    if (event.submitter?.dataset.searchSource) {
        return event.submitter.dataset.searchSource;
    }

    if (
        advancedSearchPanel
        && !advancedSearchPanel.hidden
        && advancedSearchPanel.contains(document.activeElement)
    ) {
        return 'prospeccoes';
    }

    return 'rfb';
}

function updateMunicipioAvailability() {
    const hasUf = Boolean(ufSelect?.value);

    if (municipioInput) {
        municipioInput.disabled = !hasUf;

        if (!hasUf) {
            municipioInput.innerHTML = '<option value="">Selecione a UF</option>';
        }
    }
}

function updateSelectionCount() {
    const total = selectedCompanies.size;
    selectionCountEl.textContent = `${total.toLocaleString('pt-BR')} selecionada${total === 1 ? '' : 's'}`;

    if (leadPanelSummary) {
        leadPanelSummary.textContent = total === 0
            ? 'Nenhuma empresa selecionada'
            : `${total.toLocaleString('pt-BR')} empresa${total === 1 ? '' : 's'} no rascunho`;
    }
}

function formatDashboardNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toLocaleString('pt-BR') : '0';
}

function formatDashboardUpdatedAt(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getDashboardContactTitle(contact) {
    return plainValue(contact?.nomeFantasia)
        || plainValue(contact?.razaoSocial)
        || 'Cadastro sem nome';
}

function getDashboardCompanyRecord(contact) {
    const record = {
        ...(contact?.dadosEmpresa || {})
    };

    record.CNPJ = record.CNPJ || contact?.cnpj || '';
    record.RAZAO_SOCIAL = record.RAZAO_SOCIAL || contact?.razaoSocial || '';
    record.NOME_FANTASIA = record.NOME_FANTASIA || contact?.nomeFantasia || '';
    record.MUNICIPIO_DESCRICAO = record.MUNICIPIO_DESCRICAO || contact?.municipio || '';
    record.UF = record.UF || contact?.uf || '';

    return record;
}

function storeDashboardCompanyRecords(data) {
    dashboardCompanyRecords.clear();

    for (const group of [data?.agenda?.atrasados, data?.agenda?.hoje, data?.agenda?.amanha, data?.agenda?.contatosHoje]) {
        for (const contact of group?.itens || []) {
            const cnpj = String(contact?.cnpj || '').replace(/\D/g, '');

            if (cnpj) {
                dashboardCompanyRecords.set(cnpj, getDashboardCompanyRecord(contact));
            }
        }
    }
}

function renderDashboardContactList(container, group, emptyText, showViewButton = false) {
    if (!container) {
        return;
    }

    const items = Array.isArray(group?.itens) ? group.itens : [];
    const total = Number(group?.total || items.length || 0);

    if (!items.length) {
        container.innerHTML = `<p class="dashboard-empty">${escapeHtml(emptyText)}</p>`;
        return;
    }

    const html = items.map((contact) => {
        const title = getDashboardContactTitle(contact);
        const location = [contact.municipio, contact.uf].filter(hasDetailValue).join(' / ');
        const meta = [formatCnpj(contact.cnpj), location].filter(hasDetailValue).join(' - ');
        const person = [contact.contato, contact.cargo].filter(hasDetailValue).join(' - ');

        if (showViewButton) {
            return `
                <article class="dashboard-contact-card is-compact">
                    <strong title="${escapeHtml(title)}">${escapeHtml(title)}</strong>
                    <button class="dashboard-view-button icon-button" type="button" data-cnpj="${escapeHtml(contact.cnpj)}" title="Visualizar" aria-label="Visualizar ${escapeHtml(title)}">
                        ${eyeIconHtml()}
                    </button>
                </article>
            `;
        }

        return `
            <article class="dashboard-contact-card">
                <strong title="${escapeHtml(title)}">${escapeHtml(title)}</strong>
                <span>${escapeHtml(meta || '-')}</span>
                <span>${contact.contatoRealizadoEm
                    ? `Contato registrado: ${escapeHtml(formatDashboardUpdatedAt(contact.contatoRealizadoEm))}`
                    : `Proximo contato: ${escapeHtml(formatIsoDate(contact.proximoContato))}`}</span>
                ${contact.telefone ? `<span>Telefone: ${escapeHtml(contact.telefone)}</span>` : ''}
                ${person ? `<span>Contato: ${escapeHtml(person)}</span>` : ''}
                ${contact.beneficios ? `<span>Beneficios: ${escapeHtml(contact.beneficios)}</span>` : ''}
            </article>
        `;
    }).join('');
    const overflow = total > items.length
        ? `<p class="dashboard-more">+ ${formatDashboardNumber(total - items.length)} contatos</p>`
        : '';

    container.innerHTML = `${html}${overflow}`;
}

function renderDashboard(data) {
    storeDashboardCompanyRecords(data);

    if (dashboardTotalCadastros) {
        dashboardTotalCadastros.textContent = formatDashboardNumber(data?.metricas?.totalCadastros);
    }

    if (dashboardTrabalhadosMes) {
        dashboardTrabalhadosMes.textContent = formatDashboardNumber(data?.metricas?.trabalhadosMes);
    }

    if (dashboardLeadsNegociacao) {
        dashboardLeadsNegociacao.textContent = formatDashboardNumber(data?.metricas?.leadsNegociacao);
    }

    if (dashboardAtrasadosCount) {
        dashboardAtrasadosCount.textContent = formatDashboardNumber(data?.agenda?.atrasados?.total);
    }

    if (dashboardHojeCount) {
        dashboardHojeCount.textContent = formatDashboardNumber(data?.agenda?.hoje?.total);
    }

    if (dashboardAmanhaCount) {
        dashboardAmanhaCount.textContent = formatDashboardNumber(data?.agenda?.amanha?.total);
    }

    if (dashboardHojeImportadas) {
        dashboardHojeImportadas.textContent = `${formatDashboardNumber(data?.metricas?.empresasImportadas)} empresas importadas`;
    }

    if (dashboardContatosHojeCount) {
        dashboardContatosHojeCount.textContent = formatDashboardNumber(data?.agenda?.contatosHoje?.total);
    }

    renderDashboardContactList(dashboardAtrasadosList, data?.agenda?.atrasados, 'Nenhum contato atrasado', true);
    renderDashboardContactList(dashboardHojeList, data?.agenda?.hoje, 'Nenhum contato para hoje');
    renderDashboardContactList(dashboardAmanhaList, data?.agenda?.amanha, 'Nenhum contato para amanha');
    renderDashboardContactList(dashboardContatosHojeList, data?.agenda?.contatosHoje, 'Nenhum contato registrado hoje');

    if (dashboardUpdatedAt) {
        const updatedAt = formatDashboardUpdatedAt(data?.geradoEm);
        dashboardUpdatedAt.textContent = updatedAt ? `Atualizado em ${updatedAt}` : 'Painel atualizado';
    }
}

function renderOverdueModalList(items = []) {
    if (!overdueModalList) {
        return;
    }

    if (!items.length) {
        overdueModalList.innerHTML = '<p class="dashboard-empty">Nenhum contato atrasado.</p>';
        return;
    }

    overdueModalList.innerHTML = items.map((contact) => {
        const title = getDashboardContactTitle(contact);
        const location = [contact.municipio, contact.uf].filter(hasDetailValue).join(' / ');
        const meta = [
            formatCnpj(contact.cnpj),
            location,
            contact.proximoContato ? `Vencido em ${formatIsoDate(contact.proximoContato)}` : ''
        ].filter(hasDetailValue).join(' - ');

        return `
            <article class="overdue-row">
                <div>
                    <strong title="${escapeHtml(title)}">${escapeHtml(title)}</strong>
                    <span>${escapeHtml(meta || '-')}</span>
                </div>
                <button class="dashboard-view-button icon-button" type="button" data-cnpj="${escapeHtml(contact.cnpj)}" title="Visualizar" aria-label="Visualizar ${escapeHtml(title)}">
                    ${eyeIconHtml()}
                </button>
            </article>
        `;
    }).join('');
}

async function openOverdueModal() {
    if (!overdueModal || !overdueModalList) {
        return;
    }

    overdueModal.hidden = false;
    document.body.classList.add('modal-open');
    overdueModalList.innerHTML = '<p class="dashboard-empty">Carregando contatos atrasados...</p>';
    overdueModalClose?.focus();

    try {
        const response = await fetch('/api/dashboard?agenda=full');
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao carregar contatos atrasados.');
        }

        storeDashboardCompanyRecords(payload);
        renderOverdueModalList(payload?.agenda?.atrasados?.itens || []);
    } catch (error) {
        overdueModalList.innerHTML = `<p class="dashboard-empty">${escapeHtml(error.message)}</p>`;
    }
}

function closeOverdueModal() {
    if (!overdueModal || overdueModal.hidden) {
        return;
    }

    overdueModal.hidden = true;
    document.body.classList.remove('modal-open');
}

async function loadDashboard() {
    if (!dashboardTotalCadastros) {
        return;
    }

    if (dashboardUpdatedAt) {
        dashboardUpdatedAt.textContent = 'Atualizando painel...';
    }

    if (dashboardRefreshButton) {
        dashboardRefreshButton.disabled = true;
    }

    try {
        const response = await fetch('/api/dashboard');
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao carregar painel.');
        }

        renderDashboard(payload);
    } catch (error) {
        if (dashboardUpdatedAt) {
            dashboardUpdatedAt.textContent = error.message;
        }

        renderDashboardContactList(dashboardAtrasadosList, null, 'Painel indisponivel');
        renderDashboardContactList(dashboardHojeList, null, 'Painel indisponivel');
        renderDashboardContactList(dashboardAmanhaList, null, 'Painel indisponivel');
        renderDashboardContactList(dashboardContatosHojeList, null, 'Painel indisponivel');
    } finally {
        if (dashboardRefreshButton) {
            dashboardRefreshButton.disabled = false;
        }
    }
}

const manualCompanyFields = [
    'CNPJ',
    'CNPJ_BASICO',
    'RAZAO_SOCIAL',
    'NOME_FANTASIA',
    'NATUREZA_JURIDICA',
    'NATUREZA_JURIDICA_DESCRICAO',
    'CAPITAL_SOCIAL',
    'PORTE_EMPRESA',
    'IDENTIFICADOR_MATRIZ_FILIAL',
    'SITUACAO_CADASTRAL',
    'DATA_INICIO_ATIVIDADE',
    'CNAE_FISCAL_PRINCIPAL',
    'CNAE_FISCAL_PRINCIPAL_DESCRICAO',
    'CNAE_FISCAL_SECUNDARIA',
    'TIPO_LOGRADOURO',
    'LOGRADOURO',
    'NUMERO',
    'COMPLEMENTO',
    'UF',
    'MUNICIPIO',
    'MUNICIPIO_DESCRICAO',
    'BAIRRO',
    'CEP',
    'DDD_1',
    'TELEFONE_1',
    'DDD_2',
    'TELEFONE_2',
    'EMAIL',
    'OPCAO_PELO_SIMPLES',
    'DATA_OPCAO_SIMPLES',
    'DATA_EXCLUSAO_SIMPLES',
    'OPCAO_PELO_MEI',
    'DATA_OPCAO_MEI',
    'DATA_EXCLUSAO_MEI'
];

const manualCompanyDateFields = new Set([
    'DATA_INICIO_ATIVIDADE',
    'DATA_OPCAO_SIMPLES',
    'DATA_EXCLUSAO_SIMPLES',
    'DATA_OPCAO_MEI',
    'DATA_EXCLUSAO_MEI'
]);

const manualCompanyDigitFields = new Set([
    'CNPJ',
    'CNPJ_BASICO',
    'CEP',
    'DDD_1',
    'TELEFONE_1',
    'DDD_2',
    'TELEFONE_2',
    'CNAE_FISCAL_PRINCIPAL'
]);

function setManualCompanyStatus(message) {
    if (manualCompanyStatus) {
        manualCompanyStatus.textContent = message;
    }
}

function formatManualDateForDatabase(value) {
    const rawValue = String(value || '').trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
        return rawValue.replaceAll('-', '');
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
        const [day, month, year] = rawValue.split('/');
        return `${year}${month}${day}`;
    }

    return rawValue.replace(/\D/g, '');
}

function normalizeManualCapital(value) {
    const rawValue = String(value || '').trim();

    if (!rawValue) {
        return '';
    }

    return rawValue.replace(/\./g, '').replace(',', '.');
}

function getManualFormValue(formData, field) {
    let value = String(formData.get(field) || '').trim();

    if (manualCompanyDateFields.has(field)) {
        value = formatManualDateForDatabase(value);
    } else if (manualCompanyDigitFields.has(field)) {
        value = value.replace(/\D/g, '');
    } else if (field === 'UF') {
        value = value.toUpperCase();
    } else if (field === 'CAPITAL_SOCIAL') {
        value = normalizeManualCapital(value);
    }

    return value;
}

function buildManualCompanyData(formData) {
    const company = {};

    for (const field of manualCompanyFields) {
        const value = getManualFormValue(formData, field);

        if (value) {
            company[field] = value;
        }
    }

    company.CNPJ = String(company.CNPJ || '').replace(/\D/g, '');

    if (company.CNPJ.length !== 14) {
        throw new Error('Informe um CNPJ valido com 14 digitos.');
    }

    company.CNPJ_BASICO = company.CNPJ_BASICO || company.CNPJ.slice(0, 8);
    company.TEM_EMAIL = company.EMAIL ? 1 : 0;
    company.TEM_TELEFONE = company.TELEFONE_1 || company.TELEFONE_2 ? 1 : 0;
    company.CADASTRO_MANUAL = 'S';
    company.FLAG_ATIVA = 1;

    return company;
}

function buildManualNotesHtml(notes) {
    const text = String(notes || '').trim();

    if (!text) {
        return '';
    }

    return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
}

function buildManualProspectionState(formData) {
    const notesHtml = buildManualNotesHtml(formData.get('OBSERVACOES'));
    const contactPerson = String(formData.get('NOME_CONTATO') || '').trim();
    const contactRole = String(formData.get('CARGO_CONTATO') || '').trim();
    const nextContact = String(formData.get('PROXIMO_CONTATO') || '').trim();
    const employeeCount = String(formData.get('NUMERO_FUNCIONARIOS') || '').trim();
    const benefits = String(formData.get('BENEFICIOS') || '').trim();
    const hasContactHistory = Boolean(contactPerson || contactRole || employeeCount || benefits || notesHtml);

    return {
        draftHtml: notesHtml
            ? `<p><strong>Observacoes do cadastro manual:</strong></p>${notesHtml}`
            : '<p><strong>Observacoes do contato:</strong></p><p><br></p>',
        history: hasContactHistory
            ? [{
                at: new Date().toISOString(),
                contactPerson: contactPerson || '-',
                contactRole: contactRole || '-',
                nextContact,
                employeeCount,
                benefits,
                notesHtml: notesHtml || '<p><br></p>'
            }]
            : []
    };
}

function openManualCompanyModal() {
    if (!manualCompanyModal || !manualCompanyForm) {
        return;
    }

    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    manualCompanyModal.hidden = false;
    document.body.classList.add('modal-open');
    setManualCompanyStatus('Preencha os dados para criar o cadastro no CRM.');
    manualCompanyForm.querySelector('input[name="CNPJ"]')?.focus();
}

function closeManualCompanyModal() {
    if (!manualCompanyModal || manualCompanyModal.hidden) {
        return;
    }

    manualCompanyModal.hidden = true;
    document.body.classList.remove('modal-open');

    if (lastFocusedElement && document.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
    }

    lastFocusedElement = null;
}

async function saveManualCompany(event) {
    event.preventDefault();

    if (!manualCompanyForm) {
        return;
    }

    const formData = new FormData(manualCompanyForm);
    let company;

    try {
        company = buildManualCompanyData(formData);
    } catch (error) {
        setManualCompanyStatus(error.message);
        return;
    }

    const submitButton = manualCompanyForm.querySelector('button[type="submit"]');
    setManualCompanyStatus('Salvando cadastro manual...');

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const prospectionState = buildManualProspectionState(formData);
        const response = await fetch(`/api/prospeccoes?cnpj=${encodeURIComponent(company.CNPJ)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                dadosEmpresa: company,
                observacoes: serializeProspectionState(prospectionState),
                nomeContato: String(formData.get('NOME_CONTATO') || '').trim(),
                cargoContato: String(formData.get('CARGO_CONTATO') || '').trim(),
                proximoContato: String(formData.get('PROXIMO_CONTATO') || '').trim(),
                numeroFuncionarios: String(formData.get('NUMERO_FUNCIONARIOS') || '').trim(),
                beneficios: String(formData.get('BENEFICIOS') || '').trim()
            })
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao salvar cadastro manual.');
        }

        manualCompanyForm.reset();
        closeManualCompanyModal();
        loadDashboard();
        openCompanyRecordModal(payload.prospeccao?.dadosEmpresa || company);
    } catch (error) {
        setManualCompanyStatus(error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}

function createLeadDraft(item) {
    return {
        cnpj: item.CNPJ,
        razaoSocial: item.RAZAO_SOCIAL || '',
        telefone: getPhoneText(item),
        contato: '',
        email: '',
        observacoes: ''
    };
}

function hasDetailValue(value) {
    return value !== null && value !== undefined && String(value).trim() !== '';
}

function plainValue(value) {
    return String(value ?? '').trim();
}

function formatPlainCnpj(value) {
    const digits = String(value || '').replace(/\D/g, '');

    if (digits.length !== 14) {
        return plainValue(value);
    }

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatCep(value) {
    const digits = String(value || '').replace(/\D/g, '');

    if (digits.length !== 8) {
        return plainValue(value);
    }

    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatCnaeCode(value) {
    const digits = String(value || '').replace(/\D/g, '');

    if (digits.length !== 7) {
        return plainValue(value);
    }

    return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5)}`;
}

function formatCurrency(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return plainValue(value);
    }

    return number.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatOption(value) {
    const normalized = plainValue(value).toUpperCase();

    if (normalized === 'S' || normalized === '1') {
        return 'SIM';
    }

    if (normalized === 'N' || normalized === '0') {
        return 'NÃO';
    }

    return plainValue(value);
}

function formatMatrizFilial(value) {
    const normalized = plainValue(value);

    if (normalized === '1') {
        return 'MATRIZ';
    }

    if (normalized === '2') {
        return 'FILIAL';
    }

    return normalized;
}

function formatSituacaoCadastral(value) {
    const labels = {
        '01': 'NULA',
        '02': 'ATIVA',
        '03': 'SUSPENSA',
        '04': 'INAPTA',
        '08': 'BAIXADA'
    };
    const normalized = plainValue(value).padStart(2, '0');

    return labels[normalized] ? `${labels[normalized]} (${normalized})` : plainValue(value);
}

function formatPorte(value) {
    const labels = {
        '00': 'NÃO INFORMADO',
        '01': 'MICRO EMPRESA',
        '03': 'EMPRESA DE PEQUENO PORTE',
        '05': 'DEMAIS'
    };
    const normalized = plainValue(value).padStart(2, '0');

    return labels[normalized] ? `${labels[normalized]} (${normalized})` : plainValue(value);
}

function formatPhoneParts(ddd, phone) {
    const rawPhone = plainValue(phone);

    if (!rawPhone) {
        return '';
    }

    const rawDdd = plainValue(ddd);
    return rawDdd ? `(${rawDdd}) ${rawPhone}` : rawPhone;
}

function addDetailLine(lines, label, value, formatter = plainValue) {
    if (!hasDetailValue(value)) {
        return false;
    }

    const formatted = formatter(value);

    if (!hasDetailValue(formatted)) {
        return false;
    }

    lines.push(`${label}: ${formatted}`);
    return true;
}

function addDetailSection(sections, title, lines) {
    const visibleLines = lines.filter((line) => hasDetailValue(line));

    if (!visibleLines.length) {
        return;
    }

    sections.push([title, '', ...visibleLines].join('\n'));
}

function humanizeFieldName(key) {
    return String(key || '')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

function normalizeWhatsappNumber(value) {
    const digits = String(value || '').replace(/\D/g, '');

    if (digits.length === 10 || digits.length === 11) {
        return `55${digits}`;
    }

    if (digits.length === 12 || digits.length === 13) {
        return digits;
    }

    return '';
}

function buildWhatsappMessage(item) {
    const companyName = plainValue(item?.NOME_FANTASIA) || plainValue(item?.RAZAO_SOCIAL) || 'sua empresa';

    return [
        'Olá! Tudo bem?',
        `Sou da nossa corretora de benefícios e gostaria de apresentar opções para ${companyName}.`,
        'Trabalhamos com alternativas de benefícios corporativos, como plano de saúde, odontológico, seguro de vida e outros benefícios para equipes.',
        'Podemos conversar?'
    ].join('\n\n');
}

function buildWhatsappUrl(phoneText, item) {
    const number = normalizeWhatsappNumber(phoneText);

    if (!number) {
        return '';
    }

    return `https://wa.me/${number}?text=${encodeURIComponent(buildWhatsappMessage(item))}`;
}

function buildCompanyDetailsText(item) {
    if (!item) {
        return '';
    }

    const usedFields = new Set();
    const sections = [];

    const use = (...fields) => {
        fields.forEach((field) => usedFields.add(field));
    };

    const companyLines = [];
    addDetailLine(companyLines, 'CNPJ', item.CNPJ, formatPlainCnpj);
    addDetailLine(companyLines, 'CNPJ básico', item.CNPJ_BASICO);
    addDetailLine(companyLines, 'Razão Social', item.RAZAO_SOCIAL);
    addDetailLine(companyLines, 'Nome Fantasia', item.NOME_FANTASIA);
    addDetailLine(companyLines, 'Natureza Jurídica', [item.NATUREZA_JURIDICA, item.NATUREZA_JURIDICA_DESCRICAO].filter(hasDetailValue).join(' - '));
    addDetailLine(companyLines, 'Situação Cadastral', item.SITUACAO_CADASTRAL, formatSituacaoCadastral);
    addDetailLine(companyLines, 'Data de Abertura', item.DATA_INICIO_ATIVIDADE, formatDate);
    addDetailLine(companyLines, 'Matriz/Filial', item.IDENTIFICADOR_MATRIZ_FILIAL, formatMatrizFilial);
    addDetailLine(companyLines, 'Porte', item.PORTE_EMPRESA, formatPorte);
    addDetailLine(companyLines, 'Capital Social', item.CAPITAL_SOCIAL, formatCurrency);
    addDetailLine(companyLines, 'Flag CRM', item.FLAG_ATIVA, formatOption);
    addDetailSection(sections, 'INFORMAÇÕES DA EMPRESA', companyLines);
    use(
        'CNPJ',
        'CNPJ_BASICO',
        'RAZAO_SOCIAL',
        'NOME_FANTASIA',
        'NATUREZA_JURIDICA',
        'NATUREZA_JURIDICA_DESCRICAO',
        'SITUACAO_CADASTRAL',
        'DATA_INICIO_ATIVIDADE',
        'IDENTIFICADOR_MATRIZ_FILIAL',
        'PORTE_EMPRESA',
        'CAPITAL_SOCIAL',
        'FLAG_ATIVA'
    );

    const activityLines = [];
    addDetailLine(activityLines, 'CNAE Principal', item.CNAE_FISCAL_PRINCIPAL, formatCnaeCode);
    addDetailLine(activityLines, 'Atividade Principal', item.CNAE_FISCAL_PRINCIPAL_DESCRICAO);
    addDetailLine(activityLines, 'CNAE Secundário', item.CNAE_FISCAL_SECUNDARIA);
    addDetailSection(sections, 'ATIVIDADE ECONÔMICA', activityLines);
    use('CNAE_FISCAL_PRINCIPAL', 'CNAE_FISCAL_PRINCIPAL_DESCRICAO', 'CNAE_FISCAL_SECUNDARIA');

    const addressLines = [];
    addDetailLine(addressLines, 'Tipo Logradouro', item.TIPO_LOGRADOURO);
    addDetailLine(addressLines, 'Logradouro', item.LOGRADOURO);
    addDetailLine(addressLines, 'Numero', item.NUMERO);
    addDetailLine(addressLines, 'Complemento', item.COMPLEMENTO);
    addDetailLine(addressLines, 'Bairro', item.BAIRRO);
    addDetailLine(addressLines, 'Município', item.MUNICIPIO_DESCRICAO);
    addDetailLine(addressLines, 'Código do Município', item.MUNICIPIO);
    addDetailLine(addressLines, 'UF', item.UF);
    addDetailLine(addressLines, 'CEP', item.CEP, formatCep);
    addDetailSection(sections, 'ENDEREÇO', addressLines);
    use('TIPO_LOGRADOURO', 'LOGRADOURO', 'NUMERO', 'COMPLEMENTO', 'BAIRRO', 'MUNICIPIO_DESCRICAO', 'MUNICIPIO', 'UF', 'CEP');

    const contactLines = [];
    addDetailLine(contactLines, 'Telefone 1', formatPhoneParts(item.DDD_1, item.TELEFONE_1));
    addDetailLine(contactLines, 'Telefone 2', formatPhoneParts(item.DDD_2, item.TELEFONE_2));
    addDetailLine(contactLines, 'E-mail', item.EMAIL);
    addDetailLine(contactLines, 'Possui telefone', item.TEM_TELEFONE, formatOption);
    addDetailLine(contactLines, 'Possui e-mail', item.TEM_EMAIL, formatOption);
    addDetailSection(sections, 'CONTATO', contactLines);
    use('DDD_1', 'TELEFONE_1', 'DDD_2', 'TELEFONE_2', 'EMAIL', 'TEM_TELEFONE', 'TEM_EMAIL');

    const simplesLines = [];
    addDetailLine(simplesLines, 'Optante pelo Simples', item.OPCAO_PELO_SIMPLES, formatOption);
    addDetailLine(simplesLines, 'Data opção Simples', item.DATA_OPCAO_SIMPLES, formatDate);
    addDetailLine(simplesLines, 'Data exclusão Simples', item.DATA_EXCLUSAO_SIMPLES, formatDate);
    addDetailLine(simplesLines, 'MEI', item.OPCAO_PELO_MEI, formatOption);
    addDetailLine(simplesLines, 'Data opção MEI', item.DATA_OPCAO_MEI, formatDate);
    addDetailLine(simplesLines, 'Data exclusão MEI', item.DATA_EXCLUSAO_MEI, formatDate);
    addDetailSection(sections, 'SIMPLES / MEI', simplesLines);
    use(
        'OPCAO_PELO_SIMPLES',
        'DATA_OPCAO_SIMPLES',
        'DATA_EXCLUSAO_SIMPLES',
        'OPCAO_PELO_MEI',
        'DATA_OPCAO_MEI',
        'DATA_EXCLUSAO_MEI'
    );

    const otherLines = [];

    for (const [key, value] of Object.entries(item)) {
        if (!usedFields.has(key) && hasDetailValue(value)) {
            addDetailLine(otherLines, humanizeFieldName(key), value);
        }
    }

    addDetailSection(sections, 'OUTROS DADOS DISPONÍVEIS', otherLines);

    return sections.join('\n\n');
}

function buildCompanyDetailsHtml(item) {
    const text = buildCompanyDetailsText(item);

    if (!text) {
        return '';
    }

    const sections = [];
    let currentSection = null;

    for (const rawLine of text.split('\n')) {
        const line = rawLine.trim();

        if (!line) {
            continue;
        }

        const isTitle = line === line.toUpperCase() && !line.includes(':');

        if (isTitle) {
            currentSection = {
                title: line,
                lines: []
            };
            sections.push(currentSection);
            continue;
        }

        if (!currentSection) {
            currentSection = {
                title: '',
                lines: []
            };
            sections.push(currentSection);
        }

        currentSection.lines.push(line);
    }

    return sections
        .filter((section) => section.title || section.lines.length)
        .map((section) => `
            <section class="company-details-group">
                ${section.title ? `<h3>${escapeHtml(section.title)}</h3>` : ''}
                ${section.lines.map((line) => {
                    const isPhoneLine = /^Telefone\b/i.test(line);
                    const whatsappUrl = isPhoneLine ? buildWhatsappUrl(line, item) : '';

                    return `
                        <p class="company-details-line${isPhoneLine ? ' is-phone-line' : ''}">
                            <span>${escapeHtml(line)}</span>
                            ${whatsappUrl ? `<a class="whatsapp-link icon-button" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" title="Abrir WhatsApp" aria-label="Abrir WhatsApp">${whatsappIconHtml()}</a>` : ''}
                        </p>
                    `;
                }).join('')}
            </section>
        `)
        .join('');
}

function buildContactStatusControlHtml() {
    return `
        <div class="company-contact-status">
            <label>
                Situacao do contato
                <select id="company-contact-status">
                    <option value="">Sem situacao definida</option>
                    <option value="LEAD_EM_PROPOSTA_NEGOCIACAO">Lead em proposta/negociacao</option>
                </select>
            </label>
            <button id="company-contact-status-save" class="ghost-button" type="button">Salvar</button>
            <span id="company-contact-status-feedback">Selecione a situacao quando houver retorno comercial.</span>
        </div>
    `;
}

function setCompanyContactStatus(value = '') {
    const select = document.querySelector('#company-contact-status');

    if (select) {
        select.value = value || '';
    }
}

async function saveCompanyContactStatus() {
    const cnpj = String(currentCompany?.CNPJ || '').replace(/\D/g, '');
    const select = document.querySelector('#company-contact-status');
    const feedback = document.querySelector('#company-contact-status-feedback');
    const button = document.querySelector('#company-contact-status-save');

    if (!cnpj || !select) {
        return;
    }

    if (button) {
        button.disabled = true;
    }

    if (feedback) {
        feedback.textContent = 'Salvando situacao...';
    }

    try {
        const response = await fetch('/api/prospeccoes/situacao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cnpj,
                situacaoContato: select.value,
                dadosEmpresa: currentCompany
            })
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao salvar situacao.');
        }

        currentProspectionState = parseProspectionState(payload.prospeccao?.observacoes, currentCompany);
        setCompanyContactStatus(payload.prospeccao?.situacaoContato || currentProspectionState.situacaoContato || '');

        if (feedback) {
            feedback.textContent = 'Situacao salva.';
        }

        loadDashboard();
    } catch (error) {
        if (feedback) {
            feedback.textContent = error.message;
        }
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

function buildLatestContactHtml(prospeccao, item) {
    const state = parseProspectionState(prospeccao?.observacoes, item);
    const latestEntry = Array.isArray(state.history) && state.history.length
        ? state.history[state.history.length - 1]
        : null;

    if (!latestEntry) {
        return `
            <section class="latest-contact-note">
                <h3>Ultimo contato</h3>
                <p>Nenhum contato registrado.</p>
            </section>
        `;
    }

    return `
        <section class="latest-contact-note">
            <h3>Ultimo contato</h3>
            <p><strong>Data e horario:</strong> ${escapeHtml(formatHistoryDate(latestEntry.at))}</p>
            <p><strong>Quem atendeu:</strong> ${escapeHtml(latestEntry.contactPerson || prospeccao?.nomeContato || '-')}</p>
            <div class="latest-contact-text">${latestEntry.notesHtml || '<p>-</p>'}</div>
        </section>
    `;
}

function buildFullContactHistoryHtml(prospeccao, item) {
    const state = parseProspectionState(prospeccao?.observacoes, item);
    const history = Array.isArray(state.history) ? state.history.slice().reverse() : [];

    if (!history.length) {
        return `
            <section class="latest-contact-note">
                <h3>Historico de contatos</h3>
                <p>Nenhum contato registrado.</p>
            </section>
        `;
    }

    return `
        <section class="latest-contact-note">
            <h3>Historico de contatos</h3>
            <div class="company-record-history-list">
                ${history.map((entry) => `
                    <article class="company-record-history-entry">
                        <p><strong>Data e horario:</strong> ${escapeHtml(formatHistoryDate(entry.at))}</p>
                        <p><strong>Quem atendeu:</strong> ${escapeHtml(entry.contactPerson || prospeccao?.nomeContato || '-')}</p>
                        <div class="latest-contact-text">${entry.notesHtml || '<p>-</p>'}</div>
                    </article>
                `).join('')}
            </div>
        </section>
    `;
}

async function loadCompanyRecordProspection(item) {
    const cnpj = String(item?.CNPJ || '').replace(/\D/g, '');
    const target = document.querySelector('#company-record-latest-contact');

    if (!cnpj || !target) {
        return;
    }

    try {
        const response = await fetch(`/api/prospeccoes?cnpj=${encodeURIComponent(cnpj)}`);
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao carregar ultimo contato.');
        }

        target.innerHTML = buildLatestContactHtml(payload.prospeccao, item);
        setCompanyContactStatus(payload.prospeccao?.situacaoContato || '');
    } catch (error) {
        target.innerHTML = `
            <section class="latest-contact-note">
                <h3>Ultimo contato</h3>
                <p>${escapeHtml(error.message)}</p>
            </section>
        `;
    }
}

async function loadCompanyRecordFullHistory(item) {
    const cnpj = String(item?.CNPJ || '').replace(/\D/g, '');
    const target = document.querySelector('#company-record-latest-contact');

    if (!cnpj || !target) {
        return;
    }

    target.innerHTML = `
        <section class="latest-contact-note">
            <h3>Historico de contatos</h3>
            <p>Carregando historico...</p>
        </section>
    `;

    try {
        const response = await fetch(`/api/prospeccoes?cnpj=${encodeURIComponent(cnpj)}`);
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao carregar historico.');
        }

        target.innerHTML = buildFullContactHistoryHtml(payload.prospeccao, item);
        target.scrollIntoView({ block: 'nearest' });
    } catch (error) {
        target.innerHTML = `
            <section class="latest-contact-note">
                <h3>Historico de contatos</h3>
                <p>${escapeHtml(error.message)}</p>
            </section>
        `;
    }
}

function openCompanyHistoryModal(item) {
    if (!item || !companyRecordModal || !companyRecordModalBody) {
        return;
    }

    currentCompany = item;

    if (companyRecordModalTitle) {
        companyRecordModalTitle.textContent = 'Historico de contatos';
    }

    if (companyRecordModalSubtitle) {
        companyRecordModalSubtitle.textContent = [
            plainValue(item.RAZAO_SOCIAL) || plainValue(item.NOME_FANTASIA),
            formatPlainCnpj(item.CNPJ)
        ].filter(Boolean).join(' | ');
    }

    if (companyRecordOpenNotes) {
        companyRecordOpenNotes.hidden = true;
    }

    companyRecordModalBody.innerHTML = `
        <div id="company-record-latest-contact" class="company-record-latest-contact is-history-only">
            <section class="latest-contact-note">
                <h3>Historico de contatos</h3>
                <p>Carregando historico...</p>
            </section>
        </div>
    `;
    companyRecordModalBody.scrollTop = 0;
    companyRecordModal.hidden = false;
    document.body.classList.add('modal-open');
    loadCompanyRecordFullHistory(item);
}

function buildCompanySnapshot(item) {
    return buildCompanyDetailsText(item);
}

function buildCompanySnapshotHtml(item) {
    if (!item) {
        return '';
    }

    return `
        <p><strong>Observações do contato:</strong></p>
        <p><br></p>
    `;
}

function formatStoredProspectionNotes(value) {
    const content = String(value || '').trim();

    if (!content) {
        return '';
    }

    if (/<[a-z][\s\S]*>/i.test(content)) {
        return content;
    }

    return escapeHtml(content).replace(/\n/g, '<br>');
}

function parseProspectionState(rawValue, item) {
    const content = String(rawValue || '').trim();
    const fallbackDraft = buildCompanySnapshotHtml(item);

    if (!content) {
        return {
            draftHtml: fallbackDraft,
            history: []
        };
    }

    try {
        const parsed = JSON.parse(content);

        if (parsed && parsed.kind === 'leadbenefits-contact-history') {
            return {
                draftHtml: parsed.draftHtml || fallbackDraft,
                history: Array.isArray(parsed.history) ? parsed.history : [],
                situacaoContato: parsed.situacaoContato || ''
            };
        }
    } catch {
        // Conteudos antigos eram salvos como HTML/texto simples.
    }

    const storedNotes = formatStoredProspectionNotes(content);

    return {
        draftHtml: storedNotes && storedNotes.includes('notepad-company')
            ? storedNotes
            : `${fallbackDraft}${storedNotes ? `<div class="notepad-divider"></div>${storedNotes}` : ''}`,
        history: [],
        situacaoContato: ''
    };
}

function serializeProspectionState(state) {
    return JSON.stringify({
        kind: 'leadbenefits-contact-history',
        draftHtml: state.draftHtml || '',
        history: Array.isArray(state.history) ? state.history : [],
        situacaoContato: state.situacaoContato || ''
    });
}

function booleanText(value) {
    if (value === true || value === '1') {
        return 'Sim';
    }
    if (value === false || value === '0') {
        return 'Não';
    }
    return '-';
}

function getBenefitFormValues() {
    return {
        contactPhone: contactPhoneInput?.value.trim() || getPhoneText(currentCompany || {}) || '',
        whatsapp: Boolean(contactWhatsappInput?.checked),
        contactEmail: contactEmailInput?.value.trim() || '',
        employeeCount: employeeCountInput?.value || '',
        healthPlan: healthPlanInput?.value || '',
        healthPlanAllEmployees: Boolean(healthPlanAllEmployeesInput?.checked),
        healthPlanOperator: healthPlanOperatorInput?.value.trim() || '',
        healthPlanExpiration: healthPlanExpirationInput?.value || '',
        dentalPlan: dentalPlanInput?.value || '',
        dentalPlanOperator: dentalPlanOperatorInput?.value.trim() || '',
        dentalPlanExpiration: dentalPlanExpirationInput?.value || '',
        lifeInsurance: lifeInsuranceInput?.value || '',
        lifeInsuranceOperator: lifeInsuranceOperatorInput?.value.trim() || '',
        lifeInsuranceExpiration: lifeInsuranceExpirationInput?.value || '',
        reasonCostReduction: Boolean(reasonCostReductionInput?.checked),
        reasonBetterService: Boolean(reasonBetterServiceInput?.checked),
        reasonExpandedCoverage: Boolean(reasonExpandedCoverageInput?.checked),
        switchInterest: switchInterestInput?.value || '',
        benefits: benefitsInput?.value.trim() || ''
    };
}

function setBenefitFormValues(values = {}, item = null) {
    if (contactPhoneInput) {
        contactPhoneInput.value = values.contactPhone || getPhoneText(item || {}) || '';
    }
    if (contactWhatsappInput) {
        contactWhatsappInput.checked = Boolean(values.whatsapp);
    }
    if (contactEmailInput) {
        contactEmailInput.value = values.contactEmail || item?.EMAIL || '';
    }
    if (employeeCountInput) {
        employeeCountInput.value = values.employeeCount || '';
    }
    if (healthPlanInput) {
        healthPlanInput.value = values.healthPlan || '';
    }
    if (healthPlanAllEmployeesInput) {
        healthPlanAllEmployeesInput.checked = Boolean(values.healthPlanAllEmployees);
    }
    if (healthPlanOperatorInput) {
        healthPlanOperatorInput.value = values.healthPlanOperator || '';
    }
    if (healthPlanExpirationInput) {
        healthPlanExpirationInput.value = values.healthPlanExpiration || '';
    }
    if (dentalPlanInput) {
        dentalPlanInput.value = values.dentalPlan || '';
    }
    if (dentalPlanOperatorInput) {
        dentalPlanOperatorInput.value = values.dentalPlanOperator || '';
    }
    if (dentalPlanExpirationInput) {
        dentalPlanExpirationInput.value = values.dentalPlanExpiration || '';
    }
    if (lifeInsuranceInput) {
        lifeInsuranceInput.value = values.lifeInsurance || '';
    }
    if (lifeInsuranceOperatorInput) {
        lifeInsuranceOperatorInput.value = values.lifeInsuranceOperator || '';
    }
    if (lifeInsuranceExpirationInput) {
        lifeInsuranceExpirationInput.value = values.lifeInsuranceExpiration || '';
    }
    if (reasonCostReductionInput) {
        reasonCostReductionInput.checked = Boolean(values.reasonCostReduction);
    }
    if (reasonBetterServiceInput) {
        reasonBetterServiceInput.checked = Boolean(values.reasonBetterService);
    }
    if (reasonExpandedCoverageInput) {
        reasonExpandedCoverageInput.checked = Boolean(values.reasonExpandedCoverage);
    }
    if (switchInterestInput) {
        switchInterestInput.value = values.switchInterest || '';
    }
    if (benefitsInput) {
        benefitsInput.value = values.benefits || '';
    }
}

function buildReplacementReasons(entry = {}) {
    return [
        entry.reasonCostReduction ? 'Redução de custos' : '',
        entry.reasonBetterService ? 'Melhorar atendimento' : '',
        entry.reasonExpandedCoverage ? 'Ampliar cobertura' : ''
    ].filter(Boolean).join(', ');
}

function formatHistoryDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return valueOrDash(value);
    }

    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatIsoDate(value) {
    const rawValue = String(value || '').trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
        return valueOrDash(rawValue);
    }

    const [year, month, day] = rawValue.split('-');
    return `${day}/${month}/${year}`;
}

function renderContactHistory(history = []) {
    if (!contactHistoryEl) {
        return;
    }

    if (!history.length) {
        contactHistoryEl.innerHTML = '<p class="empty-history">Nenhum contato registrado.</p>';
        return;
    }

    contactHistoryEl.innerHTML = history
        .slice()
        .reverse()
        .map((entry) => `
            <article class="history-entry">
                <p><strong>Data/hora:</strong> ${escapeHtml(formatHistoryDate(entry.at))}</p>
                <p><strong>Quem atendeu:</strong> ${escapeHtml(valueOrDash(entry.contactPerson))}</p>
                <p><strong>Cargo:</strong> ${escapeHtml(valueOrDash(entry.contactRole))}</p>
                <p><strong>Telefone:</strong> ${escapeHtml(valueOrDash(entry.contactPhone))}</p>
                <p><strong>WhatsApp:</strong> ${escapeHtml(booleanText(entry.whatsapp))}</p>
                <p><strong>E-mail:</strong> ${escapeHtml(valueOrDash(entry.contactEmail))}</p>
                <p><strong>Quantas vidas / funcionários:</strong> ${escapeHtml(valueOrDash(entry.employeeCount))}</p>
                <p><strong>Plano de saúde:</strong> ${escapeHtml(valueOrDash(entry.healthPlan))}</p>
                <p><strong>Saúde para todos:</strong> ${escapeHtml(booleanText(entry.healthPlanAllEmployees))}</p>
                <p><strong>Operadora saúde:</strong> ${escapeHtml(valueOrDash(entry.healthPlanOperator))}</p>
                <p><strong>Vencimento saúde:</strong> ${escapeHtml(formatIsoDate(entry.healthPlanExpiration))}</p>
                <p><strong>Plano odontológico:</strong> ${escapeHtml(valueOrDash(entry.dentalPlan))}</p>
                <p><strong>Operadora odonto:</strong> ${escapeHtml(valueOrDash(entry.dentalPlanOperator))}</p>
                <p><strong>Vencimento odonto:</strong> ${escapeHtml(formatIsoDate(entry.dentalPlanExpiration))}</p>
                <p><strong>Seguro de vida:</strong> ${escapeHtml(valueOrDash(entry.lifeInsurance))}</p>
                <p><strong>Operadora seguro:</strong> ${escapeHtml(valueOrDash(entry.lifeInsuranceOperator))}</p>
                <p><strong>Vencimento seguro:</strong> ${escapeHtml(formatIsoDate(entry.lifeInsuranceExpiration))}</p>
                <p><strong>Motivos de substituição:</strong> ${escapeHtml(valueOrDash(buildReplacementReasons(entry)))}</p>
                <p><strong>Interesse em trocar:</strong> ${escapeHtml(valueOrDash(entry.switchInterest))}</p>
                <p><strong>Outras necessidades:</strong> ${escapeHtml(valueOrDash(entry.benefits))}</p>
                <p><strong>Próximo contato:</strong> ${escapeHtml(formatIsoDate(entry.nextContact))}</p>
                <p><strong>Informações do contato:</strong></p>
                <div class="history-entry-notes">${entry.notesHtml || ''}</div>
            </article>
        `)
        .join('');
}

function showProspectionPanel() {
    tableWrap?.classList.add('is-hidden');
    notesPanel?.classList.remove('is-hidden');
}

function showResultsTable() {
    notesPanel?.classList.add('is-hidden');
    tableWrap?.classList.remove('is-hidden');
}

function syncProspectionEditor() {
    if (prospectionEditor && prospectionNotes) {
        currentProspectionState.draftHtml = prospectionEditor.innerHTML;
        prospectionNotes.value = serializeProspectionState(currentProspectionState);
    }
}

function setProspectionStatus(message) {
    if (prospectionStatus) {
        prospectionStatus.textContent = message;
    }
}

async function loadProspection(cnpj) {
    const response = await fetch(`/api/prospeccoes?cnpj=${encodeURIComponent(cnpj)}`);
    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload.error || 'Erro ao carregar histórico.');
    }

    return payload.prospeccao;
}

async function saveCompanyFlag(cnpj, ativa) {
    const response = await fetch('/api/empresas/flag', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cnpj, ativa })
    });
    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload.error || 'Erro ao atualizar flag.');
    }

    return payload.flagAtiva;
}

function renderCompanyNotes(item, prospeccao = null) {
    currentCompany = item;

    if (!item) {
        notesTitle.textContent = 'Selecione uma empresa';
        if (companySnapshot) {
            companySnapshot.value = '';
        }
        if (companyDetailsNotepad) {
            companyDetailsNotepad.innerHTML = '';
        }
        prospectionNotes.value = '';
        if (prospectionEditor) {
            prospectionEditor.innerHTML = '';
        }
        if (contactPersonInput) {
            contactPersonInput.value = '';
        }
        if (contactRoleInput) {
            contactRoleInput.value = '';
        }
        if (nextContactInput) {
            nextContactInput.value = '';
        }
        setBenefitFormValues({});
        currentProspectionState = { draftHtml: '', history: [] };
        renderContactHistory([]);
        saveProspectionButton.disabled = true;
        setProspectionStatus('Nenhuma empresa selecionada');
        showResultsTable();
        return;
    }

    notesTitle.textContent = `${valueOrDash(item.RAZAO_SOCIAL)} - ${formatCnpj(item.CNPJ)}`;
    if (companySnapshot) {
        companySnapshot.value = buildCompanySnapshot(item);
    }
    if (companyDetailsNotepad) {
        companyDetailsNotepad.innerHTML = buildCompanyDetailsHtml(item);
        companyDetailsNotepad.scrollTop = 0;
    }

    currentProspectionState = parseProspectionState(prospeccao?.observacoes, item);

    prospectionNotes.value = serializeProspectionState(currentProspectionState);
    if (prospectionEditor) {
        prospectionEditor.innerHTML = currentProspectionState.draftHtml;
    }
    if (contactPersonInput) {
        contactPersonInput.value = '';
    }
    if (contactRoleInput) {
        contactRoleInput.value = '';
    }
    if (nextContactInput) {
        nextContactInput.value = prospeccao?.proximoContato || '';
    }
    setBenefitFormValues({
        contactPhone: prospeccao?.telefoneContato || '',
        whatsapp: prospeccao?.whatsapp === '1',
        contactEmail: prospeccao?.emailContato || '',
        employeeCount: prospeccao?.numeroFuncionarios || '',
        healthPlan: prospeccao?.temPlanoSaude || '',
        healthPlanAllEmployees: prospeccao?.planoSaudeTodos === '1',
        healthPlanOperator: prospeccao?.operadoraSaude || '',
        healthPlanExpiration: prospeccao?.vencimentoSaude || '',
        dentalPlan: prospeccao?.temPlanoOdonto || '',
        dentalPlanOperator: prospeccao?.operadoraOdonto || '',
        dentalPlanExpiration: prospeccao?.vencimentoOdonto || '',
        lifeInsurance: prospeccao?.temSeguroVida || '',
        lifeInsuranceOperator: prospeccao?.operadoraSeguroVida || '',
        lifeInsuranceExpiration: prospeccao?.vencimentoSeguroVida || '',
        reasonCostReduction: prospeccao?.motivoReducaoCustos === '1',
        reasonBetterService: prospeccao?.motivoMelhorarAtendimento === '1',
        reasonExpandedCoverage: prospeccao?.motivoAmpliarCobertura === '1',
        switchInterest: prospeccao?.interesseTroca || '',
        benefits: prospeccao?.beneficios || ''
    }, item);
    renderContactHistory(currentProspectionState.history);
    saveProspectionButton.disabled = false;
    showProspectionPanel();
    setProspectionStatus(prospeccao?.atualizadoEm ? `Histórico carregado: ${prospeccao.atualizadoEm}` : 'Pronto para registrar contato');
}

async function selectCompanyForNotes(item) {
    if (!item?.CNPJ) {
        return;
    }

    renderCompanyNotes(item);
    setProspectionStatus('Carregando histórico...');

    try {
        const prospeccao = await loadProspection(item.CNPJ);
        renderCompanyNotes(item, prospeccao);
    } catch (error) {
        setProspectionStatus(error.message);
    }
}

function getCompanyRecordSubtitle(item) {
    const subtitleParts = [];
    const cnpj = formatPlainCnpj(item?.CNPJ);
    const city = plainValue(item?.MUNICIPIO_DESCRICAO);
    const uf = plainValue(item?.UF);
    const location = [city, uf].filter(Boolean).join(' / ');
    const phone = getPhoneText(item);

    if (cnpj) {
        subtitleParts.push(`CNPJ ${cnpj}`);
    }

    if (location) {
        subtitleParts.push(location);
    }

    if (phone) {
        subtitleParts.push(phone);
    }

    return subtitleParts.join(' | ');
}

function openCompanyRecordModal(item) {
    if (!item || !companyRecordModal || !companyRecordModalBody) {
        return;
    }

    currentCompany = item;
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (companyRecordModalTitle) {
        companyRecordModalTitle.textContent = plainValue(item.RAZAO_SOCIAL)
            || plainValue(item.NOME_FANTASIA)
            || 'Cadastro da empresa';
    }

    if (companyRecordModalSubtitle) {
        companyRecordModalSubtitle.textContent = getCompanyRecordSubtitle(item);
    }

    if (companyRecordOpenNotes) {
        companyRecordOpenNotes.hidden = false;
    }

    companyRecordModalBody.innerHTML = `
        ${buildContactStatusControlHtml()}
        <div class="company-record-notepad">
            ${buildCompanyDetailsHtml(item) || '<p class="company-record-empty">Nenhuma informacao detalhada disponivel.</p>'}
        </div>
        <div id="company-record-latest-contact" class="company-record-latest-contact">
            <section class="latest-contact-note">
                <h3>Ultimo contato</h3>
                <p>Carregando historico...</p>
            </section>
        </div>
    `;
    companyRecordModalBody.scrollTop = 0;
    companyRecordModal.hidden = false;
    document.body.classList.add('modal-open');
    companyRecordModalClose?.focus();
    loadCompanyRecordProspection(item);
}

function closeCompanyRecordModal() {
    if (!companyRecordModal || companyRecordModal.hidden) {
        return;
    }

    companyRecordModal.hidden = true;
    document.body.classList.remove('modal-open');

    if (companyRecordModalBody) {
        companyRecordModalBody.innerHTML = '';
    }

    if (lastFocusedElement && document.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
    }

    lastFocusedElement = null;
}

function addSelectedCompany(item) {
    if (!item?.CNPJ) {
        return;
    }

    selectedCompanies.add(item.CNPJ);

    if (!selectedLeadDrafts.has(item.CNPJ)) {
        selectedLeadDrafts.set(item.CNPJ, createLeadDraft(item));
    }
}

function removeSelectedCompany(cnpj) {
    selectedCompanies.delete(cnpj);
    selectedLeadDrafts.delete(cnpj);
}

function renderSelectedLeads() {
    if (!selectedLeadsEl) {
        return;
    }

    if (selectedLeadDrafts.size === 0) {
        selectedLeadsEl.innerHTML = '<div class="empty-selection">Selecione empresas na tabela para preparar contatos.</div>';
        return;
    }

    selectedLeadsEl.innerHTML = '';

    for (const lead of selectedLeadDrafts.values()) {
        const card = document.createElement('article');
        card.className = 'lead-card';
        card.dataset.cnpj = lead.cnpj;
        card.innerHTML = `
            <div class="lead-card-title">
                <strong>${escapeHtml(valueOrDash(lead.razaoSocial))}</strong>
                <button class="remove-lead-button" type="button" aria-label="Remover ${formatCnpj(lead.cnpj)}">Remover</button>
            </div>
            <label>
                CNPJ
                <input value="${formatCnpj(lead.cnpj)}" readonly>
            </label>
            <label>
                Razão Social
                <input value="${escapeHtml(lead.razaoSocial)}" readonly>
            </label>
            <label>
                Telefone
                <input data-field="telefone" value="${escapeHtml(lead.telefone)}">
            </label>
            <label>
                Nome do contato
                <input data-field="contato" value="${escapeHtml(lead.contato)}">
            </label>
            <label>
                E-mail
                <input data-field="email" type="email" value="${escapeHtml(lead.email)}">
            </label>
            <label>
                Observações
                <textarea data-field="observacoes" rows="3">${escapeHtml(lead.observacoes)}</textarea>
            </label>
        `;
        selectedLeadsEl.appendChild(card);
    }
}

function getCurrentPageCnpjs() {
    if (!resultsTable) {
        return [];
    }

    return resultsTable
        .rows({ page: 'current' })
        .data()
        .toArray()
        .map((item) => item.CNPJ)
        .filter(Boolean);
}

function syncPageSelectionState() {
    const currentCnpjs = getCurrentPageCnpjs();
    const selectedOnPage = currentCnpjs.filter((cnpj) => selectedCompanies.has(cnpj));

    document.querySelectorAll('.row-select').forEach((checkbox) => {
        checkbox.checked = selectedCompanies.has(checkbox.dataset.cnpj);
    });

    if (!selectPageCheckbox) {
        return;
    }

    selectPageCheckbox.checked = currentCnpjs.length > 0 && selectedOnPage.length === currentCnpjs.length;
    selectPageCheckbox.indeterminate = selectedOnPage.length > 0 && selectedOnPage.length < currentCnpjs.length;

    selectPageCheckbox.checked = allFilteredSelectionActive || (currentCnpjs.length > 0 && selectedOnPage.length === currentCnpjs.length);
    selectPageCheckbox.indeterminate = !allFilteredSelectionActive && selectedOnPage.length > 0 && selectedOnPage.length < currentCnpjs.length;
}

function buildSelectionParams(offset) {
    const params = new URLSearchParams();

    appendFormFilters(params);
    params.set('limit', selectionFetchLimit);
    params.set('offset', offset);

    return params;
}

async function selectAllFilteredCompanies() {
    if (!resultsTable || isSelectingAllFiltered) {
        return;
    }

    hasSearched = true;
    isSelectingAllFiltered = true;
    allFilteredSelectionActive = true;
    selectedCompanies.clear();
    selectedLeadDrafts.clear();

    if (selectPageCheckbox) {
        selectPageCheckbox.disabled = true;
    }

    if (clearSelectionButton) {
        clearSelectionButton.disabled = true;
    }

    let offset = 0;
    let total = 0;

    try {
        statusEl.textContent = 'Selecionando todas as empresas filtradas...';

        while (true) {
            const response = await fetch(`/api/empresas?${buildSelectionParams(offset).toString()}`);
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Erro ao selecionar empresas.');
            }

            const rows = Array.isArray(payload.rows) ? payload.rows : [];

            for (const row of rows) {
                addSelectedCompany(row);
            }

            total += rows.length;
            updateSelectionCount();
            renderSelectedLeads();
            statusEl.textContent = `${total.toLocaleString('pt-BR')} empresas selecionadas...`;

            if (rows.length < selectionFetchLimit) {
                break;
            }

            offset += selectionFetchLimit;
            await new Promise((resolve) => setTimeout(resolve, 0));
        }

        syncPageSelectionState();
        statusEl.textContent = `${total.toLocaleString('pt-BR')} empresas selecionadas`;
        resultsTable.ajax.reload(null, false);
    } catch (error) {
        allFilteredSelectionActive = false;
        clearAllSelections();
        statusEl.textContent = error.message;

        if (selectPageCheckbox) {
            selectPageCheckbox.checked = false;
        }
    } finally {
        isSelectingAllFiltered = false;

        if (selectPageCheckbox) {
            selectPageCheckbox.disabled = false;
        }

        if (clearSelectionButton) {
            clearSelectionButton.disabled = false;
        }

        syncPageSelectionState();
    }
}

function clearAllSelections() {
    allFilteredSelectionActive = false;
    selectedCompanies.clear();
    selectedLeadDrafts.clear();
    syncPageSelectionState();
    updateSelectionCount();
    renderSelectedLeads();
}

async function loadMunicipios(uf, searchTerm = '') {
    if (!uf || !municipioInput) {
        if (municipioInput) {
            municipioInput.innerHTML = '<option value="">Selecione a UF</option>';
        }
        return;
    }

    const currentRequestId = ++municipalityRequestId;
    const query = new URLSearchParams({ uf, q: searchTerm.trim() }).toString();
    const response = await fetch(`/api/municipios?${query}`);

    if (!response.ok) {
        return;
    }

    const data = await response.json();

    if (currentRequestId !== municipalityRequestId) {
        return;
    }

    municipioInput.innerHTML = '<option value="">Todos</option>';

    for (const item of data) {
        const option = document.createElement('option');
        option.value = item.codigo;
        option.textContent = item.nome;
        municipioInput.appendChild(option);
    }
}

async function loadCnaes(searchTerm = '') {
    const term = searchTerm.trim();

    if (!cnaesList) {
        return;
    }

    if (term.length < 2) {
        cnaesList.innerHTML = '';
        return;
    }

    const currentRequestId = ++cnaeRequestId;
    const response = await fetch(`/api/cnaes?q=${encodeURIComponent(term)}`);

    if (!response.ok) {
        return;
    }

    const data = await response.json();

    if (currentRequestId !== cnaeRequestId) {
        return;
    }

    cnaesList.innerHTML = '';

    for (const item of data) {
        const option = document.createElement('option');
        option.value = item.label;
        cnaesList.appendChild(option);
    }
}

function initializeDataTable() {
    resultsTable = new DataTable('#results-table', {
        serverSide: true,
        processing: true,
        searching: true,
        ajax: async (data, callback) => {
            if (!hasSearched) {
                callback({
                    draw: data.draw,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: []
                });
                return;
            }

            statusEl.textContent = 'Pesquisando...';

            try {
                const response = await fetch(`/api/empresas?${buildDataTableParams(data).toString()}`);
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload.error || 'Erro ao pesquisar.');
                }

                const totalLabel = payload.hasMore
                    ? `mais de ${payload.recordsFiltered.toLocaleString('pt-BR')}`
                    : payload.recordsFiltered.toLocaleString('pt-BR');
                statusEl.textContent = `${totalLabel} resultados em ${payload.elapsedMs} ms`;
                callback(payload);
            } catch (error) {
                statusEl.textContent = error.message;
                callback({
                    draw: data.draw,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: []
                });
            }
        },
        columns: [
            {
                data: 'CNPJ',
                orderable: false,
                searchable: false,
                className: 'select-cell',
                render: (value) => `
                    <input class="row-select" type="checkbox" data-cnpj="${escapeHtml(value)}" aria-label="Selecionar empresa ${formatCnpj(value)}">
                `
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                className: 'flag-cell',
                render: (item) => renderFlagButton(item)
            },
            {
                data: 'RAZAO_SOCIAL',
                orderable: false,
                render: (value) => `<strong>${truncateCell(value)}</strong>`
            },
            {
                data: 'NOME_FANTASIA',
                orderable: false,
                render: (value) => truncateCell(value)
            },
            {
                data: 'MUNICIPIO_DESCRICAO',
                orderable: false,
                render: (value) => truncateCell(value)
            },
            {
                data: 'UF',
                orderable: true,
                render: (value) => escapeHtml(valueOrDash(value))
            },
            {
                data: null,
                orderable: false,
                render: (item) => formatTelefone(item)
            },
            {
                data: 'CNAE_FISCAL_PRINCIPAL',
                orderable: false,
                render: (value, type, item) => {
                    const code = valueOrDash(value);
                    const description = valueOrDash(item.CNAE_FISCAL_PRINCIPAL_DESCRICAO);
                    const title = escapeHtml(`${code} - ${description}`);

                    return `
                        <strong class="cell-truncate" title="${title}">${escapeHtml(code)}</strong>
                        <span class="cell-truncate" title="${title}">${escapeHtml(description)}</span>
                    `;
                }
            },
            {
                data: 'DATA_INICIO_ATIVIDADE',
                orderable: true,
                render: (value) => formatDate(value)
            },
            {
                data: 'PORTE_EMPRESA',
                orderable: false,
                render: (value) => truncateCell(value)
            },
            {
                data: 'CNPJ',
                orderable: false,
                render: (value) => formatCnpj(value)
            }
        ],
        pageLength: 25,
        lengthMenu: [10, 25, 50, 100, 200],
        lengthChange: false,
        order: [],
        drawCallback: () => {
            syncPageSelectionState();
            updateSelectionCount();
            renderSelectedLeads();

            if (tableShowSummary) {
                const pageLength = resultsTable?.page.len?.() || 25;
                tableShowSummary.textContent = `Mostrar ${pageLength} registros por página. Use a paginação para navegar pelos resultados.`;
            }
        },
        language: {
            decimal: ',',
            thousands: '.',
            emptyTable: 'Nenhum resultado encontrado.',
            info: 'Mostrando _START_ até _END_ de _TOTAL_ registros conhecidos',
            infoEmpty: 'Mostrando 0 até 0 de 0 registros',
            infoFiltered: '(filtrado de _MAX_ registros no total)',
            lengthMenu: 'Mostrar _MENU_ registros por página',
            loadingRecords: 'Carregando...',
            processing: 'Processando...',
            search: 'Buscar na tabela:',
            zeroRecords: 'Nenhum registro correspondente encontrado',
            paginate: {
                first: 'Primeiro',
                last: 'Último',
                next: 'Próximo',
                previous: 'Anterior'
            },
            aria: {
                orderable: 'Ordenar por esta coluna',
                orderableReverse: 'Inverter ordenação desta coluna'
            }
        }
    });
}

function search(event) {
    event.preventDefault();
    currentSearchSource = getSubmitSearchSource(event);
    hasSearched = true;
    allFilteredSelectionActive = false;

    if (currentSearchSource === 'rfb') {
        closeAdvancedSearch();
    }

    showResultsTable();
    resultsTable.ajax.reload();
}

form.addEventListener('submit', search);

function closeAdvancedSearch() {
    if (!advancedSearchToggle || !advancedSearchPanel) {
        return;
    }

    advancedSearchPanel.hidden = true;
    advancedSearchToggle.setAttribute('aria-expanded', 'false');
    advancedSearchToggle.classList.remove('is-active');
}

if (advancedSearchToggle && advancedSearchPanel) {
    advancedSearchToggle.addEventListener('click', () => {
        if (window.location.hash !== '#pesquisa-avancada') {
            window.location.hash = '#pesquisa-avancada';
            return;
        }

        const willOpen = advancedSearchPanel.hidden;

        advancedSearchPanel.hidden = !willOpen;
        advancedSearchToggle.setAttribute('aria-expanded', String(willOpen));
        advancedSearchToggle.classList.toggle('is-active', willOpen);
    });
}

if (backToTableButton) {
    backToTableButton.addEventListener('click', showResultsTable);
}

if (prospectionEditor) {
    prospectionEditor.addEventListener('input', syncProspectionEditor);
}

for (const input of [cnpjFilter, razaoFilter, fantasiaFilter]) {
    input.addEventListener('input', syncQueryFilter);
}

document.querySelectorAll('.switch-filter input').forEach((input) => {
    input.addEventListener('change', () => syncSwitchConflicts(input));
});

if (ufSelect) {
    ufSelect.addEventListener('change', () => {
        updateMunicipioAvailability();
        loadMunicipios(ufSelect.value, '');
    });
}

if (cnaeInput) {
    cnaeInput.addEventListener('focus', () => loadCnaes(cnaeInput.value));
    cnaeInput.addEventListener('input', () => loadCnaes(cnaeInput.value));
}

for (const dateInput of [aberturaInicioInput, aberturaFimInput]) {
    if (dateInput) {
        dateInput.addEventListener('input', () => {
            dateInput.value = maskDate(dateInput.value);
        });
    }
}

document.querySelector('#results-table').addEventListener('change', (event) => {
    if (!event.target.classList.contains('row-select')) {
        return;
    }

    const cnpj = event.target.dataset.cnpj;

    if (!cnpj) {
        return;
    }

    if (event.target.checked) {
        const rowData = resultsTable
            .rows({ page: 'current' })
            .data()
            .toArray()
            .find((item) => item.CNPJ === cnpj);
        addSelectedCompany(rowData);
    } else {
        allFilteredSelectionActive = false;
        removeSelectedCompany(cnpj);
    }

    syncPageSelectionState();
    updateSelectionCount();
    renderSelectedLeads();
});

document.querySelector('#results-table').addEventListener('click', async (event) => {
    const button = event.target.closest('.company-flag-button');

    if (!button) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const row = button.closest('tr');
    const rowData = resultsTable?.row(row).data();
    const cnpj = button.dataset.cnpj;

    if (!rowData || !cnpj) {
        return;
    }

    const nextFlagState = Number(rowData.FLAG_ATIVA || 0) !== 1;
    button.disabled = true;

    try {
        const flagAtiva = await saveCompanyFlag(cnpj, nextFlagState);
        rowData.FLAG_ATIVA = flagAtiva ? 1 : 0;
        resultsTable.row(row).data(rowData).invalidate();
        syncPageSelectionState();
    } catch (error) {
        statusEl.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

companyRecordModalClose?.addEventListener('click', closeCompanyRecordModal);

companyRecordOpenNotes?.addEventListener('click', () => {
    const selectedCompany = currentCompany;

    if (!selectedCompany) {
        return;
    }

    openCompanyHistoryModal(selectedCompany);
});

companyRecordModal?.addEventListener('click', (event) => {
    if (event.target.closest('#company-contact-status-save')) {
        saveCompanyContactStatus();
        return;
    }

    if (event.target === companyRecordModal) {
        closeCompanyRecordModal();
    }
});

manualCompanyModal?.addEventListener('click', (event) => {
    if (event.target === manualCompanyModal) {
        closeManualCompanyModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && manualCompanyModal && !manualCompanyModal.hidden) {
        closeManualCompanyModal();
        return;
    }

    if (event.key === 'Escape' && companyRecordModal && !companyRecordModal.hidden) {
        closeCompanyRecordModal();
    }
});

document.querySelector('#results-table tbody').addEventListener('click', (event) => {
    if (event.target.closest('input, button, a')) {
        return;
    }

    const row = event.target.closest('tr');

    if (!row || !resultsTable) {
        return;
    }

    const rowData = resultsTable.row(row).data();

    if (!rowData) {
        return;
    }

    document.querySelectorAll('#results-table tbody tr').forEach((tableRow) => {
        tableRow.classList.remove('selected-row');
    });
    row.classList.add('selected-row');
    openCompanyRecordModal(rowData);
});

selectPageCheckbox.addEventListener('change', async () => {
    if (selectPageCheckbox.checked) {
        await selectAllFilteredCompanies();
    } else {
        clearAllSelections();
        return;
    }

    syncPageSelectionState();
    updateSelectionCount();
    renderSelectedLeads();
});

clearSelectionButton.addEventListener('click', () => {
    clearAllSelections();
});

dashboardRefreshButton?.addEventListener('click', () => {
    if (window.location.hash !== '#inicio') {
        window.location.hash = '#inicio';
        return;
    }

    setMainView('inicio');
    loadDashboard();
});
dashboardAtrasadosAllButton?.addEventListener('click', openOverdueModal);
overdueModalClose?.addEventListener('click', closeOverdueModal);
manualCompanyOpenButton?.addEventListener('click', openManualCompanyModal);
manualCompanyCloseButton?.addEventListener('click', closeManualCompanyModal);
manualCompanyForm?.addEventListener('submit', saveManualCompany);
companyImportForm?.addEventListener('submit', handleCompanyImport);
importedCompanyForm?.addEventListener('submit', saveImportedCompany);

importedCompanyForm?.addEventListener('reset', () => {
    if (importedCompanyStatus) {
        importedCompanyStatus.textContent = 'Preencha os dados para salvar no banco de importacao.';
    }
});

companyImportHistory?.addEventListener('click', async (event) => {
    const button = event.target.closest('.import-error-open');

    if (!button) {
        return;
    }

    try {
        const response = await fetch(`/api/importacoes/erros?id=${encodeURIComponent(button.dataset.id)}`);
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao carregar erros.');
        }

        if (companyImportResult) {
            companyImportResult.hidden = false;
        }
        renderImportErrors(payload.erros || []);
    } catch (error) {
        if (companyImportStatus) {
            companyImportStatus.textContent = error.message;
        }
    }
});

manualCompanyForm?.addEventListener('reset', () => {
    setManualCompanyStatus('Preencha os dados para criar o cadastro no CRM.');
});

dashboardAtrasadosList?.addEventListener('click', (event) => {
    const button = event.target.closest('.dashboard-view-button');

    if (!button) {
        return;
    }

    const cnpj = String(button.dataset.cnpj || '').replace(/\D/g, '');
    const company = dashboardCompanyRecords.get(cnpj);

    if (!company) {
        statusEl.textContent = 'Cadastro nao encontrado no painel. Atualize a agenda.';
        return;
    }

    openCompanyRecordModal(company);
});

overdueModalList?.addEventListener('click', (event) => {
    const button = event.target.closest('.dashboard-view-button');

    if (!button) {
        return;
    }

    const cnpj = String(button.dataset.cnpj || '').replace(/\D/g, '');
    const company = dashboardCompanyRecords.get(cnpj);

    if (!company) {
        return;
    }

    closeOverdueModal();
    openCompanyRecordModal(company);
});

selectedLeadsEl.addEventListener('input', (event) => {
    const field = event.target.dataset.field;
    const card = event.target.closest('.lead-card');

    if (!field || !card) {
        return;
    }

    const draft = selectedLeadDrafts.get(card.dataset.cnpj);

    if (draft) {
        draft[field] = event.target.value;
    }
});

selectedLeadsEl.addEventListener('click', (event) => {
    if (!event.target.classList.contains('remove-lead-button')) {
        return;
    }

    const card = event.target.closest('.lead-card');

    if (!card) {
        return;
    }

    allFilteredSelectionActive = false;
    removeSelectedCompany(card.dataset.cnpj);
    syncPageSelectionState();
    updateSelectionCount();
    renderSelectedLeads();
});

clearButton.addEventListener('click', () => {
    form.reset();
    allFilteredSelectionActive = false;
    cnpjFilter.value = '';
    razaoFilter.value = '';
    fantasiaFilter.value = '';
    syncQueryFilter();
    hasSearched = false;
    statusEl.textContent = 'Pronto para pesquisar';
    updateMunicipioAvailability();
    cnaesList.innerHTML = '';
    currentCompany = null;
    renderCompanyNotes(null);
    resultsTable.search('');
    resultsTable.clear().draw();
});

prospectionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    syncProspectionEditor();

    if (!currentCompany?.CNPJ) {
        return;
    }

    const benefitValues = getBenefitFormValues();
    const nextProspectionState = {
        draftHtml: currentProspectionState.draftHtml,
        history: [
            ...(currentProspectionState.history || []),
            {
                at: new Date().toISOString(),
                contactPerson: contactPersonInput?.value.trim() || '-',
                contactRole: contactRoleInput?.value.trim() || '-',
                nextContact: nextContactInput?.value || '',
                ...benefitValues,
                notesHtml: currentProspectionState.draftHtml
            }
        ]
    };
    const serializedProspection = serializeProspectionState(nextProspectionState);

    saveProspectionButton.disabled = true;
    setProspectionStatus('Salvando histórico...');

    try {
        const response = await fetch(`/api/prospeccoes?cnpj=${encodeURIComponent(currentCompany.CNPJ)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                dadosEmpresa: currentCompany,
                observacoes: serializedProspection,
                nomeContato: contactPersonInput?.value.trim() || '',
                cargoContato: contactRoleInput?.value.trim() || '',
                proximoContato: nextContactInput?.value || '',
                telefoneContato: benefitValues.contactPhone,
                whatsapp: benefitValues.whatsapp,
                emailContato: benefitValues.contactEmail,
                numeroFuncionarios: benefitValues.employeeCount,
                beneficios: benefitValues.benefits,
                temPlanoSaude: benefitValues.healthPlan,
                planoSaudeTodos: benefitValues.healthPlanAllEmployees,
                operadoraSaude: benefitValues.healthPlanOperator,
                vencimentoSaude: benefitValues.healthPlanExpiration,
                temPlanoOdonto: benefitValues.dentalPlan,
                operadoraOdonto: benefitValues.dentalPlanOperator,
                vencimentoOdonto: benefitValues.dentalPlanExpiration,
                temSeguroVida: benefitValues.lifeInsurance,
                operadoraSeguroVida: benefitValues.lifeInsuranceOperator,
                vencimentoSeguroVida: benefitValues.lifeInsuranceExpiration,
                motivoReducaoCustos: benefitValues.reasonCostReduction,
                motivoMelhorarAtendimento: benefitValues.reasonBetterService,
                motivoAmpliarCobertura: benefitValues.reasonExpandedCoverage,
                interesseTroca: benefitValues.switchInterest,
                outrasNecessidades: benefitValues.benefits
            })
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Erro ao salvar histórico.');
        }

        currentProspectionState = parseProspectionState(payload.prospeccao?.observacoes, currentCompany);
        prospectionNotes.value = serializeProspectionState(currentProspectionState);
        renderContactHistory(currentProspectionState.history);
        if (contactPersonInput) {
            contactPersonInput.value = '';
        }
        if (contactRoleInput) {
            contactRoleInput.value = '';
        }
        if (nextContactInput) {
            nextContactInput.value = payload.prospeccao?.proximoContato || '';
        }
        setBenefitFormValues({
            contactPhone: payload.prospeccao?.telefoneContato || '',
            whatsapp: payload.prospeccao?.whatsapp === '1',
            contactEmail: payload.prospeccao?.emailContato || '',
            employeeCount: payload.prospeccao?.numeroFuncionarios || '',
            healthPlan: payload.prospeccao?.temPlanoSaude || '',
            healthPlanAllEmployees: payload.prospeccao?.planoSaudeTodos === '1',
            healthPlanOperator: payload.prospeccao?.operadoraSaude || '',
            healthPlanExpiration: payload.prospeccao?.vencimentoSaude || '',
            dentalPlan: payload.prospeccao?.temPlanoOdonto || '',
            dentalPlanOperator: payload.prospeccao?.operadoraOdonto || '',
            dentalPlanExpiration: payload.prospeccao?.vencimentoOdonto || '',
            lifeInsurance: payload.prospeccao?.temSeguroVida || '',
            lifeInsuranceOperator: payload.prospeccao?.operadoraSeguroVida || '',
            lifeInsuranceExpiration: payload.prospeccao?.vencimentoSeguroVida || '',
            reasonCostReduction: payload.prospeccao?.motivoReducaoCustos === '1',
            reasonBetterService: payload.prospeccao?.motivoMelhorarAtendimento === '1',
            reasonExpandedCoverage: payload.prospeccao?.motivoAmpliarCobertura === '1',
            switchInterest: payload.prospeccao?.interesseTroca || '',
            benefits: ''
        }, currentCompany);
        setProspectionStatus(`Histórico salvo: ${payload.prospeccao.atualizadoEm}`);
        loadDashboard();
    } catch (error) {
        setProspectionStatus(error.message);
    } finally {
        saveProspectionButton.disabled = false;
    }
});

window.addEventListener('hashchange', () => {
    if (!appShell || appShell.hidden) {
        return;
    }

    handleNavigation();
});

loginForm?.addEventListener('submit', handleLogin);
logoutButton?.addEventListener('click', handleLogout);

initializeAuthentication();
