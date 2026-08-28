const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { URL } = require('url');
const { once } = require('events');

let Database;
let XLSX;

try {
    Database = require('better-sqlite3');
} catch {
    Database = require('../../importador/node_modules/better-sqlite3');
}

try {
    XLSX = require('xlsx');
} catch {
    XLSX = null;
}

const rootDir = path.resolve(__dirname, '..', '..');
const frontendDir = path.resolve(__dirname, '..', 'frontend');
const port = Number(process.env.PORT || 3000);
const railwayVolumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH || '';

function ensureDirectory(dirPath) {
    if (dirPath && !fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function resolveRailwaySqlitePath(envName, bundledPath, fileName, options = {}) {
    if (process.env[envName]) {
        return process.env[envName];
    }

    if (!railwayVolumePath) {
        return bundledPath;
    }

    ensureDirectory(railwayVolumePath);
    const volumePath = path.join(railwayVolumePath, fileName);

    if (options.copyBundled && fs.existsSync(bundledPath) && !fs.existsSync(volumePath)) {
        fs.copyFileSync(bundledPath, volumePath);
    }

    return volumePath;
}

const bancoPath = resolveRailwaySqlitePath(
    'LEADBENEFITS_DB',
    path.join(rootDir, 'LeadBenefits.sqlite'),
    'LeadBenefits.sqlite'
);
const prospeccoesPath = resolveRailwaySqlitePath(
    'LEADBENEFITS_PROSPECCOES_DB',
    path.join(__dirname, '..', 'prospeccoes.sqlite'),
    'prospeccoes.sqlite',
    { copyBundled: true }
);
const importacaoPath = resolveRailwaySqlitePath(
    'LEADBENEFITS_IMPORTACAO_DB',
    path.join(__dirname, '..', 'CRM_importacao.sqlite'),
    'CRM_importacao.sqlite',
    { copyBundled: true }
);
const db = new Database(bancoPath, { readonly: true });
const prospeccoesDb = new Database(prospeccoesPath);
const importacaoDb = new Database(importacaoPath);

db.pragma('query_only = ON');
prospeccoesDb.pragma('journal_mode = WAL');
importacaoDb.pragma('journal_mode = WAL');
prospeccoesDb.exec(`
    CREATE TABLE IF NOT EXISTS PROSPECCOES (
        CNPJ TEXT PRIMARY KEY,
        DADOS_EMPRESA TEXT NOT NULL DEFAULT '{}',
        OBSERVACOES TEXT NOT NULL DEFAULT '',
        CRIADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ATUALIZADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`);
prospeccoesDb.exec(`
    CREATE TABLE IF NOT EXISTS EMPRESAS_FLAGS (
        CNPJ TEXT PRIMARY KEY,
        FLAG_ATIVA INTEGER NOT NULL DEFAULT 1 CHECK (FLAG_ATIVA IN (0, 1)),
        CRIADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ATUALIZADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS IDX_EMPRESAS_FLAGS_ATIVA
        ON EMPRESAS_FLAGS (FLAG_ATIVA, CNPJ);
`);

function ensureProspeccoesColumns() {
    const columns = new Set(
        prospeccoesDb
            .prepare('PRAGMA table_info(PROSPECCOES)')
            .all()
            .map((column) => column.name)
    );

    const migrations = [
        ['NOME_CONTATO', 'ALTER TABLE PROSPECCOES ADD COLUMN NOME_CONTATO TEXT'],
        ['CARGO_CONTATO', 'ALTER TABLE PROSPECCOES ADD COLUMN CARGO_CONTATO TEXT'],
        ['PROXIMO_CONTATO', 'ALTER TABLE PROSPECCOES ADD COLUMN PROXIMO_CONTATO TEXT'],
        ['NUMERO_FUNCIONARIOS', 'ALTER TABLE PROSPECCOES ADD COLUMN NUMERO_FUNCIONARIOS TEXT'],
        ['BENEFICIOS', 'ALTER TABLE PROSPECCOES ADD COLUMN BENEFICIOS TEXT'],
        ['TELEFONE_CONTATO', 'ALTER TABLE PROSPECCOES ADD COLUMN TELEFONE_CONTATO TEXT'],
        ['WHATSAPP', 'ALTER TABLE PROSPECCOES ADD COLUMN WHATSAPP TEXT'],
        ['EMAIL_CONTATO', 'ALTER TABLE PROSPECCOES ADD COLUMN EMAIL_CONTATO TEXT'],
        ['TEM_PLANO_SAUDE', 'ALTER TABLE PROSPECCOES ADD COLUMN TEM_PLANO_SAUDE TEXT'],
        ['PLANO_SAUDE_TODOS', 'ALTER TABLE PROSPECCOES ADD COLUMN PLANO_SAUDE_TODOS TEXT'],
        ['OPERADORA_SAUDE', 'ALTER TABLE PROSPECCOES ADD COLUMN OPERADORA_SAUDE TEXT'],
        ['VENCIMENTO_SAUDE', 'ALTER TABLE PROSPECCOES ADD COLUMN VENCIMENTO_SAUDE TEXT'],
        ['TEM_PLANO_ODONTO', 'ALTER TABLE PROSPECCOES ADD COLUMN TEM_PLANO_ODONTO TEXT'],
        ['OPERADORA_ODONTO', 'ALTER TABLE PROSPECCOES ADD COLUMN OPERADORA_ODONTO TEXT'],
        ['VENCIMENTO_ODONTO', 'ALTER TABLE PROSPECCOES ADD COLUMN VENCIMENTO_ODONTO TEXT'],
        ['TEM_SEGURO_VIDA', 'ALTER TABLE PROSPECCOES ADD COLUMN TEM_SEGURO_VIDA TEXT'],
        ['OPERADORA_SEGURO_VIDA', 'ALTER TABLE PROSPECCOES ADD COLUMN OPERADORA_SEGURO_VIDA TEXT'],
        ['VENCIMENTO_SEGURO_VIDA', 'ALTER TABLE PROSPECCOES ADD COLUMN VENCIMENTO_SEGURO_VIDA TEXT'],
        ['MOTIVO_REDUCAO_CUSTOS', 'ALTER TABLE PROSPECCOES ADD COLUMN MOTIVO_REDUCAO_CUSTOS TEXT'],
        ['MOTIVO_MELHORAR_ATENDIMENTO', 'ALTER TABLE PROSPECCOES ADD COLUMN MOTIVO_MELHORAR_ATENDIMENTO TEXT'],
        ['MOTIVO_AMPLIAR_COBERTURA', 'ALTER TABLE PROSPECCOES ADD COLUMN MOTIVO_AMPLIAR_COBERTURA TEXT'],
        ['INTERESSE_TROCA', 'ALTER TABLE PROSPECCOES ADD COLUMN INTERESSE_TROCA TEXT'],
        ['OUTRAS_NECESSIDADES', 'ALTER TABLE PROSPECCOES ADD COLUMN OUTRAS_NECESSIDADES TEXT']
    ];

    for (const [column, sql] of migrations) {
        if (!columns.has(column)) {
            prospeccoesDb.exec(sql);
        }
    }
}

ensureProspeccoesColumns();

function ensureImportacaoSchema() {
    importacaoDb.exec(`
        CREATE TABLE IF NOT EXISTS Importacoes (
            ID_IMPORTACAO INTEGER PRIMARY KEY AUTOINCREMENT,
            NOME_ARQUIVO TEXT NOT NULL,
            TIPO_ARQUIVO TEXT NOT NULL,
            DATA_HORA_IMPORTACAO TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            USUARIO TEXT,
            TOTAL_LINHAS INTEGER NOT NULL DEFAULT 0,
            TOTAL_IMPORTADAS INTEGER NOT NULL DEFAULT 0,
            TOTAL_ATUALIZADAS INTEGER NOT NULL DEFAULT 0,
            TOTAL_DUPLICADAS INTEGER NOT NULL DEFAULT 0,
            TOTAL_ERROS INTEGER NOT NULL DEFAULT 0,
            TOTAL_CNPJ_PENDENTE INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS Empresas_Importadas (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            ID_IMPORTACAO INTEGER,
            CNPJ TEXT,
            RAZAO_SOCIAL TEXT NOT NULL,
            NOME_FANTASIA TEXT,
            TELEFONE TEXT,
            TELEFONE2 TEXT,
            EMAIL TEXT,
            LOGRADOURO TEXT,
            NUMERO TEXT,
            COMPLEMENTO TEXT,
            BAIRRO TEXT,
            CEP TEXT,
            MUNICIPIO TEXT,
            UF TEXT,
            NOME_CONTATO TEXT,
            CARGO_CONTATO TEXT,
            OBSERVACOES TEXT,
            ORIGEM TEXT NOT NULL CHECK (ORIGEM IN ('IMPORTACAO', 'CADASTRO_MANUAL')),
            NOME_ARQUIVO_ORIGEM TEXT,
            DATA_IMPORTACAO TEXT,
            CNPJ_PENDENTE TEXT NOT NULL DEFAULT 'S' CHECK (CNPJ_PENDENTE IN ('S', 'N')),
            DATA_CADASTRO TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            DATA_ATUALIZACAO TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ID_IMPORTACAO) REFERENCES Importacoes (ID_IMPORTACAO)
        );

        CREATE TABLE IF NOT EXISTS Importacao_Erros (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            ID_IMPORTACAO INTEGER NOT NULL,
            LINHA INTEGER,
            CAMPO TEXT,
            MOTIVO TEXT NOT NULL,
            DADOS_ORIGINAIS TEXT,
            CRIADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ID_IMPORTACAO) REFERENCES Importacoes (ID_IMPORTACAO)
        );

        CREATE UNIQUE INDEX IF NOT EXISTS IDX_EMPRESAS_IMPORTADAS_CNPJ
            ON Empresas_Importadas (CNPJ)
            WHERE CNPJ IS NOT NULL AND CNPJ <> '';

        CREATE INDEX IF NOT EXISTS IDX_EMPRESAS_IMPORTADAS_BUSCA
            ON Empresas_Importadas (UF, MUNICIPIO, RAZAO_SOCIAL);

        CREATE INDEX IF NOT EXISTS IDX_EMPRESAS_IMPORTADAS_TELEFONE
            ON Empresas_Importadas (TELEFONE)
            WHERE TELEFONE IS NOT NULL AND TELEFONE <> '';

        CREATE INDEX IF NOT EXISTS IDX_IMPORTACAO_ERROS_IMPORTACAO
            ON Importacao_Erros (ID_IMPORTACAO);
    `);
}

ensureImportacaoSchema();

const funcionalidadesCatalogo = [
    {
        codigo: 'dashboard-crm',
        nome: 'Dashboard CRM',
        categoria: 'Operacao',
        descricao: 'Visualizar painel inicial, metricas do mes e agenda de contatos.'
    },
    {
        codigo: 'pesquisa-geral',
        nome: 'Pesquisa geral',
        categoria: 'Empresas',
        descricao: 'Pesquisar empresas por razao social ou CNPJ.'
    },
    {
        codigo: 'pesquisa-avancada',
        nome: 'Pesquisa avancada',
        categoria: 'Empresas',
        descricao: 'Usar filtros por CNAE, abertura, situacao, MEI, telefone e e-mail.'
    },
    {
        codigo: 'cadastrar-nova-empresa',
        nome: 'Cadastrar nova empresa',
        categoria: 'Empresas',
        descricao: 'Criar cadastro manual de empresas no CRM.'
    },
    {
        codigo: 'importacao-empresas',
        nome: 'Importacao de empresas',
        categoria: 'Empresas',
        descricao: 'Importar arquivos XLSX ou CSV para a base auxiliar.'
    },
    {
        codigo: 'exportacao-empresas',
        nome: 'Exportacao de empresas',
        categoria: 'Empresas',
        descricao: 'Exportar empresas selecionadas para planilha.'
    },
    {
        codigo: 'selecionar-leads',
        nome: 'Selecionar leads',
        categoria: 'Prospecao',
        descricao: 'Montar listas de empresas selecionadas para contato.'
    },
    {
        codigo: 'agenda-contatos',
        nome: 'Agenda de contatos',
        categoria: 'Prospecao',
        descricao: 'Acessar contatos atrasados, de hoje e do proximo dia.'
    },
    {
        codigo: 'registrar-historico-contato',
        nome: 'Registrar historico de contato',
        categoria: 'Prospecao',
        descricao: 'Salvar anotacoes, beneficios e proximo contato.'
    },
    {
        codigo: 'marcar-empresa-prioritaria',
        nome: 'Marcar empresa prioritaria',
        categoria: 'Prospecao',
        descricao: 'Usar flag de prioridade nas empresas pesquisadas.'
    },
    {
        codigo: 'administracao-usuarios',
        nome: 'Administracao de usuarios',
        categoria: 'Administracao',
        descricao: 'Visualizar usuarios cadastrados e acessos ativos.'
    },
    {
        codigo: 'configuracoes-usuario',
        nome: 'Configuracoes do usuario',
        categoria: 'Administracao',
        descricao: 'Alterar perfil, status e permissoes por funcionalidade.'
    },
    {
        codigo: 'relatorios-gerenciais',
        nome: 'Relatorios gerenciais',
        categoria: 'Gestao',
        descricao: 'Consultar indicadores gerenciais e produtividade comercial.'
    }
];

const permissoesOperadorPadrao = new Set([
    'dashboard-crm',
    'pesquisa-geral',
    'pesquisa-avancada',
    'selecionar-leads',
    'agenda-contatos',
    'registrar-historico-contato',
    'marcar-empresa-prioritaria'
]);

function createPasswordHash(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(String(password || ''), salt, 120000, 32, 'sha256').toString('hex');

    return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
    const parts = String(storedHash || '').split('$');

    if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
        return false;
    }

    const iterations = Number(parts[1]);
    const salt = parts[2];
    const expected = Buffer.from(parts[3], 'hex');

    if (!Number.isInteger(iterations) || !salt || expected.length === 0) {
        return false;
    }

    const actual = crypto.pbkdf2Sync(String(password || ''), salt, iterations, expected.length, 'sha256');

    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function hashToken(token) {
    return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function randomToken() {
    return crypto.randomBytes(32).toString('base64url');
}

function getTableColumns(database, tableName) {
    return new Set(
        database
            .prepare(`PRAGMA table_info(${tableName})`)
            .all()
            .map((column) => column.name)
    );
}

function ensureAdminSchema() {
    prospeccoesDb.exec(`
        CREATE TABLE IF NOT EXISTS CRM_USUARIOS (
            ID_USUARIO INTEGER PRIMARY KEY AUTOINCREMENT,
            NOME TEXT NOT NULL,
            EMAIL TEXT NOT NULL UNIQUE,
            CARGO TEXT NOT NULL DEFAULT '',
            DEPARTAMENTO TEXT NOT NULL DEFAULT '',
            PERFIL TEXT NOT NULL DEFAULT 'OPERADOR',
            STATUS TEXT NOT NULL DEFAULT 'ATIVO' CHECK (STATUS IN ('ATIVO', 'INATIVO')),
            SENHA_TEMPORARIA TEXT NOT NULL DEFAULT '',
            SENHA_HASH TEXT NOT NULL DEFAULT '',
            PRECISA_TROCAR_SENHA INTEGER NOT NULL DEFAULT 1 CHECK (PRECISA_TROCAR_SENHA IN (0, 1)),
            OBSERVACOES TEXT NOT NULL DEFAULT '',
            CRIADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ULTIMO_ACESSO_EM TEXT,
            ATUALIZADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS CRM_FUNCIONALIDADES (
            CODIGO TEXT PRIMARY KEY,
            NOME TEXT NOT NULL,
            CATEGORIA TEXT NOT NULL,
            DESCRICAO TEXT NOT NULL DEFAULT '',
            ATIVA INTEGER NOT NULL DEFAULT 1 CHECK (ATIVA IN (0, 1)),
            CRIADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ATUALIZADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS CRM_USUARIO_PERMISSOES (
            ID_USUARIO INTEGER NOT NULL,
            CODIGO_FUNCIONALIDADE TEXT NOT NULL,
            PERMITIDO INTEGER NOT NULL DEFAULT 0 CHECK (PERMITIDO IN (0, 1)),
            ATUALIZADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (ID_USUARIO, CODIGO_FUNCIONALIDADE),
            FOREIGN KEY (ID_USUARIO) REFERENCES CRM_USUARIOS (ID_USUARIO),
            FOREIGN KEY (CODIGO_FUNCIONALIDADE) REFERENCES CRM_FUNCIONALIDADES (CODIGO)
        );

        CREATE TABLE IF NOT EXISTS CRM_ACESSOS (
            ID_SESSAO TEXT PRIMARY KEY,
            ID_USUARIO INTEGER,
            NOME_USUARIO TEXT NOT NULL DEFAULT '',
            IP TEXT NOT NULL DEFAULT '',
            USER_AGENT TEXT NOT NULL DEFAULT '',
            CRIADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ULTIMO_ACESSO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ID_USUARIO) REFERENCES CRM_USUARIOS (ID_USUARIO)
        );

        CREATE TABLE IF NOT EXISTS CRM_AUTH_SESSOES (
            TOKEN_HASH TEXT PRIMARY KEY,
            ID_USUARIO INTEGER NOT NULL,
            ID_SESSAO_NAVEGADOR TEXT NOT NULL DEFAULT '',
            IP TEXT NOT NULL DEFAULT '',
            USER_AGENT TEXT NOT NULL DEFAULT '',
            CRIADO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ULTIMO_ACESSO_EM TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            EXPIRA_EM TEXT NOT NULL,
            REVOGADO_EM TEXT,
            FOREIGN KEY (ID_USUARIO) REFERENCES CRM_USUARIOS (ID_USUARIO)
        );

        CREATE INDEX IF NOT EXISTS IDX_CRM_USUARIOS_STATUS
            ON CRM_USUARIOS (STATUS, NOME);

        CREATE INDEX IF NOT EXISTS IDX_CRM_ACESSOS_RECENTES
            ON CRM_ACESSOS (ULTIMO_ACESSO_EM);

        CREATE INDEX IF NOT EXISTS IDX_CRM_AUTH_SESSOES_USUARIO
            ON CRM_AUTH_SESSOES (ID_USUARIO, EXPIRA_EM);
    `);

    const userColumns = getTableColumns(prospeccoesDb, 'CRM_USUARIOS');
    const userMigrations = [
        ['SENHA_HASH', 'ALTER TABLE CRM_USUARIOS ADD COLUMN SENHA_HASH TEXT NOT NULL DEFAULT ""'],
        ['PRECISA_TROCAR_SENHA', 'ALTER TABLE CRM_USUARIOS ADD COLUMN PRECISA_TROCAR_SENHA INTEGER NOT NULL DEFAULT 1 CHECK (PRECISA_TROCAR_SENHA IN (0, 1))']
    ];

    for (const [column, sql] of userMigrations) {
        if (!userColumns.has(column)) {
            prospeccoesDb.exec(sql);
        }
    }

    const upsertFuncionalidade = prospeccoesDb.prepare(`
        INSERT INTO CRM_FUNCIONALIDADES (
            CODIGO,
            NOME,
            CATEGORIA,
            DESCRICAO
        )
        VALUES (@codigo, @nome, @categoria, @descricao)
        ON CONFLICT(CODIGO) DO UPDATE SET
            NOME = excluded.NOME,
            CATEGORIA = excluded.CATEGORIA,
            DESCRICAO = excluded.DESCRICAO,
            ATUALIZADO_EM = CURRENT_TIMESTAMP
    `);

    for (const funcionalidade of funcionalidadesCatalogo) {
        upsertFuncionalidade.run(funcionalidade);
    }

    const totalUsuarios = prospeccoesDb.prepare('SELECT COUNT(*) AS total FROM CRM_USUARIOS').get().total;

    if (totalUsuarios === 0) {
        const result = prospeccoesDb.prepare(`
            INSERT INTO CRM_USUARIOS (
                NOME,
                EMAIL,
                CARGO,
                DEPARTAMENTO,
                PERFIL,
                STATUS,
                SENHA_TEMPORARIA,
                SENHA_HASH,
                PRECISA_TROCAR_SENHA,
                OBSERVACOES
            )
            VALUES (
                'Administrador',
                'admin@leadbenefits.local',
                'Administrador do CRM',
                'Gestao',
                'ADMIN',
                'ATIVO',
                'Alterar@123',
                @senhaHash,
                1,
                'Usuario inicial criado automaticamente.'
            )
        `).run({ senhaHash: createPasswordHash('Alterar@123') });

        salvarPermissoesUsuario(result.lastInsertRowid, funcionalidadesCatalogo.map((item) => item.codigo));
    }

    const usuariosSemHash = prospeccoesDb.prepare(`
        SELECT ID_USUARIO, SENHA_TEMPORARIA
        FROM CRM_USUARIOS
        WHERE COALESCE(SENHA_HASH, '') = ''
    `).all();

    const updatePasswordHash = prospeccoesDb.prepare(`
        UPDATE CRM_USUARIOS
        SET
            SENHA_HASH = @senhaHash,
            PRECISA_TROCAR_SENHA = 1,
            ATUALIZADO_EM = CURRENT_TIMESTAMP
        WHERE ID_USUARIO = @idUsuario
    `);

    for (const usuario of usuariosSemHash) {
        const senhaInicial = usuario.SENHA_TEMPORARIA || 'Alterar@123';
        updatePasswordHash.run({
            idUsuario: usuario.ID_USUARIO,
            senhaHash: createPasswordHash(senhaInicial)
        });
    }
}

function salvarPermissoesUsuario(idUsuario, codigosPermitidos) {
    const permitidos = new Set(
        (Array.isArray(codigosPermitidos) ? codigosPermitidos : [])
            .map((codigo) => String(codigo || '').trim())
            .filter(Boolean)
    );

    const transaction = prospeccoesDb.transaction(() => {
        prospeccoesDb.prepare('DELETE FROM CRM_USUARIO_PERMISSOES WHERE ID_USUARIO = ?').run(idUsuario);

        const insert = prospeccoesDb.prepare(`
            INSERT INTO CRM_USUARIO_PERMISSOES (
                ID_USUARIO,
                CODIGO_FUNCIONALIDADE,
                PERMITIDO
            )
            VALUES (?, ?, ?)
        `);

        for (const funcionalidade of funcionalidadesCatalogo) {
            insert.run(idUsuario, funcionalidade.codigo, permitidos.has(funcionalidade.codigo) ? 1 : 0);
        }
    });

    transaction();
}

ensureAdminSchema();

db.prepare('ATTACH DATABASE ? AS crm').run(prospeccoesPath);

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const dataTableOrderColumns = {
    4: 'est.UF',
    8: 'est.DATA_INICIO_ATIVIDADE'
};

function json(res, status, body, extraHeaders = {}) {
    const data = JSON.stringify(body);

    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data),
        ...extraHeaders
    });

    res.end(data);
}

const authCookieName = 'lb_crm_session';
const authSessionDurationMs = 8 * 60 * 60 * 1000;

function parseCookies(req) {
    return String(req.headers.cookie || '')
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean)
        .reduce((cookies, item) => {
            const separatorIndex = item.indexOf('=');

            if (separatorIndex > -1) {
                cookies[item.slice(0, separatorIndex)] = decodeURIComponent(item.slice(separatorIndex + 1));
            }

            return cookies;
        }, {});
}

function buildAuthCookie(token, maxAgeSeconds) {
    const secure = process.env.CRM_SECURE_COOKIE === '1' ? '; Secure' : '';

    return `${authCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

function getAuthToken(req) {
    return parseCookies(req)[authCookieName] || '';
}

function publicUser(usuario) {
    if (!usuario) {
        return null;
    }

    const permissoes = Array.isArray(usuario.permissoes) ? usuario.permissoes : getUsuarioPermissoes(usuario.idUsuario);

    return {
        idUsuario: usuario.idUsuario,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        departamento: usuario.departamento,
        perfil: usuario.perfil,
        status: usuario.status,
        precisaTrocarSenha: Number(usuario.precisaTrocarSenha || 0) === 1,
        ultimoAcessoEm: usuario.ultimoAcessoEm || null,
        permissoes
    };
}

function parseBooleanFlag(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return ['1', 's', 'sim', 'true', 'yes'].includes(String(value).toLowerCase());
}

function checkboxValue(value) {
    return ['1', 's', 'sim', 'true', 'yes', 'on'].includes(String(value).toLowerCase()) ? '1' : '0';
}

function buildPhoneTypeCondition(prefix, type) {
    const phone1 = `COALESCE(${prefix}.TELEFONE_1, '')`;
    const phone2 = `COALESCE(${prefix}.TELEFONE_2, '')`;
    const mobileCondition = `(
        (LENGTH(${phone1}) >= 9 AND ${phone1} LIKE '9%')
        OR (LENGTH(${phone2}) >= 9 AND ${phone2} LIKE '9%')
    )`;
    const fixedCondition = `(
        (LENGTH(${phone1}) >= 8 AND ${phone1} NOT LIKE '9%')
        OR (LENGTH(${phone2}) >= 8 AND ${phone2} NOT LIKE '9%')
    )`;

    if (type === 'celular') {
        return mobileCondition;
    }

    if (type === 'fixo') {
        return fixedCondition;
    }

    return '';
}

function buildViewPhoneTypeCondition(type) {
    const phone1 = "COALESCE(TELEFONE_1, '')";
    const phone2 = "COALESCE(TELEFONE_2, '')";

    if (type === 'celular') {
        return `(
            (LENGTH(${phone1}) >= 9 AND ${phone1} LIKE '9%')
            OR (LENGTH(${phone2}) >= 9 AND ${phone2} LIKE '9%')
        )`;
    }

    if (type === 'fixo') {
        return `(
            (LENGTH(${phone1}) >= 8 AND ${phone1} NOT LIKE '9%')
            OR (LENGTH(${phone2}) >= 8 AND ${phone2} NOT LIKE '9%')
        )`;
    }

    return '';
}

function appendFlagFilter(where, flagFilter, cnpjExpression) {
    if (flagFilter === 'marcadas') {
        where.push(`EXISTS (
            SELECT 1
            FROM crm.EMPRESAS_FLAGS flags_filter
            WHERE flags_filter.CNPJ = ${cnpjExpression}
              AND flags_filter.FLAG_ATIVA = 1
        )`);
        return;
    }

    if (flagFilter === 'nao_marcadas') {
        where.push(`NOT EXISTS (
            SELECT 1
            FROM crm.EMPRESAS_FLAGS flags_filter
            WHERE flags_filter.CNPJ = ${cnpjExpression}
              AND flags_filter.FLAG_ATIVA = 1
        )`);
    }
}

function getFlagFilter(params) {
    const value = String(params.get('flag') || '').trim();
    return ['marcadas', 'nao_marcadas'].includes(value) ? value : '';
}

function clampLimit(value) {
    const number = Number(value || 50);

    if (!Number.isFinite(number)) {
        return 50;
    }

    return Math.max(1, Math.min(200, Math.trunc(number)));
}

function clampOffset(value) {
    const number = Number(value || 0);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.max(0, Math.trunc(number));
}

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
}

function resolveMunicipioCode(rawMunicipio, uf) {
    const value = String(rawMunicipio || '').trim();

    if (!value) {
        return null;
    }

    if (/^\d+$/.test(value)) {
        return value;
    }

    const normalizedValue = normalizeText(value);
    const row = db.prepare(`
        SELECT CODIGO
        FROM MUNICIPIOS
        WHERE (
            UPPER(TRIM(DESCRICAO)) = UPPER(TRIM(@value))
            OR UPPER(TRIM(DESCRICAO)) = UPPER(TRIM(@normalized))
            OR REPLACE(REPLACE(REPLACE(REPLACE(UPPER(TRIM(DESCRICAO)), 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ç', 'C') LIKE @like
        )
        ORDER BY
            CASE
                WHEN UPPER(TRIM(DESCRICAO)) = UPPER(TRIM(@value)) THEN 0
                WHEN UPPER(TRIM(DESCRICAO)) = UPPER(TRIM(@normalized)) THEN 1
                ELSE 2
            END,
            LENGTH(DESCRICAO),
            DESCRICAO
        LIMIT 1
    `).get({
        value: value.toUpperCase(),
        normalized: normalizedValue,
        like: `%${normalizedValue}%`
    });

    return row ? String(row.CODIGO) : null;
}

function resolveCnaeCode(rawCnae) {
    const value = String(rawCnae || '').trim();

    if (!value) {
        return null;
    }

    const normalizedValue = normalizeText(value);
    const codeValue = value.replace(/\D/g, '');
    const row = db.prepare(`
        SELECT CODIGO
        FROM CNAES
        WHERE (
            CAST(CODIGO AS TEXT) = @value
            OR CAST(CODIGO AS TEXT) LIKE @codeLike
            OR UPPER(TRIM(DESCRICAO)) = UPPER(TRIM(@value))
            OR UPPER(TRIM(DESCRICAO)) LIKE @descLike
            OR REPLACE(REPLACE(REPLACE(REPLACE(UPPER(TRIM(DESCRICAO)), 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ç', 'C') LIKE @like
        )
        ORDER BY CASE WHEN CAST(CODIGO AS TEXT) = @value THEN 0 ELSE 1 END, DESCRICAO
        LIMIT 1
    `).get({
        value,
        codeLike: `%${codeValue}%`,
        descLike: `%${normalizedValue}%`,
        like: `%${normalizedValue}%`
    });

    return row ? String(row.CODIGO) : null;
}

function listMunicipios(uf, searchTerm) {
    const normalizedValue = normalizeText(searchTerm || '');
    const normalizedUf = String(uf || '').trim().toUpperCase();
    const params = {};
    let sql;

    if (normalizedUf) {
        sql = `
            SELECT
                mun.CODIGO,
                mun.DESCRICAO AS NOME
            FROM (
                SELECT DISTINCT MUNICIPIO
                FROM ESTABELECIMENTOS
                WHERE UF = @uf
            ) est
            INNER JOIN MUNICIPIOS mun
                ON mun.CODIGO = est.MUNICIPIO
        `;
        params.uf = normalizedUf;
    } else {
        sql = `
            SELECT
                mun.CODIGO,
                mun.DESCRICAO AS NOME
            FROM MUNICIPIOS mun
        `;
    }

    sql += ' WHERE 1 = 1';

    if (normalizedValue) {
        sql += `
            AND (
                UPPER(TRIM(mun.DESCRICAO)) LIKE @like
                OR REPLACE(REPLACE(REPLACE(REPLACE(UPPER(TRIM(DESCRICAO)), 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ç', 'C') LIKE @like
            )
        `;
        params.like = `%${normalizedValue}%`;
    }

    sql += ' ORDER BY mun.DESCRICAO LIMIT 6000';

    return db.prepare(sql).all(params).map((row) => ({
        codigo: String(row.CODIGO),
        nome: row.NOME
    }));
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;

            if (body.length > 25 * 1024 * 1024) {
                reject(new Error('Payload muito grande.'));
                req.destroy();
            }
        });

        req.on('end', () => {
            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error('JSON invalido.'));
            }
        });

        req.on('error', reject);
    });
}

function toIsoDate(value) {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
}

function normalizeContactDate(value, fallbackDate = new Date()) {
    const rawValue = String(value || '').trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
        return rawValue;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
        const [day, month, year] = rawValue.split('/');
        return `${year}-${month}-${day}`;
    }

    const nextContact = new Date(fallbackDate);
    nextContact.setDate(nextContact.getDate() + 7);

    return toIsoDate(nextContact);
}

function normalizeOptionalDate(value) {
    const rawValue = String(value || '').trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
        return rawValue;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
        const [day, month, year] = rawValue.split('/');
        return `${year}-${month}-${day}`;
    }

    return '';
}

function applyContactMetadataToObservacoes(observacoes, metadata) {
    try {
        const parsed = JSON.parse(observacoes);

        if (parsed?.kind !== 'leadbenefits-contact-history' || !Array.isArray(parsed.history)) {
            return observacoes;
        }

        const latestEntry = parsed.history[parsed.history.length - 1];

        if (latestEntry) {
            latestEntry.contactPerson = metadata.nomeContato || latestEntry.contactPerson || '-';
            latestEntry.contactRole = metadata.cargoContato || latestEntry.contactRole || '-';
            latestEntry.nextContact = metadata.proximoContato || latestEntry.nextContact || '';
            latestEntry.employeeCount = metadata.numeroFuncionarios || latestEntry.employeeCount || '';
            latestEntry.benefits = metadata.beneficios || latestEntry.benefits || '';
            latestEntry.contactPhone = metadata.telefoneContato || latestEntry.contactPhone || '';
            latestEntry.whatsapp = metadata.whatsapp === '1';
            latestEntry.contactEmail = metadata.emailContato || latestEntry.contactEmail || '';
            latestEntry.healthPlan = metadata.temPlanoSaude || latestEntry.healthPlan || '';
            latestEntry.healthPlanAllEmployees = metadata.planoSaudeTodos === '1';
            latestEntry.healthPlanOperator = metadata.operadoraSaude || latestEntry.healthPlanOperator || '';
            latestEntry.healthPlanExpiration = metadata.vencimentoSaude || latestEntry.healthPlanExpiration || '';
            latestEntry.dentalPlan = metadata.temPlanoOdonto || latestEntry.dentalPlan || '';
            latestEntry.dentalPlanOperator = metadata.operadoraOdonto || latestEntry.dentalPlanOperator || '';
            latestEntry.dentalPlanExpiration = metadata.vencimentoOdonto || latestEntry.dentalPlanExpiration || '';
            latestEntry.lifeInsurance = metadata.temSeguroVida || latestEntry.lifeInsurance || '';
            latestEntry.lifeInsuranceOperator = metadata.operadoraSeguroVida || latestEntry.lifeInsuranceOperator || '';
            latestEntry.lifeInsuranceExpiration = metadata.vencimentoSeguroVida || latestEntry.lifeInsuranceExpiration || '';
            latestEntry.reasonCostReduction = metadata.motivoReducaoCustos === '1';
            latestEntry.reasonBetterService = metadata.motivoMelhorarAtendimento === '1';
            latestEntry.reasonExpandedCoverage = metadata.motivoAmpliarCobertura === '1';
            latestEntry.switchInterest = metadata.interesseTroca || latestEntry.switchInterest || '';
        }

        return JSON.stringify(parsed);
    } catch {
        return observacoes;
    }
}

function getProspeccao(cnpj) {
    const row = prospeccoesDb.prepare(`
        SELECT
            CNPJ,
            DADOS_EMPRESA,
            OBSERVACOES,
            NOME_CONTATO,
            CARGO_CONTATO,
            PROXIMO_CONTATO,
            NUMERO_FUNCIONARIOS,
            BENEFICIOS,
            TELEFONE_CONTATO,
            WHATSAPP,
            EMAIL_CONTATO,
            TEM_PLANO_SAUDE,
            PLANO_SAUDE_TODOS,
            OPERADORA_SAUDE,
            VENCIMENTO_SAUDE,
            TEM_PLANO_ODONTO,
            OPERADORA_ODONTO,
            VENCIMENTO_ODONTO,
            TEM_SEGURO_VIDA,
            OPERADORA_SEGURO_VIDA,
            VENCIMENTO_SEGURO_VIDA,
            MOTIVO_REDUCAO_CUSTOS,
            MOTIVO_MELHORAR_ATENDIMENTO,
            MOTIVO_AMPLIAR_COBERTURA,
            INTERESSE_TROCA,
            OUTRAS_NECESSIDADES,
            CRIADO_EM,
            ATUALIZADO_EM
        FROM PROSPECCOES
        WHERE CNPJ = @cnpj
    `).get({ cnpj });

    if (!row) {
        return null;
    }

    const parsedObservacoes = parseJsonObject(row.OBSERVACOES);

    return {
        cnpj: row.CNPJ,
        dadosEmpresa: JSON.parse(row.DADOS_EMPRESA || '{}'),
        observacoes: row.OBSERVACOES || '',
        situacaoContato: parsedObservacoes.situacaoContato || '',
        nomeContato: row.NOME_CONTATO || '',
        cargoContato: row.CARGO_CONTATO || '',
        proximoContato: row.PROXIMO_CONTATO || '',
        numeroFuncionarios: row.NUMERO_FUNCIONARIOS || '',
        beneficios: row.BENEFICIOS || '',
        telefoneContato: row.TELEFONE_CONTATO || '',
        whatsapp: row.WHATSAPP || '0',
        emailContato: row.EMAIL_CONTATO || '',
        temPlanoSaude: row.TEM_PLANO_SAUDE || '',
        planoSaudeTodos: row.PLANO_SAUDE_TODOS || '0',
        operadoraSaude: row.OPERADORA_SAUDE || '',
        vencimentoSaude: row.VENCIMENTO_SAUDE || '',
        temPlanoOdonto: row.TEM_PLANO_ODONTO || '',
        operadoraOdonto: row.OPERADORA_ODONTO || '',
        vencimentoOdonto: row.VENCIMENTO_ODONTO || '',
        temSeguroVida: row.TEM_SEGURO_VIDA || '',
        operadoraSeguroVida: row.OPERADORA_SEGURO_VIDA || '',
        vencimentoSeguroVida: row.VENCIMENTO_SEGURO_VIDA || '',
        motivoReducaoCustos: row.MOTIVO_REDUCAO_CUSTOS || '0',
        motivoMelhorarAtendimento: row.MOTIVO_MELHORAR_ATENDIMENTO || '0',
        motivoAmpliarCobertura: row.MOTIVO_AMPLIAR_COBERTURA || '0',
        interesseTroca: row.INTERESSE_TROCA || '',
        outrasNecessidades: row.OUTRAS_NECESSIDADES || '',
        criadoEm: row.CRIADO_EM,
        atualizadoEm: row.ATUALIZADO_EM
    };
}

function parseJsonObject(value) {
    try {
        const parsed = JSON.parse(value || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function getDashboardDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const mapped = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return {
        year: mapped.year,
        month: mapped.month,
        day: mapped.day
    };
}

function getDashboardDateIso(date = new Date()) {
    const parts = getDashboardDateParts(date);
    return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDaysToIsoDate(value, days) {
    const [year, month, day] = String(value || '').split('-').map(Number);

    if (!year || !month || !day) {
        return '';
    }

    const date = new Date(Date.UTC(year, month - 1, day + days));
    return date.toISOString().slice(0, 10);
}

function getProspeccaoHistory(observacoes) {
    const parsed = parseJsonObject(observacoes);
    return parsed?.kind === 'leadbenefits-contact-history' && Array.isArray(parsed.history)
        ? parsed.history
        : [];
}

function getEntryMonth(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const parts = getDashboardDateParts(date);
    return `${parts.year}-${parts.month}`;
}

function hasHistoryInMonth(row, history, yearMonth) {
    return history.some((entry) => getEntryMonth(entry.at) === yearMonth);
}

function stripHtml(value) {
    return String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeComparableText(value) {
    return stripHtml(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function isLeadInNegotiation(row, history) {
    const parsedObservacoes = parseJsonObject(row.OBSERVACOES);

    if (parsedObservacoes.situacaoContato === 'LEAD_EM_PROPOSTA_NEGOCIACAO') {
        return true;
    }

    if (String(row.BENEFICIOS || '').trim()) {
        return true;
    }

    const text = normalizeComparableText([
        parsedObservacoes.situacaoContato,
        row.OBSERVACOES,
        ...history.map((entry) => [
            entry.benefits,
            entry.contactRole,
            entry.notesHtml
        ].join(' '))
    ].join(' '));

    return /\b(proposta|negociacao|negociando|aprovado|aprovada|lead)\b/.test(text);
}

function formatDashboardPhone(data) {
    const first = `${data.DDD_1 ? `(${data.DDD_1}) ` : ''}${data.TELEFONE_1 || ''}`.trim();
    const second = `${data.DDD_2 ? `(${data.DDD_2}) ` : ''}${data.TELEFONE_2 || ''}`.trim();
    return [first, second].filter(Boolean).join(' / ');
}

function buildDashboardContact(row, history) {
    const storedData = parseJsonObject(row.DADOS_EMPRESA);
    const databaseData = db.prepare(`
        SELECT *
        FROM CRM_EMPRESAS_PESQUISA
        WHERE CNPJ = @cnpj
        LIMIT 1
    `).get({ cnpj: row.CNPJ }) || {};
    const data = {
        ...storedData,
        ...databaseData,
        CNPJ: databaseData.CNPJ || storedData.CNPJ || row.CNPJ
    };
    const latestEntry = history[history.length - 1] || {};

    return {
        cnpj: row.CNPJ,
        dadosEmpresa: data,
        razaoSocial: data.RAZAO_SOCIAL || '',
        nomeFantasia: data.NOME_FANTASIA || '',
        municipio: data.MUNICIPIO_DESCRICAO || '',
        uf: data.UF || '',
        telefone: formatDashboardPhone(data),
        contato: row.NOME_CONTATO || latestEntry.contactPerson || '',
        cargo: row.CARGO_CONTATO || latestEntry.contactRole || '',
        proximoContato: row.PROXIMO_CONTATO || '',
        beneficios: row.BENEFICIOS || latestEntry.benefits || '',
        atualizadoEm: row.ATUALIZADO_EM
    };
}

function dashboardHandler(req, res, url) {
    if (req.method !== 'GET') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    const todayIso = getDashboardDateIso();
    const tomorrowIso = addDaysToIsoDate(todayIso, 1);
    const currentMonth = todayIso.slice(0, 7);
    const totalCadastros = db.prepare('SELECT COUNT(*) AS total FROM ESTABELECIMENTOS').get().total;
    const rows = prospeccoesDb.prepare(`
        SELECT
            CNPJ,
            DADOS_EMPRESA,
            OBSERVACOES,
            NOME_CONTATO,
            CARGO_CONTATO,
            PROXIMO_CONTATO,
            NUMERO_FUNCIONARIOS,
            BENEFICIOS,
            CRIADO_EM,
            ATUALIZADO_EM
        FROM PROSPECCOES
        ORDER BY PROXIMO_CONTATO ASC, ATUALIZADO_EM DESC
    `).all();

    const contactLimit = url?.searchParams.get('agenda') === 'full' ? Number.MAX_SAFE_INTEGER : 20;
    const agenda = {
        atrasados: [],
        hoje: [],
        amanha: []
    };
    let trabalhadosMes = 0;
    let leadsNegociacao = 0;

    for (const row of rows) {
        const history = getProspeccaoHistory(row.OBSERVACOES);

        if (hasHistoryInMonth(row, history, currentMonth)) {
            trabalhadosMes += 1;
        }

        if (isLeadInNegotiation(row, history)) {
            leadsNegociacao += 1;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.PROXIMO_CONTATO || ''))) {
            continue;
        }

        const contact = buildDashboardContact(row, history);

        if (row.PROXIMO_CONTATO < todayIso) {
            agenda.atrasados.push(contact);
        } else if (row.PROXIMO_CONTATO === todayIso) {
            agenda.hoje.push(contact);
        } else if (row.PROXIMO_CONTATO === tomorrowIso) {
            agenda.amanha.push(contact);
        }
    }

    json(res, 200, {
        geradoEm: new Date().toISOString(),
        periodo: {
            hoje: todayIso,
            amanha: tomorrowIso,
            mesAtual: currentMonth
        },
        metricas: {
            totalCadastros,
            trabalhadosMes,
            leadsNegociacao,
            prospeccoes: rows.length
        },
        agenda: {
            atrasados: {
                total: agenda.atrasados.length,
                itens: agenda.atrasados.slice(0, contactLimit)
            },
            hoje: {
                total: agenda.hoje.length,
                itens: agenda.hoje.slice(0, contactLimit)
            },
            amanha: {
                total: agenda.amanha.length,
                itens: agenda.amanha.slice(0, contactLimit)
            }
        }
    });
}

async function prospeccaoHandler(req, res, url) {
    const cnpj = String(url.searchParams.get('cnpj') || '').replace(/\D/g, '');

    if (cnpj.length !== 14) {
        json(res, 400, { error: 'CNPJ invalido.' });
        return;
    }

    if (req.method === 'GET') {
        json(res, 200, { prospeccao: getProspeccao(cnpj) });
        return;
    }

    if (req.method !== 'POST') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    const body = await readJsonBody(req);
    let observacoes = String(body.observacoes || '').trim();
    const dadosEmpresa = JSON.stringify(body.dadosEmpresa || {});
    const nomeContato = String(body.nomeContato || '').trim();
    const cargoContato = String(body.cargoContato || '').trim();
    const proximoContato = normalizeContactDate(body.proximoContato);
    const numeroFuncionarios = String(body.numeroFuncionarios || '').trim();
    const beneficios = String(body.beneficios || '').trim();
    const telefoneContato = String(body.telefoneContato || '').trim();
    const whatsapp = checkboxValue(body.whatsapp);
    const emailContato = String(body.emailContato || '').trim();
    const temPlanoSaude = String(body.temPlanoSaude || '').trim();
    const planoSaudeTodos = checkboxValue(body.planoSaudeTodos);
    const operadoraSaude = String(body.operadoraSaude || '').trim();
    const vencimentoSaude = normalizeOptionalDate(body.vencimentoSaude);
    const temPlanoOdonto = String(body.temPlanoOdonto || '').trim();
    const operadoraOdonto = String(body.operadoraOdonto || '').trim();
    const vencimentoOdonto = normalizeOptionalDate(body.vencimentoOdonto);
    const temSeguroVida = String(body.temSeguroVida || '').trim();
    const operadoraSeguroVida = String(body.operadoraSeguroVida || '').trim();
    const vencimentoSeguroVida = normalizeOptionalDate(body.vencimentoSeguroVida);
    const motivoReducaoCustos = checkboxValue(body.motivoReducaoCustos);
    const motivoMelhorarAtendimento = checkboxValue(body.motivoMelhorarAtendimento);
    const motivoAmpliarCobertura = checkboxValue(body.motivoAmpliarCobertura);
    const interesseTroca = String(body.interesseTroca || '').trim();
    const outrasNecessidades = String(body.outrasNecessidades || beneficios).trim();

    observacoes = applyContactMetadataToObservacoes(observacoes, {
        nomeContato,
        cargoContato,
        proximoContato,
        numeroFuncionarios,
        beneficios,
        telefoneContato,
        whatsapp,
        emailContato,
        temPlanoSaude,
        planoSaudeTodos,
        operadoraSaude,
        vencimentoSaude,
        temPlanoOdonto,
        operadoraOdonto,
        vencimentoOdonto,
        temSeguroVida,
        operadoraSeguroVida,
        vencimentoSeguroVida,
        motivoReducaoCustos,
        motivoMelhorarAtendimento,
        motivoAmpliarCobertura,
        interesseTroca,
        outrasNecessidades
    });

    prospeccoesDb.prepare(`
        INSERT INTO PROSPECCOES (
            CNPJ,
            DADOS_EMPRESA,
            OBSERVACOES,
            NOME_CONTATO,
            CARGO_CONTATO,
            PROXIMO_CONTATO,
            NUMERO_FUNCIONARIOS,
            BENEFICIOS,
            TELEFONE_CONTATO,
            WHATSAPP,
            EMAIL_CONTATO,
            TEM_PLANO_SAUDE,
            PLANO_SAUDE_TODOS,
            OPERADORA_SAUDE,
            VENCIMENTO_SAUDE,
            TEM_PLANO_ODONTO,
            OPERADORA_ODONTO,
            VENCIMENTO_ODONTO,
            TEM_SEGURO_VIDA,
            OPERADORA_SEGURO_VIDA,
            VENCIMENTO_SEGURO_VIDA,
            MOTIVO_REDUCAO_CUSTOS,
            MOTIVO_MELHORAR_ATENDIMENTO,
            MOTIVO_AMPLIAR_COBERTURA,
            INTERESSE_TROCA,
            OUTRAS_NECESSIDADES
        )
        VALUES (
            @cnpj,
            @dadosEmpresa,
            @observacoes,
            @nomeContato,
            @cargoContato,
            @proximoContato,
            @numeroFuncionarios,
            @beneficios,
            @telefoneContato,
            @whatsapp,
            @emailContato,
            @temPlanoSaude,
            @planoSaudeTodos,
            @operadoraSaude,
            @vencimentoSaude,
            @temPlanoOdonto,
            @operadoraOdonto,
            @vencimentoOdonto,
            @temSeguroVida,
            @operadoraSeguroVida,
            @vencimentoSeguroVida,
            @motivoReducaoCustos,
            @motivoMelhorarAtendimento,
            @motivoAmpliarCobertura,
            @interesseTroca,
            @outrasNecessidades
        )
        ON CONFLICT(CNPJ) DO UPDATE SET
            DADOS_EMPRESA = excluded.DADOS_EMPRESA,
            OBSERVACOES = excluded.OBSERVACOES,
            NOME_CONTATO = excluded.NOME_CONTATO,
            CARGO_CONTATO = excluded.CARGO_CONTATO,
            PROXIMO_CONTATO = excluded.PROXIMO_CONTATO,
            NUMERO_FUNCIONARIOS = excluded.NUMERO_FUNCIONARIOS,
            BENEFICIOS = excluded.BENEFICIOS,
            TELEFONE_CONTATO = excluded.TELEFONE_CONTATO,
            WHATSAPP = excluded.WHATSAPP,
            EMAIL_CONTATO = excluded.EMAIL_CONTATO,
            TEM_PLANO_SAUDE = excluded.TEM_PLANO_SAUDE,
            PLANO_SAUDE_TODOS = excluded.PLANO_SAUDE_TODOS,
            OPERADORA_SAUDE = excluded.OPERADORA_SAUDE,
            VENCIMENTO_SAUDE = excluded.VENCIMENTO_SAUDE,
            TEM_PLANO_ODONTO = excluded.TEM_PLANO_ODONTO,
            OPERADORA_ODONTO = excluded.OPERADORA_ODONTO,
            VENCIMENTO_ODONTO = excluded.VENCIMENTO_ODONTO,
            TEM_SEGURO_VIDA = excluded.TEM_SEGURO_VIDA,
            OPERADORA_SEGURO_VIDA = excluded.OPERADORA_SEGURO_VIDA,
            VENCIMENTO_SEGURO_VIDA = excluded.VENCIMENTO_SEGURO_VIDA,
            MOTIVO_REDUCAO_CUSTOS = excluded.MOTIVO_REDUCAO_CUSTOS,
            MOTIVO_MELHORAR_ATENDIMENTO = excluded.MOTIVO_MELHORAR_ATENDIMENTO,
            MOTIVO_AMPLIAR_COBERTURA = excluded.MOTIVO_AMPLIAR_COBERTURA,
            INTERESSE_TROCA = excluded.INTERESSE_TROCA,
            OUTRAS_NECESSIDADES = excluded.OUTRAS_NECESSIDADES,
            ATUALIZADO_EM = CURRENT_TIMESTAMP
    `).run({
        cnpj,
        dadosEmpresa,
        observacoes,
        nomeContato,
        cargoContato,
        proximoContato,
        numeroFuncionarios,
        beneficios,
        telefoneContato,
        whatsapp,
        emailContato,
        temPlanoSaude,
        planoSaudeTodos,
        operadoraSaude,
        vencimentoSaude,
        temPlanoOdonto,
        operadoraOdonto,
        vencimentoOdonto,
        temSeguroVida,
        operadoraSeguroVida,
        vencimentoSeguroVida,
        motivoReducaoCustos,
        motivoMelhorarAtendimento,
        motivoAmpliarCobertura,
        interesseTroca,
        outrasNecessidades
    });

    json(res, 200, { ok: true, prospeccao: getProspeccao(cnpj) });
}

async function empresaFlagHandler(req, res) {
    if (req.method !== 'POST') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    const body = await readJsonBody(req);
    const cnpj = String(body.cnpj || '').replace(/\D/g, '');
    const ativa = Boolean(body.ativa);

    if (cnpj.length !== 14) {
        json(res, 400, { error: 'CNPJ invalido.' });
        return;
    }

    prospeccoesDb.prepare(`
        INSERT INTO EMPRESAS_FLAGS (CNPJ, FLAG_ATIVA)
        VALUES (@cnpj, @flagAtiva)
        ON CONFLICT(CNPJ) DO UPDATE SET
            FLAG_ATIVA = excluded.FLAG_ATIVA,
            ATUALIZADO_EM = CURRENT_TIMESTAMP
    `).run({
        cnpj,
        flagAtiva: ativa ? 1 : 0
    });

    json(res, 200, {
        ok: true,
        cnpj,
        flagAtiva: ativa
    });
}

function normalizeProspectionJson(rawObservacoes) {
    const content = String(rawObservacoes || '').trim();
    const parsed = parseJsonObject(content);

    if (parsed?.kind === 'leadbenefits-contact-history') {
        return {
            kind: 'leadbenefits-contact-history',
            draftHtml: parsed.draftHtml || '',
            history: Array.isArray(parsed.history) ? parsed.history : [],
            situacaoContato: parsed.situacaoContato || ''
        };
    }

    return {
        kind: 'leadbenefits-contact-history',
        draftHtml: content,
        history: [],
        situacaoContato: ''
    };
}

async function prospeccaoSituacaoHandler(req, res) {
    if (req.method !== 'POST') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    const body = await readJsonBody(req);
    const cnpj = String(body.cnpj || '').replace(/\D/g, '');
    const situacaoContato = String(body.situacaoContato || '').trim();
    const allowedSituations = new Set(['', 'LEAD_EM_PROPOSTA_NEGOCIACAO']);

    if (cnpj.length !== 14) {
        json(res, 400, { error: 'CNPJ invalido.' });
        return;
    }

    if (!allowedSituations.has(situacaoContato)) {
        json(res, 400, { error: 'Situacao do contato invalida.' });
        return;
    }

    const row = prospeccoesDb.prepare(`
        SELECT DADOS_EMPRESA, OBSERVACOES
        FROM PROSPECCOES
        WHERE CNPJ = ?
    `).get(cnpj);
    const parsed = normalizeProspectionJson(row?.OBSERVACOES);
    parsed.situacaoContato = situacaoContato;

    if (row) {
        prospeccoesDb.prepare(`
            UPDATE PROSPECCOES
            SET
                OBSERVACOES = ?,
                ATUALIZADO_EM = CURRENT_TIMESTAMP
            WHERE CNPJ = ?
        `).run(JSON.stringify(parsed), cnpj);
    } else {
        prospeccoesDb.prepare(`
            INSERT INTO PROSPECCOES (
                CNPJ,
                DADOS_EMPRESA,
                OBSERVACOES
            )
            VALUES (?, ?, ?)
        `).run(cnpj, JSON.stringify(body.dadosEmpresa || {}), JSON.stringify(parsed));
    }

    json(res, 200, {
        ok: true,
        prospeccao: getProspeccao(cnpj)
    });
}

const importacaoColumns = [
    'CNPJ',
    'RAZAO_SOCIAL',
    'NOME_FANTASIA',
    'TELEFONE',
    'TELEFONE2',
    'EMAIL',
    'LOGRADOURO',
    'NUMERO',
    'COMPLEMENTO',
    'BAIRRO',
    'CEP',
    'MUNICIPIO',
    'UF',
    'NOME_CONTATO',
    'CARGO_CONTATO',
    'OBSERVACOES'
];

const importacaoFieldLimits = {
    CNPJ: 14,
    RAZAO_SOCIAL: 200,
    NOME_FANTASIA: 200,
    TELEFONE: 15,
    TELEFONE2: 15,
    EMAIL: 200,
    LOGRADOURO: 200,
    NUMERO: 20,
    COMPLEMENTO: 100,
    BAIRRO: 100,
    CEP: 8,
    MUNICIPIO: 100,
    UF: 2,
    NOME_CONTATO: 150,
    CARGO_CONTATO: 100,
    OBSERVACOES: 2000
};

const importacaoHeaderAliases = new Map([
    ['CPF/CNPJ', 'CNPJ'],
    ['CPF CNPJ', 'CNPJ'],
    ['CPF_CNPJ', 'CNPJ'],
    ['CNPJ', 'CNPJ'],
    ['RAZAO SOCIAL', 'RAZAO_SOCIAL'],
    ['RAZAO_SOCIAL', 'RAZAO_SOCIAL'],
    ['EMPRESA', 'RAZAO_SOCIAL'],
    ['NOME EMPRESA', 'RAZAO_SOCIAL'],
    ['NOME_FANTASIA', 'NOME_FANTASIA'],
    ['NOME FANTASIA', 'NOME_FANTASIA'],
    ['FANTASIA', 'NOME_FANTASIA'],
    ['TELEFONE', 'TELEFONE'],
    ['FONE', 'TELEFONE'],
    ['TELEFONE 1', 'TELEFONE'],
    ['TELEFONE1', 'TELEFONE'],
    ['TELEFONE_1', 'TELEFONE'],
    ['TELEFONE 2', 'TELEFONE2'],
    ['TELEFONE2', 'TELEFONE2'],
    ['TELEFONE_2', 'TELEFONE2'],
    ['EMAIL', 'EMAIL'],
    ['E-MAIL', 'EMAIL'],
    ['E MAIL', 'EMAIL'],
    ['LOGRADOURO', 'LOGRADOURO'],
    ['ENDERECO', 'LOGRADOURO'],
    ['ENDEREÇO', 'LOGRADOURO'],
    ['RUA', 'LOGRADOURO'],
    ['NUMERO', 'NUMERO'],
    ['NÚMERO', 'NUMERO'],
    ['Nº', 'NUMERO'],
    ['NO', 'NUMERO'],
    ['COMPLEMENTO', 'COMPLEMENTO'],
    ['BAIRRO', 'BAIRRO'],
    ['CEP', 'CEP'],
    ['MUNICIPIO', 'MUNICIPIO'],
    ['MUNICÍPIO', 'MUNICIPIO'],
    ['CIDADE', 'MUNICIPIO'],
    ['UF', 'UF'],
    ['ESTADO', 'UF'],
    ['NOME_CONTATO', 'NOME_CONTATO'],
    ['NOME CONTATO', 'NOME_CONTATO'],
    ['CONTATO', 'NOME_CONTATO'],
    ['CARGO_CONTATO', 'CARGO_CONTATO'],
    ['CARGO CONTATO', 'CARGO_CONTATO'],
    ['CARGO', 'CARGO_CONTATO'],
    ['OBSERVACOES', 'OBSERVACOES'],
    ['OBSERVAÇÕES', 'OBSERVACOES'],
    ['OBSERVACAO', 'OBSERVACOES'],
    ['OBSERVAÇÃO', 'OBSERVACOES'],
    ['OBS', 'OBSERVACOES']
]);

function onlyDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

function normalizeImportHeader(value) {
    return normalizeText(value)
        .replace(/[./\\-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeImportedText(value, field) {
    const limit = importacaoFieldLimits[field] || 500;
    const text = String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim();

    return text.slice(0, limit);
}

function normalizeImportedPhone(value) {
    return onlyDigits(value).slice(0, importacaoFieldLimits.TELEFONE);
}

function normalizeImportedCep(value) {
    return onlyDigits(value).slice(0, importacaoFieldLimits.CEP);
}

function isValidCnpj(cnpj) {
    const digits = onlyDigits(cnpj);

    if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
        return false;
    }

    const weightsFirst = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weightsSecond = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const calculateDigit = (base, weights) => {
        const sum = weights.reduce((total, weight, index) => total + Number(base[index]) * weight, 0);
        const rest = sum % 11;
        return rest < 2 ? 0 : 11 - rest;
    };

    const firstDigit = calculateDigit(digits, weightsFirst);
    const secondDigit = calculateDigit(digits.slice(0, 12) + firstDigit, weightsSecond);

    return digits.endsWith(`${firstDigit}${secondDigit}`);
}

function normalizeImportedCompany(raw, options = {}) {
    const normalized = {};

    for (const field of importacaoColumns) {
        normalized[field] = normalizeImportedText(raw[field], field);
    }

    normalized.CNPJ = onlyDigits(raw.CNPJ).slice(0, 14);
    normalized.CNPJ_PENDENTE = isValidCnpj(normalized.CNPJ) ? 'N' : 'S';
    normalized.TELEFONE = normalizeImportedPhone(raw.TELEFONE);
    normalized.TELEFONE2 = normalizeImportedPhone(raw.TELEFONE2);
    normalized.CEP = normalizeImportedCep(raw.CEP);
    normalized.EMAIL = normalizeImportedText(raw.EMAIL, 'EMAIL').toLowerCase();
    normalized.UF = normalizeImportedText(raw.UF, 'UF').toUpperCase();
    normalized.RAZAO_SOCIAL = normalizeImportedText(raw.RAZAO_SOCIAL, 'RAZAO_SOCIAL').toUpperCase();
    normalized.NOME_FANTASIA = normalizeImportedText(raw.NOME_FANTASIA, 'NOME_FANTASIA').toUpperCase();
    normalized.MUNICIPIO = normalizeImportedText(raw.MUNICIPIO, 'MUNICIPIO').toUpperCase();
    normalized.ORIGEM = options.origem || 'IMPORTACAO';
    normalized.ID_IMPORTACAO = options.idImportacao || null;
    normalized.NOME_ARQUIVO_ORIGEM = options.nomeArquivo || '';
    normalized.DATA_IMPORTACAO = options.dataImportacao || null;

    return normalized;
}

function normalizeImportRows(rows) {
    return rows.map((row) => {
        const normalized = {};

        for (const [header, value] of Object.entries(row)) {
            const canonical = importacaoHeaderAliases.get(normalizeImportHeader(header));

            if (canonical && !normalized[canonical]) {
                normalized[canonical] = value;
            }
        }

        return normalized;
    });
}

function parseCsvRows(buffer) {
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const next = text[index + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                field += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (!inQuotes && (char === ',' || char === ';' || char === '\t')) {
            row.push(field);
            field = '';
            continue;
        }

        if (!inQuotes && (char === '\n' || char === '\r')) {
            if (char === '\r' && next === '\n') {
                index += 1;
            }
            row.push(field);
            field = '';
            if (row.some((item) => String(item).trim() !== '')) {
                rows.push(row);
            }
            row = [];
            continue;
        }

        field += char;
    }

    row.push(field);
    if (row.some((item) => String(item).trim() !== '')) {
        rows.push(row);
    }

    if (!rows.length) {
        return [];
    }

    const headers = rows[0].map((header) => String(header || '').trim());

    return rows.slice(1).map((values) => {
        const record = {};

        headers.forEach((header, index) => {
            record[header] = values[index] ?? '';
        });

        return record;
    });
}

function parseImportFile(fileName, contentBase64) {
    const extension = path.extname(fileName || '').toLowerCase();
    const buffer = Buffer.from(String(contentBase64 || ''), 'base64');

    if (!buffer.length) {
        throw new Error('Arquivo vazio ou invalido.');
    }

    if (extension === '.csv') {
        return parseCsvRows(buffer);
    }

    if (extension === '.xlsx') {
        if (!XLSX) {
            throw new Error('Biblioteca XLSX nao encontrada no servidor.');
        }

        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
            return [];
        }

        return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            defval: '',
            raw: false
        });
    }

    throw new Error('Formato nao permitido. Use XLSX ou CSV.');
}

function mergeImportedValues(existing, incoming) {
    const merged = {};
    let changed = false;

    for (const field of importacaoColumns) {
        const currentValue = String(existing[field] ?? '').trim();
        const nextValue = String(incoming[field] ?? '').trim();
        merged[field] = currentValue || nextValue;

        if (!currentValue && nextValue) {
            changed = true;
        }
    }

    merged.CNPJ = existing.CNPJ || incoming.CNPJ || '';
    merged.CNPJ_PENDENTE = incoming.CNPJ_PENDENTE || existing.CNPJ_PENDENTE || 'S';
    merged.ID_IMPORTACAO = incoming.ID_IMPORTACAO || existing.ID_IMPORTACAO || null;
    merged.ORIGEM = existing.ORIGEM || incoming.ORIGEM;
    merged.NOME_ARQUIVO_ORIGEM = existing.NOME_ARQUIVO_ORIGEM || incoming.NOME_ARQUIVO_ORIGEM || '';
    merged.DATA_IMPORTACAO = existing.DATA_IMPORTACAO || incoming.DATA_IMPORTACAO || null;

    return { merged, changed };
}

function insertImportedCompany(company) {
    const result = importacaoDb.prepare(`
        INSERT INTO Empresas_Importadas (
            ID_IMPORTACAO,
            CNPJ,
            RAZAO_SOCIAL,
            NOME_FANTASIA,
            TELEFONE,
            TELEFONE2,
            EMAIL,
            LOGRADOURO,
            NUMERO,
            COMPLEMENTO,
            BAIRRO,
            CEP,
            MUNICIPIO,
            UF,
            NOME_CONTATO,
            CARGO_CONTATO,
            OBSERVACOES,
            ORIGEM,
            NOME_ARQUIVO_ORIGEM,
            DATA_IMPORTACAO,
            CNPJ_PENDENTE
        )
        VALUES (
            @ID_IMPORTACAO,
            @CNPJ,
            @RAZAO_SOCIAL,
            @NOME_FANTASIA,
            @TELEFONE,
            @TELEFONE2,
            @EMAIL,
            @LOGRADOURO,
            @NUMERO,
            @COMPLEMENTO,
            @BAIRRO,
            @CEP,
            @MUNICIPIO,
            @UF,
            @NOME_CONTATO,
            @CARGO_CONTATO,
            @OBSERVACOES,
            @ORIGEM,
            @NOME_ARQUIVO_ORIGEM,
            @DATA_IMPORTACAO,
            @CNPJ_PENDENTE
        )
    `).run(company);

    return result.lastInsertRowid;
}

function updateImportedCompany(id, company) {
    importacaoDb.prepare(`
        UPDATE Empresas_Importadas
        SET
            ID_IMPORTACAO = @ID_IMPORTACAO,
            CNPJ = @CNPJ,
            RAZAO_SOCIAL = @RAZAO_SOCIAL,
            NOME_FANTASIA = @NOME_FANTASIA,
            TELEFONE = @TELEFONE,
            TELEFONE2 = @TELEFONE2,
            EMAIL = @EMAIL,
            LOGRADOURO = @LOGRADOURO,
            NUMERO = @NUMERO,
            COMPLEMENTO = @COMPLEMENTO,
            BAIRRO = @BAIRRO,
            CEP = @CEP,
            MUNICIPIO = @MUNICIPIO,
            UF = @UF,
            NOME_CONTATO = @NOME_CONTATO,
            CARGO_CONTATO = @CARGO_CONTATO,
            OBSERVACOES = @OBSERVACOES,
            ORIGEM = @ORIGEM,
            NOME_ARQUIVO_ORIGEM = @NOME_ARQUIVO_ORIGEM,
            DATA_IMPORTACAO = @DATA_IMPORTACAO,
            CNPJ_PENDENTE = @CNPJ_PENDENTE,
            DATA_ATUALIZACAO = CURRENT_TIMESTAMP
        WHERE ID = @ID
    `).run({ ...company, ID: id });
}

function findAuxiliaryDuplicate(company) {
    if (!company.TELEFONE || !company.RAZAO_SOCIAL || !company.MUNICIPIO || !company.UF) {
        return null;
    }

    const rows = importacaoDb.prepare(`
        SELECT *
        FROM Empresas_Importadas
        WHERE CNPJ_PENDENTE = 'S'
          AND TELEFONE = @TELEFONE
          AND RAZAO_SOCIAL = @RAZAO_SOCIAL
          AND MUNICIPIO = @MUNICIPIO
          AND UF = @UF
        LIMIT 2
    `).all({
        TELEFONE: company.TELEFONE,
        RAZAO_SOCIAL: company.RAZAO_SOCIAL,
        MUNICIPIO: company.MUNICIPIO,
        UF: company.UF
    });

    return rows.length === 1 ? rows[0] : null;
}

function saveImportedCompany(company) {
    let existing = null;

    if (company.CNPJ_PENDENTE === 'N' && company.CNPJ) {
        existing = importacaoDb.prepare(`
            SELECT *
            FROM Empresas_Importadas
            WHERE CNPJ = ?
        `).get(company.CNPJ);
    } else {
        existing = findAuxiliaryDuplicate(company);
    }

    if (!existing) {
        insertImportedCompany(company);
        return 'imported';
    }

    const { merged, changed } = mergeImportedValues(existing, company);

    if (changed) {
        updateImportedCompany(existing.ID, merged);
        return 'updated';
    }

    return 'duplicated';
}

function logImportError(idImportacao, linha, campo, motivo, raw) {
    importacaoDb.prepare(`
        INSERT INTO Importacao_Erros (
            ID_IMPORTACAO,
            LINHA,
            CAMPO,
            MOTIVO,
            DADOS_ORIGINAIS
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(idImportacao, linha, campo, motivo, JSON.stringify(raw || {}));
}

function getCurrentUser(body = {}) {
    return String(body.usuario || process.env.USERNAME || process.env.USER || 'local').trim();
}

function normalizeAdminText(value, maxLength = 180) {
    return String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function normalizeAdminEmail(value) {
    return normalizeAdminText(value, 180).toLowerCase();
}

function normalizePerfil(value) {
    const perfil = normalizeAdminText(value, 40).toUpperCase();

    return ['ADMIN', 'GESTOR', 'OPERADOR', 'CONSULTA'].includes(perfil) ? perfil : 'OPERADOR';
}

function normalizeStatusUsuario(value) {
    return normalizeAdminText(value, 20).toUpperCase() === 'INATIVO' ? 'INATIVO' : 'ATIVO';
}

function getDefaultPermissionCodes(perfil) {
    if (perfil === 'ADMIN') {
        return funcionalidadesCatalogo.map((item) => item.codigo);
    }

    if (perfil === 'CONSULTA') {
        return ['dashboard-crm', 'pesquisa-geral'];
    }

    if (perfil === 'GESTOR') {
        return funcionalidadesCatalogo
            .filter((item) => item.categoria !== 'Administracao' || item.codigo === 'administracao-usuarios')
            .map((item) => item.codigo);
    }

    return [...permissoesOperadorPadrao];
}

function listFuncionalidades() {
    return prospeccoesDb.prepare(`
        SELECT
            CODIGO AS codigo,
            NOME AS nome,
            CATEGORIA AS categoria,
            DESCRICAO AS descricao,
            ATIVA AS ativa
        FROM CRM_FUNCIONALIDADES
        WHERE ATIVA = 1
        ORDER BY CATEGORIA, NOME
    `).all();
}

function getUsuarioPermissoes(idUsuario) {
    return prospeccoesDb.prepare(`
        SELECT
            f.CODIGO AS codigo,
            f.NOME AS nome,
            f.CATEGORIA AS categoria,
            f.DESCRICAO AS descricao,
            COALESCE(p.PERMITIDO, 0) AS permitido
        FROM CRM_FUNCIONALIDADES f
        LEFT JOIN CRM_USUARIO_PERMISSOES p
            ON p.CODIGO_FUNCIONALIDADE = f.CODIGO
           AND p.ID_USUARIO = ?
        WHERE f.ATIVA = 1
        ORDER BY f.CATEGORIA, f.NOME
    `).all(idUsuario).map((row) => ({
        codigo: row.codigo,
        nome: row.nome,
        categoria: row.categoria,
        descricao: row.descricao,
        permitido: Number(row.permitido || 0) === 1
    }));
}

function getUsuarioById(idUsuario) {
    const usuario = prospeccoesDb.prepare(`
        SELECT
            ID_USUARIO AS idUsuario,
            NOME AS nome,
            EMAIL AS email,
            CARGO AS cargo,
            DEPARTAMENTO AS departamento,
            PERFIL AS perfil,
            STATUS AS status,
            '' AS senhaTemporaria,
            PRECISA_TROCAR_SENHA AS precisaTrocarSenha,
            OBSERVACOES AS observacoes,
            CRIADO_EM AS criadoEm,
            ULTIMO_ACESSO_EM AS ultimoAcessoEm,
            ATUALIZADO_EM AS atualizadoEm
        FROM CRM_USUARIOS
        WHERE ID_USUARIO = ?
    `).get(idUsuario);

    if (!usuario) {
        return null;
    }

    return {
        ...usuario,
        permissoes: getUsuarioPermissoes(idUsuario)
    };
}

function listUsuarios() {
    return prospeccoesDb.prepare(`
        SELECT
            u.ID_USUARIO AS idUsuario,
            u.NOME AS nome,
            u.EMAIL AS email,
            u.CARGO AS cargo,
            u.DEPARTAMENTO AS departamento,
            u.PERFIL AS perfil,
            u.STATUS AS status,
            u.PRECISA_TROCAR_SENHA AS precisaTrocarSenha,
            u.CRIADO_EM AS criadoEm,
            u.ULTIMO_ACESSO_EM AS ultimoAcessoEm,
            u.ATUALIZADO_EM AS atualizadoEm,
            COUNT(p.CODIGO_FUNCIONALIDADE) FILTER (WHERE p.PERMITIDO = 1) AS permissoesAtivas
        FROM CRM_USUARIOS u
        LEFT JOIN CRM_USUARIO_PERMISSOES p
            ON p.ID_USUARIO = u.ID_USUARIO
        GROUP BY u.ID_USUARIO
        ORDER BY
            CASE u.STATUS WHEN 'ATIVO' THEN 0 ELSE 1 END,
            u.NOME
    `).all();
}

function getUsuarioAuthByEmail(email) {
    const usuario = prospeccoesDb.prepare(`
        SELECT
            ID_USUARIO AS idUsuario,
            NOME AS nome,
            EMAIL AS email,
            CARGO AS cargo,
            DEPARTAMENTO AS departamento,
            PERFIL AS perfil,
            STATUS AS status,
            SENHA_HASH AS senhaHash,
            PRECISA_TROCAR_SENHA AS precisaTrocarSenha,
            ULTIMO_ACESSO_EM AS ultimoAcessoEm
        FROM CRM_USUARIOS
        WHERE EMAIL = ?
        LIMIT 1
    `).get(email);

    if (!usuario) {
        return null;
    }

    return {
        ...usuario,
        permissoes: getUsuarioPermissoes(usuario.idUsuario)
    };
}

function getAuthenticatedUser(req) {
    const token = getAuthToken(req);

    if (!token) {
        return null;
    }

    const tokenHash = hashToken(token);
    const now = new Date().toISOString();
    const session = prospeccoesDb.prepare(`
        SELECT
            s.TOKEN_HASH AS tokenHash,
            s.ID_SESSAO_NAVEGADOR AS sessionId,
            u.ID_USUARIO AS idUsuario
        FROM CRM_AUTH_SESSOES s
        INNER JOIN CRM_USUARIOS u
            ON u.ID_USUARIO = s.ID_USUARIO
        WHERE s.TOKEN_HASH = @tokenHash
          AND s.REVOGADO_EM IS NULL
          AND s.EXPIRA_EM >= @now
          AND u.STATUS = 'ATIVO'
        LIMIT 1
    `).get({ tokenHash, now });

    if (!session) {
        return null;
    }

    const usuario = getUsuarioById(session.idUsuario);

    if (!usuario) {
        return null;
    }

    prospeccoesDb.prepare(`
        UPDATE CRM_AUTH_SESSOES
        SET ULTIMO_ACESSO_EM = @now
        WHERE TOKEN_HASH = @tokenHash
    `).run({ now, tokenHash });

    recordUserAccess(req, usuario, session.sessionId || tokenHash);

    return usuario;
}

function userHasPermission(usuario, requiredPermission) {
    if (!requiredPermission || usuario?.perfil === 'ADMIN') {
        return true;
    }

    return (usuario?.permissoes || []).some((permission) => (
        permission.codigo === requiredPermission && permission.permitido
    ));
}

function requireAuth(req, res, requiredPermission = '') {
    const usuario = getAuthenticatedUser(req);

    if (!usuario) {
        json(res, 401, { error: 'Login necessario para acessar o CRM.' });
        return null;
    }

    if (!userHasPermission(usuario, requiredPermission)) {
        json(res, 403, { error: 'Usuario sem permissao para esta funcionalidade.' });
        return null;
    }

    return usuario;
}

function recordUserAccess(req, usuario, sessionId) {
    const now = new Date().toISOString();
    const ip = normalizeAdminText(req.socket?.remoteAddress || '', 90);
    const userAgent = normalizeAdminText(req.headers['user-agent'] || '', 500);

    prospeccoesDb.prepare(`
        INSERT INTO CRM_ACESSOS (
            ID_SESSAO,
            ID_USUARIO,
            NOME_USUARIO,
            IP,
            USER_AGENT,
            CRIADO_EM,
            ULTIMO_ACESSO_EM
        )
        VALUES (@sessionId, @idUsuario, @nomeUsuario, @ip, @userAgent, @now, @now)
        ON CONFLICT(ID_SESSAO) DO UPDATE SET
            ID_USUARIO = excluded.ID_USUARIO,
            NOME_USUARIO = excluded.NOME_USUARIO,
            IP = excluded.IP,
            USER_AGENT = excluded.USER_AGENT,
            ULTIMO_ACESSO_EM = excluded.ULTIMO_ACESSO_EM
    `).run({
        sessionId: normalizeAdminText(sessionId, 160),
        idUsuario: usuario.idUsuario,
        nomeUsuario: usuario.nome,
        ip,
        userAgent,
        now
    });

    prospeccoesDb.prepare(`
        UPDATE CRM_USUARIOS
        SET ULTIMO_ACESSO_EM = ?, ATUALIZADO_EM = CURRENT_TIMESTAMP
        WHERE ID_USUARIO = ?
    `).run(now, usuario.idUsuario);
}

function getAccessWindowIso(minutes = 5) {
    return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function getAdminResumo() {
    const accessWindow = getAccessWindowIso(5);
    const metricas = prospeccoesDb.prepare(`
        SELECT
            (SELECT COUNT(*) FROM CRM_USUARIOS) AS usuariosCadastrados,
            (SELECT COUNT(*) FROM CRM_USUARIOS WHERE STATUS = 'ATIVO') AS usuariosAtivos,
            (SELECT COUNT(*) FROM CRM_USUARIOS WHERE STATUS = 'INATIVO') AS usuariosInativos,
            (SELECT COUNT(*) FROM CRM_ACESSOS WHERE ULTIMO_ACESSO_EM >= @accessWindow) AS sessoesAtivas,
            (SELECT COUNT(DISTINCT COALESCE(ID_USUARIO, ID_SESSAO)) FROM CRM_ACESSOS WHERE ULTIMO_ACESSO_EM >= @accessWindow) AS usuariosOnline,
            (SELECT COUNT(*) FROM CRM_FUNCIONALIDADES WHERE ATIVA = 1) AS funcionalidades
    `).get({ accessWindow });

    const acessosRecentes = prospeccoesDb.prepare(`
        SELECT
            a.ID_SESSAO AS idSessao,
            a.ID_USUARIO AS idUsuario,
            COALESCE(u.NOME, a.NOME_USUARIO, 'Visitante') AS nomeUsuario,
            COALESCE(u.EMAIL, '') AS email,
            a.IP AS ip,
            a.USER_AGENT AS userAgent,
            a.CRIADO_EM AS criadoEm,
            a.ULTIMO_ACESSO_EM AS ultimoAcessoEm
        FROM CRM_ACESSOS a
        LEFT JOIN CRM_USUARIOS u
            ON u.ID_USUARIO = a.ID_USUARIO
        WHERE a.ULTIMO_ACESSO_EM >= @accessWindow
        ORDER BY a.ULTIMO_ACESSO_EM DESC
        LIMIT 30
    `).all({ accessWindow });

    return {
        geradoEm: new Date().toISOString(),
        janelaMinutos: 5,
        metricas,
        usuarios: listUsuarios(),
        acessosRecentes
    };
}

function normalizeUsuarioPayload(body = {}, existing = {}) {
    const perfil = normalizePerfil(body.perfil ?? existing.perfil);
    const usuario = {
        nome: normalizeAdminText(body.nome ?? existing.nome, 120),
        email: normalizeAdminEmail(body.email ?? existing.email),
        cargo: normalizeAdminText(body.cargo ?? existing.cargo, 120),
        departamento: normalizeAdminText(body.departamento ?? existing.departamento, 120),
        perfil,
        status: normalizeStatusUsuario(body.status ?? existing.status),
        senhaTemporaria: normalizeAdminText(body.senhaTemporaria, 120),
        observacoes: normalizeAdminText(body.observacoes ?? existing.observacoes, 800),
        permissoes: Array.isArray(body.permissoes) ? body.permissoes : getDefaultPermissionCodes(perfil)
    };

    if (!usuario.nome) {
        throw new Error('Nome do usuario e obrigatorio.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.email)) {
        throw new Error('E-mail do usuario e obrigatorio e precisa ser valido.');
    }

    return usuario;
}

function createAuthSession(req, usuario, browserSessionId = '') {
    const token = randomToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + authSessionDurationMs).toISOString();
    const tokenHash = hashToken(token);

    prospeccoesDb.prepare(`
        INSERT INTO CRM_AUTH_SESSOES (
            TOKEN_HASH,
            ID_USUARIO,
            ID_SESSAO_NAVEGADOR,
            IP,
            USER_AGENT,
            CRIADO_EM,
            ULTIMO_ACESSO_EM,
            EXPIRA_EM
        )
        VALUES (
            @tokenHash,
            @idUsuario,
            @browserSessionId,
            @ip,
            @userAgent,
            @now,
            @now,
            @expiresAt
        )
    `).run({
        tokenHash,
        idUsuario: usuario.idUsuario,
        browserSessionId: normalizeAdminText(browserSessionId, 160),
        ip: normalizeAdminText(req.socket?.remoteAddress || '', 90),
        userAgent: normalizeAdminText(req.headers['user-agent'] || '', 500),
        now,
        expiresAt
    });

    recordUserAccess(req, usuario, browserSessionId || tokenHash);

    return token;
}

async function authLoginHandler(req, res) {
    if (req.method !== 'POST') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    const body = await readJsonBody(req);
    const email = normalizeAdminEmail(body.email);
    const password = String(body.senha || body.password || '');
    const usuario = getUsuarioAuthByEmail(email);

    if (!usuario || usuario.status !== 'ATIVO' || !verifyPassword(password, usuario.senhaHash)) {
        json(res, 401, { error: 'E-mail ou senha invalidos.' });
        return;
    }

    const token = createAuthSession(req, usuario, body.sessionId);

    json(res, 200, {
        ok: true,
        usuario: publicUser(usuario),
        funcionalidades: listFuncionalidades()
    }, {
        'Set-Cookie': buildAuthCookie(token, Math.floor(authSessionDurationMs / 1000))
    });
}

async function authSessionHandler(req, res) {
    if (req.method !== 'GET') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    const usuario = getAuthenticatedUser(req);

    if (!usuario) {
        json(res, 401, { error: 'Sessao expirada ou login necessario.' });
        return;
    }

    json(res, 200, {
        ok: true,
        usuario: publicUser(usuario),
        funcionalidades: listFuncionalidades()
    });
}

async function authLogoutHandler(req, res) {
    if (req.method !== 'POST') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    const token = getAuthToken(req);

    if (token) {
        prospeccoesDb.prepare(`
            UPDATE CRM_AUTH_SESSOES
            SET REVOGADO_EM = CURRENT_TIMESTAMP
            WHERE TOKEN_HASH = ?
        `).run(hashToken(token));
    }

    json(res, 200, { ok: true }, {
        'Set-Cookie': buildAuthCookie('', 0)
    });
}

async function adminResumoHandler(req, res) {
    if (req.method !== 'GET') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    if (!requireAuth(req, res, 'administracao-usuarios')) {
        return;
    }

    json(res, 200, getAdminResumo());
}

async function adminAcessoHandler(req, res) {
    if (req.method !== 'POST') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    const usuario = requireAuth(req, res);

    if (!usuario) {
        return;
    }

    json(res, 200, {
        ok: true,
        usuario: publicUser(usuario),
        funcionalidades: listFuncionalidades()
    });
}

async function adminUsuariosHandler(req, res, url) {
    if (req.method === 'GET') {
        const idUsuario = Number(url.searchParams.get('id') || 0);
        const requiredPermission = idUsuario > 0 ? 'configuracoes-usuario' : 'administracao-usuarios';

        if (!requireAuth(req, res, requiredPermission)) {
            return;
        }

        if (idUsuario > 0) {
            const usuario = getUsuarioById(idUsuario);

            if (!usuario) {
                json(res, 404, { error: 'Usuario nao encontrado.' });
                return;
            }

            json(res, 200, { usuario, funcionalidades: listFuncionalidades() });
            return;
        }

        json(res, 200, { usuarios: listUsuarios(), funcionalidades: listFuncionalidades() });
        return;
    }

    if (req.method === 'POST') {
        if (!requireAuth(req, res, 'configuracoes-usuario')) {
            return;
        }

        const body = await readJsonBody(req);
        const usuario = normalizeUsuarioPayload(body);
        const senhaInicial = usuario.senhaTemporaria || 'Alterar@123';

        try {
            const result = prospeccoesDb.prepare(`
                INSERT INTO CRM_USUARIOS (
                    NOME,
                    EMAIL,
                    CARGO,
                    DEPARTAMENTO,
                    PERFIL,
                    STATUS,
                    SENHA_TEMPORARIA,
                    SENHA_HASH,
                    PRECISA_TROCAR_SENHA,
                    OBSERVACOES
                )
                VALUES (
                    @nome,
                    @email,
                    @cargo,
                    @departamento,
                    @perfil,
                    @status,
                    '',
                    @senhaHash,
                    1,
                    @observacoes
                )
            `).run({
                ...usuario,
                senhaHash: createPasswordHash(senhaInicial)
            });

            salvarPermissoesUsuario(result.lastInsertRowid, usuario.permissoes);
            json(res, 201, {
                ok: true,
                usuario: getUsuarioById(result.lastInsertRowid),
                usuarios: listUsuarios()
            });
        } catch (error) {
            if (String(error.message || '').includes('UNIQUE')) {
                json(res, 409, { error: 'Ja existe um usuario cadastrado com este e-mail.' });
                return;
            }

            throw error;
        }
        return;
    }

    if (req.method === 'PUT') {
        const idUsuario = Number(url.searchParams.get('id') || 0);

        if (!requireAuth(req, res, 'configuracoes-usuario')) {
            return;
        }

        const existing = getUsuarioById(idUsuario);

        if (!existing) {
            json(res, 404, { error: 'Usuario nao encontrado.' });
            return;
        }

        const body = await readJsonBody(req);
        const usuario = normalizeUsuarioPayload(body, existing);

        try {
            prospeccoesDb.prepare(`
                UPDATE CRM_USUARIOS
                SET
                    NOME = @nome,
                    EMAIL = @email,
                    CARGO = @cargo,
                    DEPARTAMENTO = @departamento,
                    PERFIL = @perfil,
                    STATUS = @status,
                    OBSERVACOES = @observacoes,
                    ATUALIZADO_EM = CURRENT_TIMESTAMP
                WHERE ID_USUARIO = @idUsuario
            `).run({ ...usuario, idUsuario });

            if (usuario.senhaTemporaria) {
                prospeccoesDb.prepare(`
                    UPDATE CRM_USUARIOS
                    SET
                        SENHA_TEMPORARIA = '',
                        SENHA_HASH = @senhaHash,
                        PRECISA_TROCAR_SENHA = 1,
                        ATUALIZADO_EM = CURRENT_TIMESTAMP
                    WHERE ID_USUARIO = @idUsuario
                `).run({
                    idUsuario,
                    senhaHash: createPasswordHash(usuario.senhaTemporaria)
                });
            }

            salvarPermissoesUsuario(idUsuario, usuario.permissoes);
            json(res, 200, {
                ok: true,
                usuario: getUsuarioById(idUsuario),
                usuarios: listUsuarios()
            });
        } catch (error) {
            if (String(error.message || '').includes('UNIQUE')) {
                json(res, 409, { error: 'Ja existe outro usuario com este e-mail.' });
                return;
            }

            throw error;
        }
        return;
    }

    json(res, 405, { error: 'Metodo nao permitido.' });
}

function listImportacoes() {
    return importacaoDb.prepare(`
        SELECT
            ID_IMPORTACAO,
            NOME_ARQUIVO,
            TIPO_ARQUIVO,
            DATA_HORA_IMPORTACAO,
            USUARIO,
            TOTAL_LINHAS,
            TOTAL_IMPORTADAS,
            TOTAL_ATUALIZADAS,
            TOTAL_DUPLICADAS,
            TOTAL_ERROS,
            TOTAL_CNPJ_PENDENTE
        FROM Importacoes
        ORDER BY ID_IMPORTACAO DESC
        LIMIT 100
    `).all();
}

function listImportacaoErros(idImportacao) {
    return importacaoDb.prepare(`
        SELECT LINHA, CAMPO, MOTIVO, DADOS_ORIGINAIS
        FROM Importacao_Erros
        WHERE ID_IMPORTACAO = ?
        ORDER BY ID
        LIMIT 500
    `).all(idImportacao).map((row) => ({
        ...row,
        DADOS_ORIGINAIS: parseJsonObject(row.DADOS_ORIGINAIS)
    }));
}

async function importacoesHandler(req, res, url) {
    if (req.method === 'GET') {
        json(res, 200, { importacoes: listImportacoes() });
        return;
    }

    if (req.method !== 'POST') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    const body = await readJsonBody(req);
    const fileName = path.basename(String(body.fileName || ''));
    const extension = path.extname(fileName).toLowerCase();

    if (!fileName || !['.xlsx', '.csv'].includes(extension)) {
        json(res, 400, { error: 'Selecione um arquivo XLSX ou CSV.' });
        return;
    }

    const rows = normalizeImportRows(parseImportFile(fileName, body.contentBase64));
    const tipoArquivo = extension.replace('.', '').toUpperCase();
    const usuario = getCurrentUser(body);
    const now = new Date().toISOString();

    const importacaoInfo = importacaoDb.prepare(`
        INSERT INTO Importacoes (
            NOME_ARQUIVO,
            TIPO_ARQUIVO,
            DATA_HORA_IMPORTACAO,
            USUARIO,
            TOTAL_LINHAS
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(fileName, tipoArquivo, now, usuario, rows.length);

    const idImportacao = importacaoInfo.lastInsertRowid;
    const summary = {
        idImportacao,
        arquivo: fileName,
        totalLinhas: rows.length,
        importadas: 0,
        atualizadas: 0,
        duplicadas: 0,
        erros: 0,
        cnpjPendente: 0
    };

    const transaction = importacaoDb.transaction(() => {
        rows.forEach((row, index) => {
            const linha = index + 2;
            const company = normalizeImportedCompany(row, {
                origem: 'IMPORTACAO',
                idImportacao,
                nomeArquivo: fileName,
                dataImportacao: now
            });

            if (!company.RAZAO_SOCIAL) {
                summary.erros += 1;
                logImportError(idImportacao, linha, 'RAZAO_SOCIAL', 'Razao Social e obrigatoria.', row);
                return;
            }

            if (company.CNPJ_PENDENTE === 'S') {
                summary.cnpjPendente += 1;
            }

            const status = saveImportedCompany(company);

            if (status === 'imported') {
                summary.importadas += 1;
            } else if (status === 'updated') {
                summary.atualizadas += 1;
            } else {
                summary.duplicadas += 1;
            }
        });

        importacaoDb.prepare(`
            UPDATE Importacoes
            SET
                TOTAL_IMPORTADAS = @importadas,
                TOTAL_ATUALIZADAS = @atualizadas,
                TOTAL_DUPLICADAS = @duplicadas,
                TOTAL_ERROS = @erros,
                TOTAL_CNPJ_PENDENTE = @cnpjPendente
            WHERE ID_IMPORTACAO = @idImportacao
        `).run(summary);
    });

    transaction();

    json(res, 200, {
        ok: true,
        resultado: summary,
        erros: listImportacaoErros(idImportacao),
        importacoes: listImportacoes()
    });
}

async function cadastroEmpresaImportadaHandler(req, res) {
    if (req.method !== 'POST') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    const body = await readJsonBody(req);
    const company = normalizeImportedCompany(body, {
        origem: 'CADASTRO_MANUAL',
        nomeArquivo: '',
        dataImportacao: null
    });

    if (!company.RAZAO_SOCIAL) {
        json(res, 400, { error: 'Razao Social e obrigatoria.' });
        return;
    }

    const status = saveImportedCompany(company);

    json(res, 200, {
        ok: true,
        status,
        cnpjPendente: company.CNPJ_PENDENTE,
        empresa: company
    });
}

function importacaoErrosHandler(res, url) {
    const idImportacao = Number(url.searchParams.get('id'));

    if (!Number.isInteger(idImportacao) || idImportacao <= 0) {
        json(res, 400, { error: 'ID da importacao invalido.' });
        return;
    }

    json(res, 200, { erros: listImportacaoErros(idImportacao) });
}

function listCnaes(searchTerm) {
    const normalizedValue = normalizeText(searchTerm || '');
    const codeValue = String(searchTerm || '').replace(/\D/g, '');

    if (!normalizedValue && !codeValue) {
        return [];
    }

    return db.prepare(`
        SELECT CODIGO, DESCRICAO
        FROM CNAES
        WHERE (
            CAST(CODIGO AS TEXT) = @value
            OR CAST(CODIGO AS TEXT) LIKE @codeLike
            OR UPPER(TRIM(DESCRICAO)) LIKE @descLike
            OR REPLACE(REPLACE(REPLACE(REPLACE(UPPER(TRIM(DESCRICAO)), 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ç', 'C') LIKE @like
        )
        ORDER BY CASE WHEN CAST(CODIGO AS TEXT) = @value THEN 0 ELSE 1 END, DESCRICAO
        LIMIT 20
    `).all({
        value: searchTerm || '',
        codeLike: `%${codeValue}%`,
        descLike: `%${normalizedValue}%`,
        like: `%${normalizedValue}%`
    }).map((row) => ({
        codigo: String(row.CODIGO),
        descricao: row.DESCRICAO,
        label: `${row.CODIGO} - ${row.DESCRICAO}`
    }));
}

function buildCompanyFilters(url) {
    const params = url.searchParams;
    const where = [];
    const values = {};

    const q = params.get('q');
    const uf = params.get('uf');
    const municipio = params.get('municipio');
    const municipioCodigo = params.get('municipioCodigo');
    const cnae = params.get('cnae');
    const situacao = params.get('situacao');
    const matrizFilial = params.get('matrizFilial');
    const mei = params.get('mei');
    const simples = params.get('simples');
    const aberturaInicio = params.get('aberturaInicio');
    const aberturaFim = params.get('aberturaFim');
    const capitalMin = params.get('capitalMin');
    const capitalMax = params.get('capitalMax');
    const temEmail = parseBooleanFlag(params.get('temEmail'));
    const temTelefone = parseBooleanFlag(params.get('temTelefone'));
    const tipoTelefone = params.get('tipoTelefone');
    const flagFilter = getFlagFilter(params);

    if (q) {
        const qTrimmed = q.trim();
        const cnpjDigits = qTrimmed.replace(/\D/g, '');

        if (cnpjDigits.length === 14) {
            values.cnpj = cnpjDigits;
            where.push('CNPJ = @cnpj');
        } else if (cnpjDigits.length === 8 && /^\d+$/.test(qTrimmed)) {
            values.cnpjBasico = cnpjDigits;
            where.push('CNPJ_BASICO = @cnpjBasico');
        } else {
            values.q = `%${qTrimmed}%`;
            values.cnpj = cnpjDigits;
            where.push(`(
                RAZAO_SOCIAL LIKE @q
                OR NOME_FANTASIA LIKE @q
                OR CNPJ = @cnpj
                OR CNPJ_BASICO = @cnpj
            )`);
        }
    }

    if (uf) {
        values.uf = uf.toUpperCase();
        where.push('UF = @uf');
    }

    if (municipioCodigo || municipio) {
        const municipioCode = /^\d+$/.test(String(municipioCodigo || ''))
            ? String(municipioCodigo).trim()
            : resolveMunicipioCode(municipio, uf);

        if (municipioCode) {
            values.municipio = municipioCode;
            where.push('MUNICIPIO = @municipio');
        }
    }

    if (cnae) {
        const cnaeCode = resolveCnaeCode(cnae);

        if (cnaeCode) {
            values.cnae = cnaeCode;
            where.push('CNAE_FISCAL_PRINCIPAL = @cnae');
        }
    }

    if (situacao) {
        values.situacao = situacao;
        where.push('SITUACAO_CADASTRAL = @situacao');
    }

    if (matrizFilial) {
        values.matrizFilial = matrizFilial;
        where.push('IDENTIFICADOR_MATRIZ_FILIAL = @matrizFilial');
    }

    if (mei) {
        values.mei = mei.toUpperCase();
        where.push('OPCAO_PELO_MEI = @mei');
    }

    if (simples) {
        values.simples = simples.toUpperCase();
        where.push('OPCAO_PELO_SIMPLES = @simples');
    }

    if (aberturaInicio) {
        values.aberturaInicio = aberturaInicio.replace(/\D/g, '');
        where.push('DATA_INICIO_ATIVIDADE >= @aberturaInicio');
    }

    if (aberturaFim) {
        values.aberturaFim = aberturaFim.replace(/\D/g, '');
        where.push('DATA_INICIO_ATIVIDADE <= @aberturaFim');
    }

    if (capitalMin) {
        values.capitalMin = Number(capitalMin);
        where.push('CAPITAL_SOCIAL >= @capitalMin');
    }

    if (capitalMax) {
        values.capitalMax = Number(capitalMax);
        where.push('CAPITAL_SOCIAL <= @capitalMax');
    }

    if (temEmail !== null) {
        values.temEmail = temEmail ? 1 : 0;
        where.push('TEM_EMAIL = @temEmail');
    }

    if (temTelefone !== null) {
        values.temTelefone = temTelefone ? 1 : 0;
        where.push('TEM_TELEFONE = @temTelefone');
    }

    if (tipoTelefone) {
        const phoneTypeCondition = buildViewPhoneTypeCondition(tipoTelefone);

        if (phoneTypeCondition) {
            where.push(phoneTypeCondition);
        }
    }

    appendFlagFilter(where, flagFilter, 'CRM_EMPRESAS_PESQUISA.CNPJ');

    const whereSql = where.length > 0 ? `WHERE ${where.join('\nAND ')}` : '';

    return {
        whereSql,
        values
    };
}

function buildOrder(url) {
    if (!url.searchParams.has('order[0][column]')) {
        return '';
    }

    const orderColumnIndex = Number(url.searchParams.get('order[0][column]'));
    const requestedColumn = dataTableOrderColumns[orderColumnIndex];

    if (!requestedColumn) {
        return '';
    }

    const direction = String(url.searchParams.get('order[0][dir]') || 'asc').toLowerCase() === 'desc'
        ? 'DESC'
        : 'ASC';

    return `ORDER BY ${requestedColumn} ${direction}`;
}

function buildRecentOrder(url) {
    if (!url.searchParams.has('order[0][column]')) {
        return 'ORDER BY est.DATA_INICIO_ATIVIDADE DESC, est.CNPJ ASC';
    }

    const orderColumnIndex = Number(url.searchParams.get('order[0][column]'));
    const requestedColumn = dataTableOrderColumns[orderColumnIndex];

    if (!requestedColumn) {
        return 'ORDER BY est.DATA_INICIO_ATIVIDADE DESC, est.CNPJ ASC';
    }

    const direction = String(url.searchParams.get('order[0][dir]') || 'asc').toLowerCase() === 'desc'
        ? 'DESC'
        : 'ASC';

    return `ORDER BY ${requestedColumn} ${direction}, est.DATA_INICIO_ATIVIDADE DESC, est.CNPJ ASC`;
}

function buildRecentOuterOrder(url) {
    if (!url.searchParams.has('order[0][column]')) {
        return 'ORDER BY r.DATA_INICIO_ATIVIDADE DESC, r.CNPJ ASC';
    }

    const orderColumnIndex = Number(url.searchParams.get('order[0][column]'));

    if (orderColumnIndex !== 4 && orderColumnIndex !== 8) {
        return 'ORDER BY r.DATA_INICIO_ATIVIDADE DESC, r.CNPJ ASC';
    }

    const direction = String(url.searchParams.get('order[0][dir]') || 'asc').toLowerCase() === 'desc'
        ? 'DESC'
        : 'ASC';

    if (orderColumnIndex === 8) {
        return `ORDER BY r.DATA_INICIO_ATIVIDADE ${direction}, r.CNPJ ASC`;
    }

    return `ORDER BY r.UF ${direction}, r.DATA_INICIO_ATIVIDADE DESC, r.CNPJ ASC`;
}

function getDirectCnpjSearch(url) {
    const qDigits = String(url.searchParams.get('q') || '').replace(/\D/g, '');
    const dataTableDigits = String(url.searchParams.get('search[value]') || '').replace(/\D/g, '');

    if (qDigits.length === 14) {
        return qDigits;
    }

    if (dataTableDigits.length === 14) {
        return dataTableDigits;
    }

    return null;
}

function buildRecentCompanyFilters(url) {
    const params = url.searchParams;
    const where = [];
    const values = {};

    const q = params.get('q');
    const uf = params.get('uf');
    const municipio = params.get('municipio');
    const municipioCodigo = params.get('municipioCodigo');
    const cnae = params.get('cnae');
    const situacao = params.get('situacao');
    const matrizFilial = params.get('matrizFilial');
    const mei = params.get('mei');
    const simples = params.get('simples');
    const aberturaInicio = params.get('aberturaInicio');
    const aberturaFim = params.get('aberturaFim');
    const capitalMin = params.get('capitalMin');
    const capitalMax = params.get('capitalMax');
    const temEmail = parseBooleanFlag(params.get('temEmail'));
    const temTelefone = parseBooleanFlag(params.get('temTelefone'));
    const tipoTelefone = params.get('tipoTelefone');
    const flagFilter = getFlagFilter(params);
    const dataTableSearch = params.get('search[value]');

    if (q) {
        const qTrimmed = q.trim();
        const cnpjDigits = qTrimmed.replace(/\D/g, '');

        if (cnpjDigits.length === 14) {
            values.cnpj = cnpjDigits;
            where.push('est.CNPJ = @cnpj');
        } else if (cnpjDigits.length === 8 && /^\d+$/.test(qTrimmed)) {
            values.cnpjBasico = cnpjDigits;
            where.push('est.CNPJ_BASICO = @cnpjBasico');
        } else {
            values.q = `%${qTrimmed}%`;
            values.cnpj = cnpjDigits;
            where.push(`(
                emp.RAZAO_SOCIAL LIKE @q
                OR est.NOME_FANTASIA LIKE @q
                OR est.CNPJ = @cnpj
                OR est.CNPJ_BASICO = @cnpj
            )`);
        }
    }

    if (dataTableSearch) {
        const dataTableCnpj = dataTableSearch.replace(/\D/g, '');

        if (dataTableCnpj.length === 14) {
            values.dataTableCnpj = dataTableCnpj;
            where.push('est.CNPJ = @dataTableCnpj');
        }
    }

    if (uf) {
        values.uf = uf.toUpperCase();
        where.push('est.UF = @uf');
    }

    if (municipioCodigo || municipio) {
        const municipioCode = /^\d+$/.test(String(municipioCodigo || ''))
            ? String(municipioCodigo).trim()
            : resolveMunicipioCode(municipio, uf);

        if (municipioCode) {
            values.municipio = municipioCode;
            where.push('est.MUNICIPIO = @municipio');
        }
    }

    if (cnae) {
        const cnaeCode = resolveCnaeCode(cnae);

        if (cnaeCode) {
            values.cnae = cnaeCode;
            where.push('est.CNAE_FISCAL_PRINCIPAL = @cnae');
        }
    }

    if (situacao) {
        values.situacao = situacao;
        where.push('est.SITUACAO_CADASTRAL = @situacao');
    }

    if (matrizFilial) {
        values.matrizFilial = matrizFilial;
        where.push('est.IDENTIFICADOR_MATRIZ_FILIAL = @matrizFilial');
    }

    if (mei) {
        values.mei = mei.toUpperCase();
        where.push('simples.OPCAO_PELO_MEI = @mei');
    }

    if (simples) {
        values.simples = simples.toUpperCase();
        where.push('simples.OPCAO_PELO_SIMPLES = @simples');
    }

    if (aberturaInicio) {
        values.aberturaInicio = aberturaInicio.replace(/\D/g, '');
        where.push('est.DATA_INICIO_ATIVIDADE >= @aberturaInicio');
    }

    if (aberturaFim) {
        values.aberturaFim = aberturaFim.replace(/\D/g, '');
        where.push('est.DATA_INICIO_ATIVIDADE <= @aberturaFim');
    }

    if (capitalMin) {
        values.capitalMin = Number(capitalMin);
        where.push('emp.CAPITAL_SOCIAL >= @capitalMin');
    }

    if (capitalMax) {
        values.capitalMax = Number(capitalMax);
        where.push('emp.CAPITAL_SOCIAL <= @capitalMax');
    }

    if (temEmail !== null) {
        where.push(temEmail ? "est.EMAIL <> ''" : "(est.EMAIL = '' OR est.EMAIL IS NULL)");
    }

    if (temTelefone !== null) {
        where.push(temTelefone
            ? "(est.TELEFONE_1 <> '' OR est.TELEFONE_2 <> '')"
            : "((est.TELEFONE_1 = '' OR est.TELEFONE_1 IS NULL) AND (est.TELEFONE_2 = '' OR est.TELEFONE_2 IS NULL))");
    }

    if (tipoTelefone) {
        const phoneTypeCondition = buildPhoneTypeCondition('est', tipoTelefone);

        if (phoneTypeCondition) {
            where.push(phoneTypeCondition);
        }
    }

    appendFlagFilter(where, flagFilter, 'est.CNPJ');

    return {
        whereSql: where.length > 0 ? `WHERE ${where.join('\nAND ')}` : '',
        values
    };
}

function buildSearch(url) {
    const filters = buildCompanyFilters(url);
    const limit = clampLimit(url.searchParams.get('limit'));
    const offset = clampOffset(url.searchParams.get('offset'));
    const values = {
        ...filters.values,
        limit,
        offset
    };

    return {
        sql: `
            SELECT
                CRM_EMPRESAS_PESQUISA.*,
                COALESCE((
                    SELECT flags.FLAG_ATIVA
                    FROM crm.EMPRESAS_FLAGS flags
                    WHERE flags.CNPJ = CRM_EMPRESAS_PESQUISA.CNPJ
                      AND flags.FLAG_ATIVA = 1
                    LIMIT 1
                ), 0) AS FLAG_ATIVA
            FROM CRM_EMPRESAS_PESQUISA
            ${filters.whereSql}
            LIMIT @limit
            OFFSET @offset
        `,
        values,
        limit,
        offset
    };
}

function buildDataTablesSearch(url) {
    const directCnpj = getDirectCnpjSearch(url);
    const limit = clampLimit(url.searchParams.get('length'));
    const offset = clampOffset(url.searchParams.get('start'));
    const flagFilter = getFlagFilter(url.searchParams);

    if (directCnpj) {
        const where = ['CNPJ = @directCnpj'];
        appendFlagFilter(where, flagFilter, 'CRM_EMPRESAS_PESQUISA.CNPJ');

        return {
            sql: `
                SELECT
                    CRM_EMPRESAS_PESQUISA.*,
                    COALESCE((
                        SELECT flags.FLAG_ATIVA
                        FROM crm.EMPRESAS_FLAGS flags
                        WHERE flags.CNPJ = CRM_EMPRESAS_PESQUISA.CNPJ
                          AND flags.FLAG_ATIVA = 1
                        LIMIT 1
                    ), 0) AS FLAG_ATIVA
                FROM CRM_EMPRESAS_PESQUISA
                WHERE ${where.join('\nAND ')}
                LIMIT @limit
                OFFSET @offset
            `,
            values: {
                directCnpj,
                limit: limit + 1,
                offset
            },
            limit,
            offset
        };
    }

    const filters = buildRecentCompanyFilters(url);
    const values = {
        ...filters.values,
        limit: limit + 1,
        offset
    };

    return {
        sql: `
            WITH recentes AS (
                SELECT
                    est.CNPJ,
                    est.UF,
                    est.DATA_INICIO_ATIVIDADE
                FROM ESTABELECIMENTOS est INDEXED BY IDX_ESTABELECIMENTOS_ABERTURA
                LEFT JOIN EMPRESAS emp
                    ON emp.CNPJ_BASICO = est.CNPJ_BASICO
                LEFT JOIN SIMPLES simples
                    ON simples.CNPJ_BASICO = est.CNPJ_BASICO
                ${filters.whereSql}
                ${buildRecentOrder(url)}
                LIMIT @limit
                OFFSET @offset
            )
            SELECT
                v.*,
                COALESCE(flags.FLAG_ATIVA, 0) AS FLAG_ATIVA
            FROM recentes r
            JOIN CRM_EMPRESAS_PESQUISA v
                ON v.CNPJ = r.CNPJ
            LEFT JOIN crm.EMPRESAS_FLAGS flags
                ON flags.CNPJ = v.CNPJ
               AND flags.FLAG_ATIVA = 1
            ${buildRecentOuterOrder(url)}
        `,
        values,
        limit,
        offset
    };
}

function buildSelectedExportSearch(cnpjs) {
    return {
        sql: `
            WITH selecionadas AS (
                SELECT
                    CAST(key AS INTEGER) AS POSICAO,
                    CAST(value AS TEXT) AS CNPJ
                FROM json_each(@cnpjs)
            )
            SELECT
                v.CNPJ,
                v.RAZAO_SOCIAL,
                v.NOME_FANTASIA,
                v.MUNICIPIO_DESCRICAO,
                v.UF,
                v.CNAE_FISCAL_PRINCIPAL,
                v.CNAE_FISCAL_PRINCIPAL_DESCRICAO,
                v.PORTE_EMPRESA,
                v.DATA_INICIO_ATIVIDADE,
                v.DDD_1,
                v.TELEFONE_1,
                v.DDD_2,
                v.TELEFONE_2
            FROM selecionadas s
            JOIN CRM_EMPRESAS_PESQUISA v
                ON v.CNPJ = s.CNPJ
            ORDER BY s.POSICAO
        `,
        values: { cnpjs: JSON.stringify(cnpjs) }
    };
}

function escapeSpreadsheetXml(value) {
    return String(value ?? '')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

function spreadsheetCell(value, style = '') {
    const styleAttribute = style ? ` ss:StyleID="${style}"` : '';
    return `<Cell${styleAttribute}><Data ss:Type="String">${escapeSpreadsheetXml(value)}</Data></Cell>`;
}

function formatExportDate(value) {
    const digits = String(value || '');
    return digits.length === 8
        ? `${digits.slice(6, 8)}/${digits.slice(4, 6)}/${digits.slice(0, 4)}`
        : digits;
}

function formatExportPhone(row) {
    const first = `${row.DDD_1 ? `(${row.DDD_1}) ` : ''}${row.TELEFONE_1 || ''}`.trim();
    const second = `${row.DDD_2 ? `(${row.DDD_2}) ` : ''}${row.TELEFONE_2 || ''}`.trim();
    return [first, second].filter(Boolean).join(' / ');
}

async function writeResponseChunk(res, chunk) {
    if (!res.write(chunk)) {
        await once(res, 'drain');
    }
}

async function exportCompaniesXls(req, res) {
    if (req.method !== 'POST') {
        json(res, 405, { error: 'Metodo nao permitido.' });
        return;
    }

    const body = await readJsonBody(req);
    const cnpjs = Array.from(new Set(
        (Array.isArray(body.cnpjs) ? body.cnpjs : [])
            .map((value) => String(value || '').replace(/\D/g, ''))
            .filter((value) => value.length === 14)
    ));

    if (cnpjs.length === 0) {
        json(res, 400, { error: 'Selecione ao menos uma empresa para exportar.' });
        return;
    }

    const query = buildSelectedExportSearch(cnpjs);
    const statement = db.prepare(query.sql);
    const headers = [
        'Razao Social',
        'Nome Fantasia',
        'Municipio',
        'UF',
        'Telefone',
        'CNAE',
        'Descricao CNAE',
        'Abertura',
        'Porte',
        'CNPJ'
    ];
    const headerRow = `<Row>${headers.map((header) => spreadsheetCell(header, 'Header')).join('')}</Row>`;
    const date = new Date().toISOString().slice(0, 10);
    const rowsPerSheet = 65535;
    let sheetNumber = 1;
    let rowCount = 0;

    res.writeHead(200, {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="empresas_selecionadas_${date}.xls"`,
        'Cache-Control': 'no-store'
    });

    await writeResponseChunk(res, `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#DDEBF7" ss:Pattern="Solid"/></Style></Styles>
 <Worksheet ss:Name="Resultados ${sheetNumber}"><Table>${headerRow}`);

    for (const row of statement.iterate(query.values)) {
        if (res.destroyed) {
            return;
        }

        if (rowCount > 0 && rowCount % rowsPerSheet === 0) {
            sheetNumber += 1;
            await writeResponseChunk(res, `</Table></Worksheet><Worksheet ss:Name="Resultados ${sheetNumber}"><Table>${headerRow}`);
        }

        const cells = [
            row.RAZAO_SOCIAL,
            row.NOME_FANTASIA,
            row.MUNICIPIO_DESCRICAO,
            row.UF,
            formatExportPhone(row),
            row.CNAE_FISCAL_PRINCIPAL,
            row.CNAE_FISCAL_PRINCIPAL_DESCRICAO,
            formatExportDate(row.DATA_INICIO_ATIVIDADE),
            row.PORTE_EMPRESA,
            row.CNPJ
        ];

        await writeResponseChunk(res, `<Row>${cells.map((value) => spreadsheetCell(value)).join('')}</Row>`);
        rowCount += 1;
    }

    res.end('</Table></Worksheet></Workbook>');
}

function searchCompanies(req, res, url) {
    const start = Date.now();

    if (url.searchParams.has('draw')) {
        searchCompaniesDataTable(res, url, start);
        return;
    }

    const query = buildSearch(url);
    const rows = db.prepare(query.sql).all(query.values);

    json(res, 200, {
        elapsedMs: Date.now() - start,
        limit: query.limit,
        offset: query.offset,
        count: rows.length,
        rows
    });
}

function searchCompaniesDataTable(res, url, start) {
    const draw = Math.max(0, Number(url.searchParams.get('draw') || 0));
    const query = buildDataTablesSearch(url);
    const rows = db.prepare(query.sql).all(query.values);
    const hasMore = rows.length > query.limit;
    const data = hasMore ? rows.slice(0, query.limit) : rows;
    const knownRecords = query.offset + data.length + (hasMore ? 1 : 0);

    json(res, 200, {
        draw,
        recordsTotal: knownRecords,
        recordsFiltered: knownRecords,
        data,
        elapsedMs: Date.now() - start,
        exactCount: false,
        hasMore,
        pageSize: query.limit,
        offset: query.offset
    });
}

function health(res) {
    const counts = db.prepare(`
        SELECT
            (SELECT COUNT(*) FROM EMPRESAS) AS empresas,
            (SELECT COUNT(*) FROM ESTABELECIMENTOS) AS estabelecimentos,
            (SELECT COUNT(*) FROM SIMPLES) AS simples
    `).get();

    json(res, 200, {
        ok: true,
        database: bancoPath,
        counts
    });
}

function listMunicipiosHandler(res, url) {
    const uf = url.searchParams.get('uf');
    const q = url.searchParams.get('q');
    json(res, 200, listMunicipios(uf, q));
}

function listCnaesHandler(res, url) {
    const q = url.searchParams.get('q');
    json(res, 200, listCnaes(q));
}

function serveStatic(res, pathname) {
    const requested = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.normalize(path.join(frontendDir, requested));

    if (!filePath.startsWith(frontendDir)) {
        json(res, 403, { error: 'Acesso negado.' });
        return;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        json(res, 404, { error: 'Arquivo nao encontrado.' });
        return;
    }

    const ext = path.extname(filePath);

    res.writeHead(200, {
        'Content-Type': contentTypes[ext] || 'application/octet-stream'
    });

    fs.createReadStream(filePath).pipe(res);
}

async function handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    try {
        if (url.pathname === '/api/health') {
            health(res);
            return;
        }

        if (url.pathname === '/api/auth/login') {
            await authLoginHandler(req, res);
            return;
        }

        if (url.pathname === '/api/auth/session') {
            await authSessionHandler(req, res);
            return;
        }

        if (url.pathname === '/api/auth/logout') {
            await authLogoutHandler(req, res);
            return;
        }

        if (url.pathname === '/api/dashboard') {
            if (!requireAuth(req, res, 'dashboard-crm')) {
                return;
            }
            dashboardHandler(req, res, url);
            return;
        }

        if (url.pathname === '/api/admin/resumo') {
            await adminResumoHandler(req, res);
            return;
        }

        if (url.pathname === '/api/admin/acesso') {
            await adminAcessoHandler(req, res);
            return;
        }

        if (url.pathname === '/api/admin/usuarios') {
            await adminUsuariosHandler(req, res, url);
            return;
        }

        if (url.pathname === '/api/empresas') {
            if (!requireAuth(req, res, 'pesquisa-geral')) {
                return;
            }
            searchCompanies(req, res, url);
            return;
        }

        if (url.pathname === '/api/empresas/exportar.xls') {
            if (!requireAuth(req, res, 'exportacao-empresas')) {
                return;
            }
            await exportCompaniesXls(req, res);
            return;
        }

        if (url.pathname === '/api/empresas/flag') {
            if (!requireAuth(req, res, 'marcar-empresa-prioritaria')) {
                return;
            }
            await empresaFlagHandler(req, res);
            return;
        }

        if (url.pathname === '/api/municipios') {
            if (!requireAuth(req, res, 'pesquisa-avancada')) {
                return;
            }
            listMunicipiosHandler(res, url);
            return;
        }

        if (url.pathname === '/api/cnaes') {
            if (!requireAuth(req, res, 'pesquisa-avancada')) {
                return;
            }
            listCnaesHandler(res, url);
            return;
        }

        if (url.pathname === '/api/prospeccoes') {
            if (!requireAuth(req, res, 'registrar-historico-contato')) {
                return;
            }
            await prospeccaoHandler(req, res, url);
            return;
        }

        if (url.pathname === '/api/prospeccoes/situacao') {
            if (!requireAuth(req, res, 'registrar-historico-contato')) {
                return;
            }
            await prospeccaoSituacaoHandler(req, res);
            return;
        }

        if (url.pathname === '/api/importacoes') {
            if (!requireAuth(req, res, 'importacao-empresas')) {
                return;
            }
            await importacoesHandler(req, res, url);
            return;
        }

        if (url.pathname === '/api/importacoes/erros') {
            if (!requireAuth(req, res, 'importacao-empresas')) {
                return;
            }
            importacaoErrosHandler(res, url);
            return;
        }

        if (url.pathname === '/api/empresas-importadas') {
            if (!requireAuth(req, res, 'cadastrar-nova-empresa')) {
                return;
            }
            await cadastroEmpresaImportadaHandler(req, res);
            return;
        }

        serveStatic(res, url.pathname);
    } catch (error) {
        json(res, 500, {
            error: error.message
        });
    }
}

function closeDatabases() {
    db.close();
    prospeccoesDb.close();
    importacaoDb.close();
}

let server;

if (require.main === module) {
    server = http.createServer(handleRequest);

    server.listen(port, () => {
        console.log(`LeadBenefits CRM rodando em http://localhost:${port}`);
    });

    process.on('SIGINT', () => {
        closeDatabases();
        server.close(() => process.exit(0));
    });
}

module.exports = {
    handleRequest,
    closeDatabases
};
