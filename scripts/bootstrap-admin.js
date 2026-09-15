const path = require('path');
const fs = require('fs');
const readline = require('readline');

const Database = require('better-sqlite3');
const auth = require('../backend/auth');
const featureCatalog = require('../backend/features/catalog');

const projectDir = path.resolve(__dirname, '..');
const dataDir = process.env.LEADBENEFITS_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || projectDir;
const adminPath = process.env.LEADBENEFITS_ADMIN_DB || path.join(dataDir, 'LeadBenefits_admin.sqlite');

function parseArgs(argv) {
    const data = {};

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (!arg.startsWith('--')) {
            continue;
        }

        const key = arg.slice(2);
        const next = argv[index + 1];

        if (next && !next.startsWith('--')) {
            data[key] = next;
            index += 1;
        } else {
            data[key] = true;
        }
    }

    return data;
}

function question(rl, prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function hiddenQuestion(rl, prompt) {
    return new Promise((resolve) => {
        const mutableRl = rl;
        mutableRl.stdoutMuted = true;
        rl.question(prompt, (answer) => {
            mutableRl.stdoutMuted = false;
            rl.output.write('\n');
            resolve(answer);
        });
    });
}

async function collectInput(args) {
    const input = {
        nome: args.nome || process.env.BOOTSTRAP_ADMIN_NAME || '',
        email: args.email || process.env.BOOTSTRAP_ADMIN_EMAIL || '',
        password: args.password || process.env.BOOTSTRAP_ADMIN_PASSWORD || ''
    };

    if (input.nome && input.email && input.password) {
        return input;
    }

    if (!process.stdin.isTTY) {
        throw new Error('Informe BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD em ambiente nao interativo.');
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });

    const originalWrite = rl._writeToOutput;
    rl._writeToOutput = function writeToOutput(value) {
        if (rl.stdoutMuted) {
            rl.output.write('*');
            return;
        }

        originalWrite.call(rl, value);
    };

    try {
        if (!input.nome) {
            input.nome = await question(rl, 'Nome do administrador: ');
        }

        if (!input.email) {
            input.email = await question(rl, 'E-mail do administrador: ');
        }

        if (!input.password) {
            input.password = await hiddenQuestion(rl, 'Senha inicial: ');
            const confirmation = await hiddenQuestion(rl, 'Confirme a senha inicial: ');

            if (input.password !== confirmation) {
                throw new Error('As senhas informadas nao conferem.');
            }
        }

        return input;
    } finally {
        rl.close();
    }
}

async function main() {
    fs.mkdirSync(path.dirname(adminPath), { recursive: true });

    const args = parseArgs(process.argv.slice(2));
    const db = new Database(adminPath);

    try {
        auth.initAuthDatabase(db, featureCatalog);

        const org = db.prepare("SELECT id, nome FROM ORGANIZACOES WHERE nome = 'Wlasena' LIMIT 1").get();
        const profile = db.prepare(`
            SELECT id, codigo
            FROM PERFIS
            WHERE organizacao_id = ? AND codigo = 'ADMINISTRADOR'
            LIMIT 1
        `).get(org.id);

        const existingAdmin = db.prepare(`
            SELECT u.id, u.email
            FROM USUARIOS u
            JOIN PERFIS p ON p.id = u.perfil_id
            WHERE u.organizacao_id = ? AND p.codigo = 'ADMINISTRADOR'
            LIMIT 1
        `).get(org.id);

        if (existingAdmin && !args['allow-additional-admin']) {
            throw new Error(`Ja existe administrador para Wlasena: ${existingAdmin.email}. Use --allow-additional-admin para criar outro conscientemente.`);
        }

        const input = await collectInput(args);
        const email = auth.normalizeEmail(input.email);

        if (db.prepare('SELECT id FROM USUARIOS WHERE email = ? LIMIT 1').get(email)) {
            throw new Error(`Usuario ja cadastrado para o e-mail ${email}.`);
        }

        const passwordHash = await auth.hashPassword(input.password);
        const result = db.prepare(`
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
            VALUES (?, ?, ?, ?, ?, 'ATIVO', 0, ?)
        `).run(org.id, profile.id, input.nome.trim(), email, passwordHash, new Date().toISOString());

        auth.auditSecurity(db, {
            correlationId: `BOOTSTRAP-${Date.now()}`,
            appVersion: require('../backend/app-metadata').version,
            route: 'scripts/bootstrap-admin.js',
            method: 'SCRIPT'
        }, {
            evento: 'USUARIO_ADMINISTRATIVO_CRIADO',
            resultado: 'SUCESSO',
            usuarioId: result.lastInsertRowid,
            organizacaoId: org.id,
            email,
            detalhes: { origem: 'BOOTSTRAP_ADMIN' }
        });

        console.log(`Administrador criado com sucesso: ${email}`);
        console.log(`Organizacao: ${org.nome} (${org.id})`);
        console.log(`Perfil: ${profile.codigo}`);
    } finally {
        db.close();
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
