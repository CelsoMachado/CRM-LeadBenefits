# Deploy do LeadBenefits CRM no Railway

## Arquivos e diretorios para subir

Suba a pasta `RAILWAY_UPLOAD_LEADBENEFITS` para o GitHub ou use essa pasta com o Railway CLI.

Ela deve conter:

```text
railway.json
package.json
package-lock.json
.gitignore
RAILWAY_DEPLOY.md
crm_importacao_empresas/
```

## Configuracao no Railway

O Railway deve detectar Node.js automaticamente.

Use:

```text
Start command: npm start
Healthcheck path: /api/health
```

Esses valores ja estao definidos em `railway.json`.

## Banco de dados SQLite

O CRM usa estes bancos:

```text
LeadBenefits.sqlite
crm_importacao_empresas/prospeccoes.sqlite
crm_importacao_empresas/CRM_importacao.sqlite
```

Para nao perder dados no Railway, crie um Volume no servico e monte em:

```text
/data
```

Depois configure estas variaveis no Railway:

```text
LEADBENEFITS_DB=/data/LeadBenefits.sqlite
LEADBENEFITS_PROSPECCOES_DB=/data/prospeccoes.sqlite
LEADBENEFITS_IMPORTACAO_DB=/data/CRM_importacao.sqlite
CRM_SECURE_COOKIE=1
```

O backend tambem reconhece automaticamente `RAILWAY_VOLUME_MOUNT_PATH`.
Se houver volume, ele usa esse caminho como local dos bancos.

## Passo obrigatorio

O arquivo principal `LeadBenefits.sqlite` nao foi encontrado neste workspace.

Antes do deploy final funcionar com pesquisa de empresas, envie esse arquivo para:

```text
/data/LeadBenefits.sqlite
```

Voce pode fazer isso pelo Railway CLI:

```text
railway volume files upload ./LeadBenefits.sqlite /data/LeadBenefits.sqlite
```

Ou, se o arquivo nao for muito grande, coloque `LeadBenefits.sqlite` na raiz da pasta enviada antes do deploy.

## Nao subir

Nao suba:

```text
node_modules/
*.sqlite-wal
*.sqlite-shm
*test*.sqlite
*teste*.sqlite
*.bat
*.cmd
netlify/
netlify.toml
```

## Credencial inicial

Quando o banco administrativo for criado pela primeira vez:

```text
E-mail: admin@leadbenefits.local
Senha: Alterar@123
```

Troque essa senha antes de usar em producao.
