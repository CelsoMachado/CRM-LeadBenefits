# LeadBenefits CRM - Release Angelina Campos de Contato

## Pasta do release

`C:\LeadBenefits\crm_angelina_campos_contato`

## Como iniciar

Execute:

`C:\LeadBenefits\crm_angelina_campos_contato\start-crm.cmd`

URL:

`http://localhost:3010`

## Alteracoes

- Incluidos campos de telefone de contato, WhatsApp e e-mail no formulario de historico.
- Renomeado o campo de funcionarios para `Quantas vidas / funcionarios`.
- Incluidos campos para plano de saude, odontologico e seguro de vida.
- Incluidas operadoras e vencimentos de contrato para cada beneficio.
- Incluidos motivos de substituicao: reducao de custos, melhorar atendimento e ampliar cobertura.
- Incluido campo de interesse em trocar.
- O campo de outras necessidades continua usando `BENEFICIOS` e tambem alimenta `OUTRAS_NECESSIDADES`.
- O historico de contatos mostra os novos campos em cada atendimento salvo.

## Banco de dados

- O banco principal `C:\LeadBenefits\LeadBenefits.sqlite` continua somente leitura.
- As novas colunas foram criadas somente no banco de historico deste release: `C:\LeadBenefits\crm_angelina_campos_contato\prospeccoes.sqlite`.
- A versao anterior em `C:\LeadBenefits\crm` nao foi alterada.
