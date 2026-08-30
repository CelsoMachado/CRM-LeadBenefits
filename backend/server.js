const http = require('http');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');
const { once } = require('events');

const Database = require('better-sqlite3');
let XLSX;

try {
    XLSX = require('xlsx');
} catch {
    XLSX = null;
}

const projectDir = path.resolve(__dirname, '..');
const legacyRootDir = path.resolve(__dirname, '..', '..');
const frontendDir = path.resolve(__dirname, '..', 'frontend');
const dataDir = process.env.LEADBENEFITS_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || projectDir;
const defaultBancoPath = fs.existsSync(path.join(projectDir, 'LeadBenefits.sqlite'))
    ? path.join(projectDir, 'LeadBenefits.sqlite')
    : path.join(legacyRootDir, 'LeadBenefits.sqlite');
const bancoPath = process.env.LEADBENEFITS_DB || defaultBancoPath;
const prospeccoesPath = process.env.LEADBENEFITS_PROSPECCOES_DB || path.join(dataDir, 'prospeccoes.sqlite');
const importacaoPath = process.env.LEADBENEFITS_IMPORTACAO_DB || path.join(dataDir, 'CRM_importacao.sqlite');
const port = Number(process.env.PORT || 3000);

function ensureDatabaseDirectory(databasePath) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

function prepareWritableDatabase(databasePath, bundledFileName) {
    ensureDatabaseDirectory(databasePath);

    const bundledPath = path.join(projectDir, bundledFileName);
    const resolvedDatabasePath = path.resolve(databasePath);
    const resolvedBundledPath = path.resolve(bundledPath);

    if (
        resolvedDatabasePath !== resolvedBundledPath
        && !fs.existsSync(resolvedDatabasePath)
        && fs.existsSync(resolvedBundledPath)
    ) {
        fs.copyFileSync(resolvedBundledPath, resolvedDatabasePath);
    }
}

prepareWritableDatabase(prospeccoesPath, 'prospeccoes.sqlite');
prepareWritableDatabase(importacaoPath, 'CRM_importacao.sqlite');

const db = fs.existsSync(bancoPath)
    ? new Database(bancoPath, { readonly: true, fileMustExist: true })
    : null;
const prospeccoesDb = new Database(prospeccoesPath);
const importacaoDb = new Database(importacaoPath);

if (db) {
    db.pragma('query_only = ON');
} else {
    console.warn(`Banco principal nao encontrado em ${bancoPath}. Rotas de pesquisa ficarao indisponiveis.`);
}
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

if (db) {
    db.prepare('ATTACH DATABASE ? AS crm').run(prospeccoesPath);
}

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

function json(res, status, body) {
    const data = JSON.stringify(body);

    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data)
    });

    res.end(data);
}

function requireMainDatabase(res) {
    if (db) {
        return true;
    }

    json(res, 503, {
        error: 'Banco principal LeadBenefits.sqlite nao encontrado no servidor.',
        database: bancoPath,
        hint: 'Envie o arquivo para o deploy/volume ou configure LEADBENEFITS_DB com o caminho correto.'
    });
    return false;
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

    if (!requireMainDatabase(res)) {
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

    if (!requireMainDatabase(res)) {
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
    if (!requireMainDatabase(res)) {
        return;
    }

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
    const counts = db
        ? db.prepare(`
            SELECT
                (SELECT COUNT(*) FROM EMPRESAS) AS empresas,
                (SELECT COUNT(*) FROM ESTABELECIMENTOS) AS estabelecimentos,
                (SELECT COUNT(*) FROM SIMPLES) AS simples
        `).get()
        : null;

    json(res, 200, {
        ok: true,
        database: bancoPath,
        databaseAvailable: Boolean(db),
        writableDatabases: {
            prospeccoes: prospeccoesPath,
            importacao: importacaoPath
        },
        counts
    });
}

function listMunicipiosHandler(res, url) {
    if (!requireMainDatabase(res)) {
        return;
    }

    const uf = url.searchParams.get('uf');
    const q = url.searchParams.get('q');
    json(res, 200, listMunicipios(uf, q));
}

function listCnaesHandler(res, url) {
    if (!requireMainDatabase(res)) {
        return;
    }

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

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    try {
        if (url.pathname === '/api/health') {
            health(res);
            return;
        }

        if (url.pathname === '/api/dashboard') {
            dashboardHandler(req, res, url);
            return;
        }

        if (url.pathname === '/api/empresas') {
            searchCompanies(req, res, url);
            return;
        }

        if (url.pathname === '/api/empresas/exportar.xls') {
            await exportCompaniesXls(req, res);
            return;
        }

        if (url.pathname === '/api/empresas/flag') {
            await empresaFlagHandler(req, res);
            return;
        }

        if (url.pathname === '/api/municipios') {
            listMunicipiosHandler(res, url);
            return;
        }

        if (url.pathname === '/api/cnaes') {
            listCnaesHandler(res, url);
            return;
        }

        if (url.pathname === '/api/prospeccoes') {
            await prospeccaoHandler(req, res, url);
            return;
        }

        if (url.pathname === '/api/prospeccoes/situacao') {
            await prospeccaoSituacaoHandler(req, res);
            return;
        }

        if (url.pathname === '/api/importacoes') {
            await importacoesHandler(req, res, url);
            return;
        }

        if (url.pathname === '/api/importacoes/erros') {
            importacaoErrosHandler(res, url);
            return;
        }

        if (url.pathname === '/api/empresas-importadas') {
            await cadastroEmpresaImportadaHandler(req, res);
            return;
        }

        serveStatic(res, url.pathname);
    } catch (error) {
        json(res, 500, {
            error: error.message
        });
    }
});

server.listen(port, () => {
    console.log(`LeadBenefits CRM rodando em http://localhost:${port}`);
});

process.on('SIGINT', () => {
    if (db) {
        db.close();
    }
    prospeccoesDb.close();
    importacaoDb.close();
    server.close(() => process.exit(0));
});
