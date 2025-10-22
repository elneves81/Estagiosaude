# Exemplos de Erros Verificados

Este documento contém exemplos de erros que são automaticamente detectados pelo sistema de verificação após push.

## Exemplos de Verificações

### ✅ Verificação de Sintaxe YAML

Arquivos YAML incorretos serão detectados:

```yaml
# Exemplo de YAML válido
nome: "Estágio em Saúde"
descricao: "Sistema de gestão"
```

### ✅ Verificação de Sintaxe JSON

Arquivos JSON incorretos serão detectados:

```json
{
  "nome": "Estagiosaude",
  "versao": "1.0.0"
}
```

### ✅ Detecção de Dados Sensíveis

O sistema detecta:
- Senhas hardcoded
- Chaves API expostas
- Tokens de autenticação
- Chaves privadas

**Exemplo do que NÃO fazer:**
```python
# ❌ NUNCA faça isso!
# password = "senha123"  # Isso seria detectado
# api_key = "sk_test_123abc"  # Isso seria detectado
```

**Exemplo correto:**
```python
# ✅ Use variáveis de ambiente
import os
password = os.getenv('DB_PASSWORD')
api_key = os.getenv('API_KEY')
```

### ✅ Verificação de Arquivos Grandes

Arquivos maiores que 10MB são sinalizados:
- Considere usar Git LFS para arquivos grandes
- Ou mantenha arquivos grandes fora do repositório

### ✅ Espaços em Branco

Espaços no final das linhas são detectados para manter código limpo.

### ✅ Verificação de Conflitos

Marcadores de merge não resolvidos são detectados:
```
<<<<<<< HEAD
=======
>>>>>>> branch
```

## Como Testar as Verificações

1. Clone o repositório
2. Instale o pre-commit: `pip install pre-commit && pre-commit install`
3. Faça alterações nos arquivos
4. Tente fazer commit - as verificações serão executadas automaticamente
5. Após push, verifique a aba **Actions** no GitHub

## Visualizando Resultados

Após cada push:
1. Vá para a aba **Actions** no GitHub
2. Clique no workflow mais recente
3. Veja os resultados detalhados de cada verificação

## Estatísticas

O sistema verifica automaticamente:
- ✅ Sintaxe de arquivos (YAML, JSON, XML, TOML)
- ✅ Qualidade do código
- ✅ Segurança (dados sensíveis)
- ✅ Tamanho de arquivos
- ✅ Codificação UTF-8
- ✅ Espaços em branco
- ✅ Conflitos de merge

---

Para mais informações, consulte o [CONTRIBUTING.md](../CONTRIBUTING.md)
