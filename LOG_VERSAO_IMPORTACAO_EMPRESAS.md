# Log da Versao - Modulo de Importacao e Cadastro de Empresas

Data: 26/08/2026  
Release: `crm_importacao_empresas`  
Status: Disponivel para testes  
URL local: `http://localhost:3020`

## Objetivo da versao

Criar um modulo separado para importar e cadastrar empresas no LeadBenefits sem alterar o banco principal da Receita Federal.

O banco principal `LeadBenefits.sqlite` permanece em modo somente leitura. Os novos registros ficam no banco separado:

`C:\LeadBenefits\crm_importacao_empresas\CRM_importacao.sqlite`

## Funcionalidades adicionadas

- Novo menu superior `Empresas`.
- Nova pagina `Empresas > Importacao`.
- Nova pagina `Empresas > Cadastrar Empresa`.
- Importacao de arquivos `.csv`.
- Importacao de arquivos `.xlsx`.
- Cadastro manual de empresas.
- Download de modelo de importacao CSV.
- Download de modelo de importacao XLSX.
- Historico das importacoes na tela.
- Resumo da importacao apos processamento.
- Visualizacao de erros de importacao.

## Banco de dados criado

Arquivo:

`C:\LeadBenefits\crm_importacao_empresas\CRM_importacao.sqlite`

Tabelas:

| Tabela | Finalidade |
| ------ | ---------- |
| `Empresas_Importadas` | Armazena empresas importadas por arquivo ou cadastradas manualmente |
| `Importacoes` | Registra cada processo de importacao executado |
| `Importacao_Erros` | Registra erros encontrados durante importacoes |

## Campos principais de `Empresas_Importadas`

| Campo | Uso |
| ----- | --- |
| `ID` | Identificador interno da empresa importada |
| `ID_IMPORTACAO` | Vinculo com a importacao que originou o cadastro |
| `CNPJ` | CNPJ somente com numeros |
| `RAZAO_SOCIAL` | Razao social da empresa |
| `NOME_FANTASIA` | Nome fantasia |
| `TELEFONE` | Telefone normalizado somente com numeros |
| `TELEFONE2` | Segundo telefone normalizado |
| `EMAIL` | E-mail da empresa |
| `LOGRADOURO` | Endereco |
| `NUMERO` | Numero do endereco |
| `COMPLEMENTO` | Complemento do endereco |
| `BAIRRO` | Bairro |
| `CEP` | CEP somente com numeros |
| `MUNICIPIO` | Municipio |
| `UF` | Unidade federativa |
| `NOME_CONTATO` | Nome da pessoa de contato |
| `CARGO_CONTATO` | Cargo ou funcao do contato |
| `OBSERVACOES` | Observacoes gerais |
| `ORIGEM` | `IMPORTACAO` ou `CADASTRO_MANUAL` |
| `NOME_ARQUIVO_ORIGEM` | Arquivo de origem, quando houver |
| `DATA_IMPORTACAO` | Data/hora da importacao |
| `CNPJ_PENDENTE` | `S` quando ausente/invalido, `N` quando valido |
| `DATA_CADASTRO` | Data/hora do cadastro |
| `DATA_ATUALIZACAO` | Data/hora da ultima atualizacao |

## Log de importacoes

Cada importacao gera um registro na tabela `Importacoes`.

Campos registrados:

| Campo | Conteudo |
| ----- | -------- |
| `ID_IMPORTACAO` | Identificador da importacao |
| `NOME_ARQUIVO` | Nome do arquivo importado |
| `TIPO_ARQUIVO` | `CSV` ou `XLSX` |
| `DATA_HORA_IMPORTACAO` | Data/hora da importacao |
| `USUARIO` | Usuario do ambiente Windows/servidor |
| `TOTAL_LINHAS` | Total de linhas lidas |
| `TOTAL_IMPORTADAS` | Total de empresas novas |
| `TOTAL_ATUALIZADAS` | Total de empresas complementadas/atualizadas |
| `TOTAL_DUPLICADAS` | Total de duplicidades sem alteracao |
| `TOTAL_ERROS` | Total de erros |
| `TOTAL_CNPJ_PENDENTE` | Total de registros sem CNPJ valido |

Consulta util:

```sql
SELECT *
FROM Importacoes
ORDER BY ID_IMPORTACAO DESC;
```

## Log de erros de importacao

Quando uma linha nao pode ser importada, o detalhe fica em `Importacao_Erros`.

Campos registrados:

| Campo | Conteudo |
| ----- | -------- |
| `ID` | Identificador do erro |
| `ID_IMPORTACAO` | Importacao relacionada |
| `LINHA` | Linha da planilha/arquivo |
| `CAMPO` | Campo com problema |
| `MOTIVO` | Motivo do erro |
| `DADOS_ORIGINAIS` | Dados originais da linha em JSON |
| `CRIADO_EM` | Data/hora do erro |

Consulta util:

```sql
SELECT *
FROM Importacao_Erros
WHERE ID_IMPORTACAO = 1
ORDER BY ID;
```

## Log de cadastro manual

Cadastros feitos pela tela `Empresas > Cadastrar Empresa` sao gravados em `Empresas_Importadas` com:

`ORIGEM = 'CADASTRO_MANUAL'`

Quando o CNPJ estiver ausente ou invalido:

`CNPJ_PENDENTE = 'S'`

Quando o CNPJ estiver valido:

`CNPJ_PENDENTE = 'N'`

Consulta util:

```sql
SELECT ID, CNPJ, RAZAO_SOCIAL, NOME_FANTASIA, ORIGEM, CNPJ_PENDENTE, DATA_CADASTRO
FROM Empresas_Importadas
WHERE ORIGEM = 'CADASTRO_MANUAL'
ORDER BY ID DESC;
```

## Regras de normalizacao

- CNPJ gravado somente com numeros.
- CNPJ validado com 14 digitos e digitos verificadores.
- Telefone gravado somente com numeros.
- CEP gravado somente com numeros.
- UF gravada em maiusculo.
- Municipio, razao social e nome fantasia gravados em maiusculo.
- E-mail gravado em minusculo.

## Regras de duplicidade

- CNPJ valido ja existente: complementa campos vazios quando possivel.
- CNPJ valido ja existente sem novos dados: conta como duplicado.
- Sem CNPJ valido: tenta identificar duplicidade por telefone, razao social, municipio e UF.
- Em caso de duvida, o cadastro nao e eliminado automaticamente.

## Arquivos de orientacao e modelos

Documentacao do layout:

`C:\LeadBenefits\crm_importacao_empresas\LAYOUT_IMPORTACAO_EMPRESAS.md`

Modelo CSV:

`C:\LeadBenefits\crm_importacao_empresas\frontend\MODELO_IMPORTACAO_EMPRESAS.csv`

Modelo XLSX:

`C:\LeadBenefits\crm_importacao_empresas\frontend\MODELO_IMPORTACAO_EMPRESAS.xlsx`

## Rotas adicionadas

| Rota | Metodo | Finalidade |
| ---- | ------ | ---------- |
| `/api/importacoes` | `GET` | Lista importacoes anteriores |
| `/api/importacoes` | `POST` | Processa importacao CSV/XLSX |
| `/api/importacoes/erros?id=...` | `GET` | Lista erros de uma importacao |
| `/api/empresas-importadas` | `POST` | Salva cadastro manual no banco de importacao |

## Validacoes realizadas

- Sintaxe do backend validada com `node --check`.
- Sintaxe do frontend validada com `node --check`.
- Teste de cadastro manual realizado.
- Teste de importacao CSV realizado.
- Teste de importacao XLSX realizado.
- Registros de teste removidos ao final.
- Servico confirmado em `http://localhost:3020`.
