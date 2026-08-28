const path = require('path');

let Database;

try {
    Database = require('better-sqlite3');
} catch {
    Database = require('../importador/node_modules/better-sqlite3');
}

const rootDir = path.resolve(__dirname, '..');
const bancoPath = process.env.LEADBENEFITS_DB || path.join(rootDir, 'LeadBenefits.sqlite');
const prospeccoesPath = process.env.LEADBENEFITS_PROSPECCOES_DB || path.join(__dirname, 'prospeccoes.sqlite');
const batchSize = Math.max(1000, Math.min(100000, Number(process.env.WHATS_BATCH_SIZE || 50000)));

function digits(value) {
    return String(value || '').replace(/\D/g, '');
}

function isLikelyBrazilianWhatsapp(ddd, phone) {
    const phoneDigits = digits(phone);
    const dddDigits = digits(ddd);
    const combined = `${dddDigits}${phoneDigits}`;

    if (dddDigits.length === 2 && phoneDigits.length === 9 && phoneDigits.startsWith('9')) {
        return true;
    }

    if (combined.length === 11 && combined.slice(2, 3) === '9') {
        return true;
    }

    return false;
}

function hasAnyPhone(row) {
    return digits(row.TELEFONE_1) || digits(row.TELEFONE_2);
}

function resolveWhatsValue(row) {
    return isLikelyBrazilianWhatsapp(row.DDD_1, row.TELEFONE_1)
        || isLikelyBrazilianWhatsapp(row.DDD_2, row.TELEFONE_2)
        ? 'S'
        : 'N';
}

function ensureWhatsColumn(db) {
    const columns = db.prepare('PRAGMA table_info(EMPRESAS_FLAGS)').all();
    const hasWhats = columns.some((column) => String(column.name).toLowerCase() === 'whats');

    if (!hasWhats) {
        throw new Error('A coluna Whats nao existe em EMPRESAS_FLAGS. Crie a coluna antes de executar a validacao.');
    }
}

const sourceDb = new Database(bancoPath, { readonly: true });
const crmDb = new Database(prospeccoesPath);

sourceDb.pragma('query_only = ON');
crmDb.pragma('journal_mode = WAL');
crmDb.pragma('synchronous = NORMAL');

try {
    ensureWhatsColumn(crmDb);

    const selectBatch = sourceDb.prepare(`
        SELECT
            rowid AS ROW_ID,
            CNPJ,
            DDD_1,
            TELEFONE_1,
            DDD_2,
            TELEFONE_2
        FROM ESTABELECIMENTOS
        WHERE rowid > @lastRowId
          AND (
              COALESCE(TELEFONE_1, '') <> ''
              OR COALESCE(TELEFONE_2, '') <> ''
          )
        ORDER BY rowid
        LIMIT @batchSize
    `);

    const upsertWhats = crmDb.prepare(`
        INSERT INTO EMPRESAS_FLAGS (CNPJ, FLAG_ATIVA, "Whats")
        VALUES (@cnpj, 0, @whats)
        ON CONFLICT(CNPJ) DO UPDATE SET
            "Whats" = excluded."Whats",
            ATUALIZADO_EM = CURRENT_TIMESTAMP
    `);

    const saveBatch = crmDb.transaction((rows) => {
        let whatsSim = 0;
        let whatsNao = 0;

        for (const row of rows) {
            if (!row.CNPJ || !hasAnyPhone(row)) {
                continue;
            }

            const whats = resolveWhatsValue(row);

            upsertWhats.run({
                cnpj: row.CNPJ,
                whats
            });

            if (whats === 'S') {
                whatsSim += 1;
            } else {
                whatsNao += 1;
            }
        }

        return { whatsSim, whatsNao };
    });

    let lastRowId = 0;
    let processed = 0;
    let totalSim = 0;
    let totalNao = 0;
    const startedAt = Date.now();

    console.log('====================================');
    console.log(' VALIDACAO LOCAL APROXIMADA WHATS');
    console.log(' LeadBenefits');
    console.log('====================================');
    console.log(`Banco principal: ${bancoPath}`);
    console.log(`Banco CRM: ${prospeccoesPath}`);
    console.log(`Lote: ${batchSize.toLocaleString('pt-BR')} registros`);
    console.log('');
    console.log('Regra local aproximada:');
    console.log('- Whats = S quando telefone brasileiro tiver DDD com 2 digitos e numero celular com 9 digitos iniciado por 9.');
    console.log('- Whats = N para telefones que nao atendem essa regra.');
    console.log('- Se qualquer telefone do CNPJ for classificado como S, o CNPJ recebe Whats = S.');
    console.log('');

    while (true) {
        const rows = selectBatch.all({ lastRowId, batchSize });

        if (rows.length === 0) {
            break;
        }

        lastRowId = rows[rows.length - 1].ROW_ID;
        const result = saveBatch(rows);

        processed += rows.length;
        totalSim += result.whatsSim;
        totalNao += result.whatsNao;

        console.log([
            `Processados: ${processed.toLocaleString('pt-BR')}`,
            `Whats S: ${totalSim.toLocaleString('pt-BR')}`,
            `Whats N: ${totalNao.toLocaleString('pt-BR')}`,
            `Ultimo rowid: ${lastRowId}`
        ].join(' | '));
    }

    crmDb.pragma('wal_checkpoint(TRUNCATE)');

    const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);

    console.log('');
    console.log('====================================');
    console.log(' VALIDACAO CONCLUIDA');
    console.log('====================================');
    console.log(`Processados: ${processed.toLocaleString('pt-BR')}`);
    console.log(`Whats = S: ${totalSim.toLocaleString('pt-BR')}`);
    console.log(`Whats = N: ${totalNao.toLocaleString('pt-BR')}`);
    console.log(`Tempo: ${elapsedSeconds.toLocaleString('pt-BR')}s`);
} finally {
    sourceDb.close();
    crmDb.close();
}
