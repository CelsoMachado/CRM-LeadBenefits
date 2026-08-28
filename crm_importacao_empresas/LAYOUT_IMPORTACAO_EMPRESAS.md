# Layout de Importacao de Empresas - LeadBenefits

Este documento define o layout oficial para planilhas de importacao de empresas no LeadBenefits.

## Formatos aceitos

- XLSX
- CSV

## Regras gerais

- A primeira linha deve conter os nomes das colunas.
- O CNPJ pode vir com ou sem pontuacao; o sistema grava somente numeros.
- Telefones sao gravados somente com numeros, mantendo o DDD quando informado.
- CEP e gravado somente com numeros.
- Campos opcionais podem ficar vazios.
- Registros sem CNPJ ou com CNPJ invalido nao sao descartados; ficam com `CNPJ_PENDENTE = S`.

## Nome das colunas

| Coluna | Tipo | Tamanho maximo | Obrigatorio | Exemplo |
| ------ | ---- | -------------: | ----------- | ------- |
| CNPJ | Texto/Numero | 14 | Nao | 02946060000127 |
| RAZAO_SOCIAL | Texto | 200 | Sim | PROLINE INDUSTRIA E COMERCIO LTDA |
| NOME_FANTASIA | Texto | 200 | Nao | PREMISSE |
| TELEFONE | Texto | 15 | Nao | 4133771873 |
| TELEFONE2 | Texto | 15 | Nao | 41999999999 |
| EMAIL | Texto | 200 | Nao | contato@empresa.com.br |
| LOGRADOURO | Texto | 200 | Nao | Rua Bom Jesus do Iguape |
| NUMERO | Texto | 20 | Nao | 6051 |
| COMPLEMENTO | Texto | 100 | Nao | Sala 10 |
| BAIRRO | Texto | 100 | Nao | Boqueirao |
| CEP | Texto | 8 | Nao | 81730020 |
| MUNICIPIO | Texto | 100 | Nao | Curitiba |
| UF | Texto | 2 | Nao | PR |
| NOME_CONTATO | Texto | 150 | Nao | Joao da Silva |
| CARGO_CONTATO | Texto | 100 | Nao | Recursos Humanos |
| OBSERVACOES | Texto | 2000 | Nao | Cliente indicado pela equipe |

## Campos gerados pelo sistema

Os campos abaixo nao precisam estar na planilha. Eles sao preenchidos automaticamente pelo LeadBenefits:

| Campo | Regra |
| ----- | ----- |
| ID | Identificador interno da empresa importada |
| ID_IMPORTACAO | Referencia ao processo de importacao |
| ORIGEM | `IMPORTACAO` para arquivos e `CADASTRO_MANUAL` para cadastro manual |
| NOME_ARQUIVO_ORIGEM | Nome do arquivo importado |
| DATA_IMPORTACAO | Data/hora do processo de importacao |
| CNPJ_PENDENTE | `N` para CNPJ valido e `S` para ausente/invalido |
| DATA_CADASTRO | Data/hora em que o registro foi criado |
| DATA_ATUALIZACAO | Data/hora da ultima atualizacao |

## Duplicidades

- Quando o CNPJ ja existe em `CRM_importacao.sqlite`, o sistema complementa dados vazios e nao apaga informacoes existentes.
- Quando nao ha CNPJ valido, o sistema tenta localizar duplicidade somente com combinacao forte de telefone, razao social, municipio e UF.
- Em caso de duvida, o registro nao e eliminado automaticamente.
