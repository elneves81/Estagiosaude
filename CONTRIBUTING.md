# Guia de Contribuição

Obrigado por considerar contribuir com o Estagiosaude! Este documento fornece diretrizes para garantir que suas contribuições sejam de alta qualidade.

## Antes de Começar

### Verifique os Erros Automaticamente

Este projeto possui verificação automática de erros. Antes de fazer push:

1. **Instale o pre-commit** (recomendado):
   ```bash
   pip install pre-commit
   pre-commit install
   ```

2. **Execute as verificações localmente**:
   ```bash
   pre-commit run --all-files
   ```

## Fluxo de Trabalho

### 1. Fork e Clone

```bash
git clone https://github.com/seu-usuario/Estagiosaude.git
cd Estagiosaude
```

### 2. Crie uma Branch

```bash
git checkout -b feature/minha-feature
```

**Convenção de nomes para branches:**
- `feature/nome` - Para novas funcionalidades
- `bugfix/nome` - Para correções de bugs
- `hotfix/nome` - Para correções urgentes
- `docs/nome` - Para documentação

### 3. Faça suas Alterações

Antes de commitar, certifique-se de que:
- [ ] Seu código não possui erros de sintaxe
- [ ] Não há espaços em branco no final das linhas
- [ ] Não há arquivos grandes (>10MB) sendo commitados
- [ ] Não há dados sensíveis (senhas, tokens, chaves)
- [ ] Arquivos estão codificados em UTF-8
- [ ] Arquivos YAML/JSON são válidos

### 4. Commit

Escreva mensagens de commit claras e descritivas:

```bash
git commit -m "Adiciona validação de formulário de cadastro"
```

**Boas práticas para mensagens de commit:**
- Use verbos no imperativo ("Adiciona", "Corrige", "Remove")
- Seja específico sobre o que foi alterado
- Mantenha a primeira linha com menos de 72 caracteres
- Adicione detalhes em linhas subsequentes se necessário

### 5. Push

```bash
git push origin feature/minha-feature
```

**Após o push, verificações automáticas serão executadas:**
- ✅ Sintaxe de arquivos
- ✅ Qualidade do código
- ✅ Segurança (detecção de dados sensíveis)
- ✅ Padrões do projeto

### 6. Pull Request

1. Acesse o GitHub e abra um Pull Request
2. Preencha o template do PR com todas as informações
3. Aguarde as verificações automáticas
4. Responda aos comentários dos revisores

## Verificações Automáticas

### O que é verificado?

Após cada push, o sistema verifica automaticamente:

#### Qualidade de Código
- Sintaxe de arquivos YAML, JSON, TOML e XML
- Sintaxe de Python (se aplicável)
- Espaços em branco no final das linhas
- Codificação de arquivos (UTF-8)

#### Segurança
- Detecção de chaves privadas
- Detecção de senhas e tokens
- Detecção de chaves API

#### Estrutura
- Existência de README
- Tamanho de arquivos (alerta para >10MB)
- Conflitos de merge não resolvidos

### Como Ver os Resultados?

1. Vá para a aba **Actions** no GitHub
2. Encontre seu commit/PR
3. Veja os detalhes das verificações

### O que fazer se as verificações falharem?

1. **Leia a mensagem de erro** - ela geralmente indica o problema
2. **Corrija o problema localmente**
3. **Commit e push novamente**
4. **As verificações serão executadas automaticamente**

## Padrões de Código

### Geral
- Use indentação consistente (2 ou 4 espaços, nunca tabs)
- Remova espaços em branco no final das linhas
- Termine arquivos com uma linha em branco
- Use nomes descritivos para variáveis e funções

### Python (se aplicável)
- Siga a PEP 8
- Use type hints quando possível
- Documente funções e classes

### JavaScript/Node.js (se aplicável)
- Use const/let ao invés de var
- Use ponto e vírgula
- Siga o padrão ESLint do projeto

## Branches Protegidas

**NÃO faça commits diretos em:**
- `main`
- `master`
- `develop`

Sempre use Pull Requests para estas branches.

## Problemas Comuns

### "Arquivo muito grande"
**Solução:** Use Git LFS para arquivos grandes ou remova o arquivo e use um link/referência

### "Detectado dado sensível"
**Solução:** Remova a senha/token/chave e use variáveis de ambiente

### "Espaços em branco no final"
**Solução:** Configure seu editor para remover automaticamente ou use `pre-commit`

### "Conflito de merge não resolvido"
**Solução:** 
```bash
git fetch origin
git merge origin/main
# Resolva os conflitos
git commit
```

## Dúvidas?

Abra uma Issue no GitHub com sua dúvida!

## Código de Conduta

- Seja respeitoso e profissional
- Aceite feedback construtivo
- Foque na melhoria do projeto
- Ajude outros contribuidores

---

Obrigado por contribuir! 🎉
