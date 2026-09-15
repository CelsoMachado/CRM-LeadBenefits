# Deploy do LeadBenefits CRM no Railway

## Configuracao do servico

O Railway deve usar o repositorio na raiz deste projeto. A configuracao versionada ja define:

- Build: Nixpacks
- Start command: `npm start`
- Health check: `/api/health`
- Node.js: `22.x`

Nao configure o `start-crm.cmd` no Railway; ele e somente para o ambiente Windows local.

## Volume e bancos

Crie um Volume no servico e monte-o em `/data`. Configure estas variaveis no Railway:

```text
NODE_ENV=production
LEADBENEFITS_DATA_DIR=/data
LEADBENEFITS_PROSPECCOES_DB=/data/prospeccoes.sqlite
LEADBENEFITS_IMPORTACAO_DB=/data/CRM_importacao.sqlite
LEADBENEFITS_ADMIN_DB=/data/LeadBenefits_admin.sqlite
RFB_SEARCH_SERVICE_URL=https://SEU-TUNEL.trycloudflare.com
```

O arquivo `LeadBenefits.sqlite` nao deve ser enviado ao Railway quando a pesquisa RFB estiver sendo atendida pelo servico remoto. Nesse caso, configure `RFB_SEARCH_SERVICE_URL` com a URL do servico que acessa a base RFB local. Os demais bancos sao gravaveis e devem permanecer no Volume para que cadastros, historico, importacoes e usuarios nao sejam perdidos em um novo deploy.

Quando `RFB_SEARCH_SERVICE_URL` estiver configurada, o backend do CRM encaminha os filtros de `/api/empresas` ao servico remoto. A URL nao e exposta ao navegador. Se o servico estiver indisponivel, a API retorna HTTP 503 com uma mensagem controlada.

Envie os bancos pelo Railway CLI, conforme o ambiente configurado:

```text
railway volume files upload .\prospeccoes.sqlite /data/prospeccoes.sqlite
railway volume files upload .\CRM_importacao.sqlite /data/CRM_importacao.sqlite
railway volume files upload .\LeadBenefits_admin.sqlite /data/LeadBenefits_admin.sqlite
```

Nao envie arquivos `-wal` ou `-shm` separadamente.

## Administrador inicial

Execute o bootstrap uma vez apontando para o Volume e informe credenciais fortes por variaveis temporarias ou pelo modo interativo:

```text
railway run npm run bootstrap:admin
```

Remova as variaveis `BOOTSTRAP_ADMIN_*` depois da criacao do usuario. Nao use credenciais de desenvolvimento em producao.

## Validacao

Depois do deploy, confirme:

```text
GET https://SEU-DOMINIO/api/health
```

A resposta deve conter `"ok": true`. Com o banco principal carregado, `databaseAvailable` tambem deve ser `true`.

## Pendencia conhecida

O pacote `xlsx@0.18.5` possui alertas de Prototype Pollution e ReDoS reportados pelo `npm audit`, sem correcao automatica disponivel. A importacao XLSX deve ser tratada como pendencia de seguranca antes de ampliar o acesso publico a esse recurso.