# LeadBenefits CRM

Ambiente local para pesquisar empresas no banco `LeadBenefits.sqlite`.

## Iniciar

```powershell
cd C:\LeadBenefits
node .\crm\backend\server.js
```

Depois acesse:

```text
http://localhost:3000
```

## API

Health check:

```text
GET /api/health
```

Pesquisa:

```text
GET /api/empresas?uf=SP&municipio=7107&situacao=02&temEmail=1&temTelefone=1
```

Filtros suportados:

- `q`
- `uf`
- `municipio`
- `cnae`
- `situacao`
- `matrizFilial`
- `simples`
- `mei`
- `aberturaInicio`
- `aberturaFim`
- `capitalMin`
- `capitalMax`
- `temEmail`
- `temTelefone`
- `limit`
- `offset`

## Deploy no Railway

Consulte [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md) para configurar o servico, o Volume persistente e os bancos SQLite.

O comando de producao e `npm start`. O endpoint de health check e `/api/health`.
