# Estagiosaude

[![Check for Errors After Push](https://github.com/elneves81/Estagiosaude/workflows/Check%20for%20Errors%20After%20Push/badge.svg)](https://github.com/elneves81/Estagiosaude/actions/workflows/check-errors.yml)
[![Pull Request Validation](https://github.com/elneves81/Estagiosaude/workflows/Pull%20Request%20Validation/badge.svg)](https://github.com/elneves81/Estagiosaude/actions/workflows/pr-validation.yml)

Sistema de gestão de estágios em saúde.

## Verificação Automática de Erros

Este projeto possui verificação automática de erros que é executada após cada push para garantir a qualidade do código.

### O que é verificado automaticamente?

Após cada push, o sistema verifica:

✅ **Sintaxe de arquivos YAML** - Garante que arquivos de configuração estão corretos
✅ **Sintaxe de arquivos JSON** - Valida arquivos de dados e configuração
✅ **Espaços em branco** - Detecta espaços desnecessários no final das linhas
✅ **Arquivos grandes** - Alerta sobre arquivos maiores que 10MB
✅ **Dados sensíveis** - Detecta possíveis senhas, chaves API ou tokens
✅ **README** - Verifica se a documentação existe
✅ **Codificação de arquivos** - Garante que arquivos usam UTF-8

### Como ver os resultados da verificação?

1. Acesse a aba **Actions** no GitHub
2. Clique no workflow "Check for Errors After Push"
3. Veja os resultados detalhados de cada verificação

### Verificação Local (Pre-commit)

Você pode executar as verificações localmente antes de fazer push:

#### Instalação

```bash
pip install pre-commit
pre-commit install
```

#### Uso

As verificações serão executadas automaticamente antes de cada commit. Para executar manualmente:

```bash
pre-commit run --all-files
```

### Branches Protegidas

O sistema previne commits diretos nas seguintes branches:
- `main`
- `master`
- `develop`

Use Pull Requests para contribuir com estas branches.

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

As verificações automáticas serão executadas em seu Pull Request para garantir a qualidade do código.

## Licença

Este projeto está sob a licença MIT.