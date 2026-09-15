const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SESSION_COOKIE_NAME = 'lb_session';
const DEFAULT_SESSION_HOURS = 8;
const PASSWORD_COST = Number(process.env.LEADBENEFITS_PASSWORD_COST || 12);

const profilePermissions = Object.freeze({
    ADMINISTRADOR: 'ORG_ADMIN',
    SUPERVISOR: [
        'DASHBOARD_VISUALIZAR',
        'AGENDA_VISUALIZAR',
        'AGENDA_CONTATO_REGISTRAR',
        'EMPRESA_VISUALIZAR',
        'EMPRESA_CADASTRAR',
        'EMPRESA_FLAG_ALTERAR',
        'EMPRESA_EXPORTAR',
        'PESQUISA_AVANCADA',
        'PESQUISA_RFB',
        'USUARIO_VISUALIZAR',
        'PERFIL_VISUALIZAR',
        'PERMISSAO_VISUALIZAR'
    ],
    CONSULTOR: [
        'DASHBOARD_VISUALIZAR',
        'AGENDA_VISUALIZAR',
        'AGENDA_CONTATO_REGISTRAR',
        'EMPRESA_VISUALIZAR',
        'EMPRESA_FLAG_ALTERAR',
        'PESQUISA_AVANCADA',
        'PESQUISA_RFB'
    ],
    CONSULTA: [
        'DASHBOARD_VISUALIZAR',
        'AGENDA_VISUALIZAR',
        'EMPRESA_VISUALIZAR',
        'PESQUISA_AVANCADA',
        'PESQUISA_RFB'
    ]
});

function nowIso() {
    return new Date().toISOString();
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('base64url');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function hashPassword(password) {
    return bcrypt.hash(String(password), PASSWORD_COST);
}

function verifyPassword(password, passwordHash) {
    return bcrypt.compare(String(password), String(passwordHash || ''));
}

function parseCookies(req) {
    const header = String(req.headers.cookie || '');
    const cookies = {};

    for (const part of header.split(';')) {
        const [rawName, ...rawValue] = part.trim().split('=');

        if (!rawName) {
            continue;
        }

        cookies[rawName] = decodeURIComponent(rawValue.join('=') || '');
    }

    return cookies;
}

function getClientIp(req) {
    return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .split(',')
        .shift()
        .trim();
}

function sessionDurationMs() {
    const hours = Number(process.env.LEADBENEFITS_SESSION_HOURS || DEFAULT_SESSION_HOURS);
    const safeHours = Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_SESSION_HOURS;
    return safeHours * 60 * 60 * 1000;
}

function isOrganizationPermission(feature) {
    const moduleName = String(feature.module || '').toUpperCase();
    const code = String(feature.code || '').toUpperCase();

    return !moduleName.includes('SUPORTE')
        && !moduleName.includes('PLATAFORMA')
        && !code.startsWith('SUPORTE_')
        && !code.startsWith('SUPERADMIN_')
        && !code.startsWith('PLATAFORMA_');
}

function buildSessionCookie(token, expiresAt) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

    return [
        `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        secure.replace(/^; /, ''),
        `Expires=${expiresAt.toUTCString()}`
    ].filter(Boolean).join('; ');
}

function buildClearSessionCookie() {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

    return [
        `${SESSION_COOKIE_NAME}=`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        secure.replace(/^; /, ''),
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ].filter(Boolean).join('; ');
}

function initAuthDatabase(adminDb, featureCatalog) {
    adminDb.pragma('foreign_keys = ON');
    adminDb.pragma('journal_mode = WAL');

    const migrate = adminDb.transaction(() => {
        adminDb.exec(`
            CREATE TABLE IF NOT EXISTS ORGANIZACOES (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                nome_fantasia TEXT,
                documento TEXT,
                status TEXT NOT NULL DEFAULT 'ATIVA' CHECK (status IN ('ATIVA', 'INATIVA', 'SUSPENSA')),
                timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
                criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE UNIQUE INDEX IF NOT EXISTS IDX_ORGANIZACOES_DOCUMENTO
                ON ORGANIZACOES (documento)
                WHERE documento IS NOT NULL AND documento <> '';

            CREATE INDEX IF NOT EXISTS IDX_ORGANIZACOES_STATUS
                ON ORGANIZACOES (status);

            CREATE TABLE IF NOT EXISTS PERFIS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                organizacao_id INTEGER NOT NULL,
                codigo TEXT NOT NULL,
                nome TEXT NOT NULL,
                descricao TEXT,
                status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
                criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organizacao_id) REFERENCES ORGANIZACOES (id)
            );

            CREATE UNIQUE INDEX IF NOT EXISTS IDX_PERFIS_ORG_CODIGO
                ON PERFIS (organizacao_id, codigo);

            CREATE UNIQUE INDEX IF NOT EXISTS IDX_PERFIS_ID_ORG
                ON PERFIS (id, organizacao_id);

            CREATE TABLE IF NOT EXISTS PERMISSOES (
                codigo TEXT PRIMARY KEY,
                status TEXT NOT NULL DEFAULT 'ATIVA' CHECK (status IN ('ATIVA', 'INATIVA')),
                criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS PERFIL_PERMISSOES (
                perfil_id INTEGER NOT NULL,
                permissao_codigo TEXT NOT NULL,
                criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (perfil_id, permissao_codigo),
                FOREIGN KEY (perfil_id) REFERENCES PERFIS (id) ON DELETE CASCADE,
                FOREIGN KEY (permissao_codigo) REFERENCES PERMISSOES (codigo)
            );

            CREATE INDEX IF NOT EXISTS IDX_PERFIL_PERMISSOES_CODIGO
                ON PERFIL_PERMISSOES (permissao_codigo);

            CREATE TABLE IF NOT EXISTS USUARIOS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                organizacao_id INTEGER,
                perfil_id INTEGER,
                nome TEXT NOT NULL,
                email TEXT NOT NULL,
                senha_hash TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO', 'BLOQUEADO')),
                exigir_troca_senha INTEGER NOT NULL DEFAULT 0 CHECK (exigir_troca_senha IN (0, 1)),
                tentativas_login INTEGER NOT NULL DEFAULT 0,
                bloqueado_ate TEXT,
                ultimo_login_em TEXT,
                senha_alterada_em TEXT,
                criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organizacao_id) REFERENCES ORGANIZACOES (id),
                FOREIGN KEY (perfil_id, organizacao_id) REFERENCES PERFIS (id, organizacao_id)
            );

            CREATE UNIQUE INDEX IF NOT EXISTS IDX_USUARIOS_EMAIL
                ON USUARIOS (email);

            CREATE INDEX IF NOT EXISTS IDX_USUARIOS_ORG_STATUS
                ON USUARIOS (organizacao_id, status);

            CREATE TABLE IF NOT EXISTS SESSOES (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                sessao_hash TEXT NOT NULL UNIQUE,
                suporte_acesso_id INTEGER,
                ip TEXT,
                user_agent TEXT,
                criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ultimo_uso_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expira_em TEXT NOT NULL,
                revogado_em TEXT,
                FOREIGN KEY (usuario_id) REFERENCES USUARIOS (id),
                FOREIGN KEY (suporte_acesso_id) REFERENCES SUPORTE_ACESSOS (id)
            );

            CREATE INDEX IF NOT EXISTS IDX_SESSOES_USUARIO
                ON SESSOES (usuario_id);

            CREATE INDEX IF NOT EXISTS IDX_SESSOES_EXPIRA
                ON SESSOES (expira_em);

            CREATE TABLE IF NOT EXISTS RESET_SENHA_TOKENS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expira_em TEXT NOT NULL,
                usado_em TEXT,
                ip_solicitante TEXT,
                FOREIGN KEY (usuario_id) REFERENCES USUARIOS (id)
            );

            CREATE INDEX IF NOT EXISTS IDX_RESET_SENHA_USUARIO
                ON RESET_SENHA_TOKENS (usuario_id);

            CREATE INDEX IF NOT EXISTS IDX_RESET_SENHA_EXPIRA
                ON RESET_SENHA_TOKENS (expira_em);

            CREATE TABLE IF NOT EXISTS SUPORTE_ACESSOS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                suporte_usuario_id INTEGER NOT NULL,
                organizacao_id INTEGER NOT NULL,
                motivo TEXT NOT NULL,
                aprovado_por_usuario_id INTEGER,
                iniciado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expira_em TEXT NOT NULL,
                encerrado_em TEXT,
                correlation_id TEXT,
                FOREIGN KEY (suporte_usuario_id) REFERENCES USUARIOS (id),
                FOREIGN KEY (organizacao_id) REFERENCES ORGANIZACOES (id),
                FOREIGN KEY (aprovado_por_usuario_id) REFERENCES USUARIOS (id)
            );

            CREATE INDEX IF NOT EXISTS IDX_SUPORTE_ACESSOS_ORG
                ON SUPORTE_ACESSOS (organizacao_id);

            CREATE INDEX IF NOT EXISTS IDX_SUPORTE_ACESSOS_USUARIO
                ON SUPORTE_ACESSOS (suporte_usuario_id);

            CREATE INDEX IF NOT EXISTS IDX_SUPORTE_ACESSOS_EXPIRA
                ON SUPORTE_ACESSOS (expira_em);

            CREATE TABLE IF NOT EXISTS AUDITORIA_SEGURANCA (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data_hora TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                evento TEXT NOT NULL,
                resultado TEXT NOT NULL,
                correlation_id TEXT,
                app_version TEXT,
                usuario_id INTEGER,
                organizacao_id INTEGER,
                email TEXT,
                rota TEXT,
                metodo TEXT,
                ip TEXT,
                user_agent TEXT,
                detalhes TEXT,
                FOREIGN KEY (usuario_id) REFERENCES USUARIOS (id),
                FOREIGN KEY (organizacao_id) REFERENCES ORGANIZACOES (id)
            );

            CREATE INDEX IF NOT EXISTS IDX_AUDITORIA_SEGURANCA_DATA
                ON AUDITORIA_SEGURANCA (data_hora);

            CREATE INDEX IF NOT EXISTS IDX_AUDITORIA_SEGURANCA_USUARIO
                ON AUDITORIA_SEGURANCA (usuario_id);
        `);

        const org = ensureOrganization(adminDb, {
            nome: 'Wlasena',
            nomeFantasia: 'Wlasena',
            timezone: 'America/Sao_Paulo',
            status: 'ATIVA'
        });

        for (const feature of featureCatalog) {
            adminDb.prepare(`
                INSERT INTO PERMISSOES (codigo, status)
                VALUES (?, 'ATIVA')
                ON CONFLICT(codigo) DO UPDATE SET
                    status = 'ATIVA',
                    atualizado_em = CURRENT_TIMESTAMP
            `).run(feature.code);
        }

        const profiles = [
            ['ADMINISTRADOR', 'Administrador', 'Administra a propria organizacao.'],
            ['SUPERVISOR', 'Supervisor', 'Acompanha a operacao comercial e acessa leituras administrativas.'],
            ['CONSULTOR', 'Consultor / Vendedor', 'Trabalha com agenda, empresas atribuidas e contatos.'],
            ['CONSULTA', 'Consulta', 'Acesso de leitura onde permitido.']
        ];

        for (const [codigo, nome, descricao] of profiles) {
            adminDb.prepare(`
                INSERT INTO PERFIS (organizacao_id, codigo, nome, descricao, status)
                VALUES (?, ?, ?, ?, 'ATIVO')
                ON CONFLICT(organizacao_id, codigo) DO UPDATE SET
                    nome = excluded.nome,
                    descricao = excluded.descricao,
                    status = 'ATIVO',
                    atualizado_em = CURRENT_TIMESTAMP
            `).run(org.id, codigo, nome, descricao);
        }

        syncProfilePermissions(adminDb, org.id, featureCatalog);
    });

    migrate();
}

function ensureOrganization(adminDb, data) {
    const existing = adminDb.prepare('SELECT * FROM ORGANIZACOES WHERE nome = ? LIMIT 1').get(data.nome);

    if (existing) {
        return existing;
    }

    const result = adminDb.prepare(`
        INSERT INTO ORGANIZACOES (nome, nome_fantasia, timezone, status)
        VALUES (?, ?, ?, ?)
    `).run(data.nome, data.nomeFantasia || null, data.timezone, data.status);

    return adminDb.prepare('SELECT * FROM ORGANIZACOES WHERE id = ?').get(result.lastInsertRowid);
}

function syncProfilePermissions(adminDb, organizacaoId, featureCatalog) {
    const allCodes = featureCatalog.map((feature) => feature.code);
    const profiles = adminDb
        .prepare('SELECT id, codigo FROM PERFIS WHERE organizacao_id = ?')
        .all(organizacaoId);
    const insert = adminDb.prepare(`
        INSERT OR IGNORE INTO PERFIL_PERMISSOES (perfil_id, permissao_codigo)
        VALUES (?, ?)
    `);
    const remove = adminDb.prepare('DELETE FROM PERFIL_PERMISSOES WHERE perfil_id = ? AND permissao_codigo = ?');

    for (const profile of profiles) {
        const allowed = profilePermissions[profile.codigo] === 'ORG_ADMIN'
            ? featureCatalog.filter(isOrganizationPermission).map((feature) => feature.code)
            : profilePermissions[profile.codigo] || [];
        const allowedSet = new Set(allowed);
        const current = adminDb
            .prepare('SELECT permissao_codigo FROM PERFIL_PERMISSOES WHERE perfil_id = ?')
            .all(profile.id)
            .map((row) => row.permissao_codigo);

        for (const code of allCodes) {
            if (allowedSet.has(code)) {
                insert.run(profile.id, code);
            }
        }

        for (const code of current) {
            if (!allowedSet.has(code)) {
                remove.run(profile.id, code);
            }
        }
    }
}

function auditSecurity(adminDb, context, event) {
    adminDb.prepare(`
        INSERT INTO AUDITORIA_SEGURANCA (
            evento,
            resultado,
            correlation_id,
            app_version,
            usuario_id,
            organizacao_id,
            email,
            rota,
            metodo,
            ip,
            user_agent,
            detalhes
        )
        VALUES (
            @evento,
            @resultado,
            @correlationId,
            @appVersion,
            @usuarioId,
            @organizacaoId,
            @email,
            @rota,
            @metodo,
            @ip,
            @userAgent,
            @detalhes
        )
    `).run({
        evento: event.evento,
        resultado: event.resultado,
        correlationId: context?.correlationId || null,
        appVersion: context?.appVersion || null,
        usuarioId: event.usuarioId || null,
        organizacaoId: event.organizacaoId || null,
        email: normalizeEmail(event.email),
        rota: context?.route || null,
        metodo: context?.method || null,
        ip: event.ip || context?.ip || null,
        userAgent: event.userAgent || context?.userAgent || null,
        detalhes: event.detalhes ? JSON.stringify(event.detalhes) : null
    });
}

function publicUser(row, permissions = []) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        nome: row.nome,
        email: row.email,
        status: row.status,
        organizacao: {
            id: row.organizacao_id,
            nome: row.organizacao_nome,
            timezone: row.timezone
        },
        perfil: {
            id: row.perfil_id,
            codigo: row.perfil_codigo,
            nome: row.perfil_nome
        },
        exigirTrocaSenha: Boolean(row.exigir_troca_senha),
        permissions
    };
}

function getPermissionsForProfile(adminDb, perfilId) {
    return adminDb.prepare(`
        SELECT permissao_codigo
        FROM PERFIL_PERMISSOES
        WHERE perfil_id = ?
        ORDER BY permissao_codigo
    `).all(perfilId).map((row) => row.permissao_codigo);
}

function getUserByEmail(adminDb, email) {
    return adminDb.prepare(`
        SELECT
            u.*,
            o.nome AS organizacao_nome,
            o.timezone,
            o.status AS organizacao_status,
            p.codigo AS perfil_codigo,
            p.nome AS perfil_nome,
            p.status AS perfil_status
        FROM USUARIOS u
        LEFT JOIN ORGANIZACOES o ON o.id = u.organizacao_id
        LEFT JOIN PERFIS p ON p.id = u.perfil_id
        WHERE u.email = ?
        LIMIT 1
    `).get(normalizeEmail(email));
}

function getUserBySession(adminDb, sessionHash) {
    return adminDb.prepare(`
        SELECT
            s.id AS sessao_id,
            s.expira_em,
            s.revogado_em,
            u.*,
            o.nome AS organizacao_nome,
            o.timezone,
            o.status AS organizacao_status,
            p.codigo AS perfil_codigo,
            p.nome AS perfil_nome,
            p.status AS perfil_status
        FROM SESSOES s
        JOIN USUARIOS u ON u.id = s.usuario_id
        LEFT JOIN ORGANIZACOES o ON o.id = u.organizacao_id
        LEFT JOIN PERFIS p ON p.id = u.perfil_id
        WHERE s.sessao_hash = ?
        LIMIT 1
    `).get(sessionHash);
}

function isIsoInFuture(value) {
    return Boolean(value) && new Date(value).getTime() > Date.now();
}

function isSessionValid(row) {
    return row
        && !row.revogado_em
        && isIsoInFuture(row.expira_em)
        && row.status === 'ATIVO'
        && row.organizacao_status === 'ATIVA'
        && row.perfil_status === 'ATIVO';
}

async function login(adminDb, req, body, context) {
    const email = normalizeEmail(body.email || body.login);
    const password = String(body.password || body.senha || '');
    const user = getUserByEmail(adminDb, email);
    const auditContext = {
        ...context,
        ip: getClientIp(req),
        userAgent: String(req.headers['user-agent'] || '')
    };

    if (!user) {
        auditSecurity(adminDb, auditContext, {
            evento: 'LOGIN_FALHO',
            resultado: 'FALHA',
            email,
            detalhes: { motivo: 'USUARIO_INEXISTENTE' }
        });
        return { ok: false, status: 401, message: 'E-mail ou senha invalidos.' };
    }

    if (user.status !== 'ATIVO' || user.organizacao_status !== 'ATIVA' || user.perfil_status !== 'ATIVO') {
        auditSecurity(adminDb, auditContext, {
            evento: 'LOGIN_BLOQUEADO',
            resultado: 'FALHA',
            usuarioId: user.id,
            organizacaoId: user.organizacao_id,
            email,
            detalhes: {
                usuarioStatus: user.status,
                organizacaoStatus: user.organizacao_status,
                perfilStatus: user.perfil_status
            }
        });
        return { ok: false, status: 403, message: 'Usuario inativo ou sem acesso.' };
    }

    if (isIsoInFuture(user.bloqueado_ate)) {
        auditSecurity(adminDb, auditContext, {
            evento: 'LOGIN_BLOQUEADO',
            resultado: 'FALHA',
            usuarioId: user.id,
            organizacaoId: user.organizacao_id,
            email,
            detalhes: { motivo: 'BLOQUEIO_TEMPORARIO' }
        });
        return { ok: false, status: 403, message: 'Usuario temporariamente bloqueado.' };
    }

    if (!(await verifyPassword(password, user.senha_hash))) {
        const attempts = Number(user.tentativas_login || 0) + 1;
        const maxAttemptsConfig = Number(process.env.LEADBENEFITS_LOGIN_MAX_ATTEMPTS || 5);
        const lockMinutesConfig = Number(process.env.LEADBENEFITS_LOGIN_LOCK_MINUTES || 15);
        const maxAttempts = Number.isFinite(maxAttemptsConfig) && maxAttemptsConfig > 0 ? maxAttemptsConfig : 5;
        const lockMinutes = Number.isFinite(lockMinutesConfig) && lockMinutesConfig > 0 ? lockMinutesConfig : 15;
        const blockedUntil = attempts >= maxAttempts
            ? new Date(Date.now() + lockMinutes * 60 * 1000).toISOString()
            : null;

        adminDb.prepare(`
            UPDATE USUARIOS
            SET
                tentativas_login = ?,
                bloqueado_ate = ?,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(attempts, blockedUntil, user.id);

        auditSecurity(adminDb, auditContext, {
            evento: blockedUntil ? 'LOGIN_BLOQUEADO' : 'LOGIN_FALHO',
            resultado: 'FALHA',
            usuarioId: user.id,
            organizacaoId: user.organizacao_id,
            email,
            detalhes: { tentativasLogin: attempts }
        });
        return { ok: false, status: 401, message: 'E-mail ou senha invalidos.' };
    }

    const token = randomToken();
    const sessionHash = hashToken(token);
    const expiresAt = new Date(Date.now() + sessionDurationMs());
    const previousToken = parseCookies(req)[SESSION_COOKIE_NAME];

    if (previousToken) {
        adminDb.prepare(`
            UPDATE SESSOES
            SET revogado_em = ?
            WHERE sessao_hash = ? AND revogado_em IS NULL
        `).run(nowIso(), hashToken(previousToken));
    }

    adminDb.prepare(`
        INSERT INTO SESSOES (
            usuario_id,
            sessao_hash,
            ip,
            user_agent,
            expira_em
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(user.id, sessionHash, auditContext.ip, auditContext.userAgent, expiresAt.toISOString());

    adminDb.prepare(`
        UPDATE USUARIOS
        SET
            tentativas_login = 0,
            bloqueado_ate = NULL,
            ultimo_login_em = ?,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(nowIso(), user.id);

    auditSecurity(adminDb, auditContext, {
        evento: 'LOGIN_SUCESSO',
        resultado: 'SUCESSO',
        usuarioId: user.id,
        organizacaoId: user.organizacao_id,
        email
    });

    const permissions = getPermissionsForProfile(adminDb, user.perfil_id);

    return {
        ok: true,
        token,
        expiresAt,
        user: publicUser(user, permissions)
    };
}

function getAuthContext(adminDb, req) {
    const token = parseCookies(req)[SESSION_COOKIE_NAME];

    if (!token) {
        return null;
    }

    const sessionHash = hashToken(token);
    const row = getUserBySession(adminDb, sessionHash);

    if (!isSessionValid(row)) {
        return null;
    }

    const permissions = getPermissionsForProfile(adminDb, row.perfil_id);

    adminDb.prepare('UPDATE SESSOES SET ultimo_uso_em = ? WHERE id = ?').run(nowIso(), row.sessao_id);

    return {
        sessionId: row.sessao_id,
        usuarioId: row.id,
        organizacaoId: row.organizacao_id,
        perfilCodigo: row.perfil_codigo,
        permissions: new Set(permissions),
        user: publicUser(row, permissions)
    };
}

function logout(adminDb, req, authContext, context) {
    if (authContext?.sessionId) {
        adminDb.prepare('UPDATE SESSOES SET revogado_em = ? WHERE id = ?').run(nowIso(), authContext.sessionId);
        auditSecurity(adminDb, {
            ...context,
            ip: getClientIp(req),
            userAgent: String(req.headers['user-agent'] || '')
        }, {
            evento: 'LOGOUT',
            resultado: 'SUCESSO',
            usuarioId: authContext.usuarioId,
            organizacaoId: authContext.organizacaoId,
            email: authContext.user?.email
        });
    }
}

function hasPermission(authContext, permissionCode) {
    return Boolean(authContext?.permissions?.has(permissionCode));
}

function listUsers(adminDb, organizacaoId) {
    return adminDb.prepare(`
        SELECT
            u.id,
            u.nome,
            u.email,
            u.status,
            u.exigir_troca_senha,
            u.ultimo_login_em,
            u.criado_em,
            u.atualizado_em,
            p.codigo AS perfil_codigo,
            p.nome AS perfil_nome
        FROM USUARIOS u
        LEFT JOIN PERFIS p ON p.id = u.perfil_id
        WHERE u.organizacao_id = ?
        ORDER BY u.nome, u.email
    `).all(organizacaoId).map((row) => ({
        id: row.id,
        nome: row.nome,
        email: row.email,
        status: row.status,
        exigirTrocaSenha: Boolean(row.exigir_troca_senha),
        ultimoLoginEm: row.ultimo_login_em,
        criadoEm: row.criado_em,
        atualizadoEm: row.atualizado_em,
        perfil: {
            codigo: row.perfil_codigo,
            nome: row.perfil_nome
        }
    }));
}

function listProfiles(adminDb, organizacaoId) {
    return adminDb.prepare(`
        SELECT id, codigo, nome, descricao, status
        FROM PERFIS
        WHERE organizacao_id = ?
        ORDER BY codigo
    `).all(organizacaoId);
}

function listPermissions(adminDb, featureCatalog) {
    const statuses = new Map(
        adminDb.prepare('SELECT codigo, status FROM PERMISSOES').all().map((row) => [row.codigo, row.status])
    );

    return featureCatalog.map((feature) => ({
        code: feature.code,
        name: feature.name,
        description: feature.description,
        module: feature.module,
        status: statuses.get(feature.code) || 'ATIVA'
    }));
}

async function createUser(adminDb, data, actorContext, requestContext) {
    const nome = String(data.nome || '').trim();
    const email = normalizeEmail(data.email || data.login);
    const password = String(data.password || data.senha || '');
    const perfilCodigo = String(data.perfilCodigo || data.perfil || '').trim().toUpperCase();
    const status = ['ATIVO', 'INATIVO'].includes(String(data.status || '').toUpperCase())
        ? String(data.status).toUpperCase()
        : 'ATIVO';

    if (!nome || !email || !password || !perfilCodigo) {
        return { ok: false, status: 400, message: 'Nome, e-mail, senha e perfil sao obrigatorios.' };
    }

    if (getUserByEmail(adminDb, email)) {
        return { ok: false, status: 409, message: 'Usuario ja cadastrado.' };
    }

    const profile = adminDb.prepare(`
        SELECT id
        FROM PERFIS
        WHERE organizacao_id = ? AND codigo = ? AND status = 'ATIVO'
        LIMIT 1
    `).get(actorContext.organizacaoId, perfilCodigo);

    if (!profile) {
        return { ok: false, status: 400, message: 'Perfil invalido para a organizacao.' };
    }

    const passwordHash = await hashPassword(password);
    const result = adminDb.prepare(`
        INSERT INTO USUARIOS (
            organizacao_id,
            perfil_id,
            nome,
            email,
            senha_hash,
            status,
            exigir_troca_senha,
            senha_alterada_em
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        actorContext.organizacaoId,
        profile.id,
        nome,
        email,
        passwordHash,
        status,
        data.exigirTrocaSenha ? 1 : 0,
        nowIso()
    );

    auditSecurity(adminDb, requestContext, {
        evento: 'USUARIO_ADMINISTRATIVO_CRIADO',
        resultado: 'SUCESSO',
        usuarioId: actorContext.usuarioId,
        organizacaoId: actorContext.organizacaoId,
        email,
        detalhes: {
            usuarioCriadoId: result.lastInsertRowid,
            perfilCodigo,
            status
        }
    });

    return {
        ok: true,
        user: listUsers(adminDb, actorContext.organizacaoId).find((user) => user.id === result.lastInsertRowid)
    };
}

module.exports = {
    SESSION_COOKIE_NAME,
    PASSWORD_COST,
    auditSecurity,
    buildClearSessionCookie,
    buildSessionCookie,
    createUser,
    getAuthContext,
    hasPermission,
    hashPassword,
    initAuthDatabase,
    listPermissions,
    listProfiles,
    listUsers,
    login,
    logout,
    normalizeEmail,
    profilePermissions,
    randomToken,
    verifyPassword
};
