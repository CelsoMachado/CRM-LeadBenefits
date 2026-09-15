# Pendencias tecnicas

## Seguranca/importacao: vulnerabilidade em xlsx

- Pacote afetado: `xlsx`
- Versao atual: `0.18.5`
- Tipo de dependencia: direta
- Vulnerabilidades informadas pelo `npm audit`: Prototype Pollution e ReDoS
- Versao corrigida indicada pelos advisories: abaixo de `0.19.3` permanece afetada por Prototype Pollution; abaixo de `0.20.2` permanece afetada por ReDoS
- Situacao no npm nesta etapa: pacote publicado em `0.18.5`, sem correcao automatica disponivel pelo `npm audit fix`
- Impacto provavel: risco concentrado na leitura de arquivos XLSX importados; nao ampliar superficie de upload/importacao antes de uma etapa propria de seguranca
- Breaking change: provavel, pois a correcao tende a exigir troca de biblioteca ou fonte/distribuicao fora do pacote npm atual
- Decisao: nao corrigir na Etapa 2A sem autorizacao

## Etapa 2B: identidade interna de empresas no CRM multiempresa

- Decisao arquitetural: o CNPJ nao devera continuar como identidade primaria interna da empresa no CRM multiempresa
- Direcao planejada: criar chave interna, por exemplo `empresa_id`, e manter `UNIQUE(organizacao_id, cnpj)`
- Base RFB: permanece compartilhada e com sua propria identificacao/estrutura
- Decisao: nao executar esta alteracao na Etapa 2A
