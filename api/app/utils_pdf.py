from jinja2 import Template

def render_anexo2_html(estagio):
    """Renderiza relatório Anexo II em HTML"""
    
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Anexo II - Estágio {{ estagio.nome }}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>ANEXO II - TERMO DE COMPROMISSO DE ESTÁGIO</h1>
        </div>
        
        <div class="section">
            <h3>Dados do Estagiário</h3>
            <div class="field"><span class="label">Nome:</span> {{ estagio.nome }}</div>
            <div class="field"><span class="label">E-mail:</span> {{ estagio.email }}</div>
            <div class="field"><span class="label">Telefone:</span> {{ estagio.telefone or 'Não informado' }}</div>
            <div class="field"><span class="label">Período:</span> {{ estagio.periodo or 'Não informado' }}</div>
        </div>
        
        <div class="section">
            <h3>Dados do Estágio</h3>
            <div class="field"><span class="label">Instituição:</span> {{ estagio.instituicao.nome if estagio.instituicao else 'Não informado' }}</div>
            <div class="field"><span class="label">Curso:</span> {{ estagio.curso.nome if estagio.curso else 'Não informado' }}</div>
            <div class="field"><span class="label">Unidade:</span> {{ estagio.unidade.nome if estagio.unidade else 'Não informado' }}</div>
            <div class="field"><span class="label">Disciplina:</span> {{ estagio.disciplina or 'Não informado' }}</div>
            <div class="field"><span class="label">Nível:</span> {{ estagio.nivel or 'Não informado' }}</div>
            <div class="field"><span class="label">Número de Estagiários:</span> {{ estagio.num_estagiarios or 'Não informado' }}</div>
        </div>
        
        <div class="section">
            <h3>Supervisor</h3>
            <div class="field"><span class="label">Nome:</span> {{ estagio.supervisor.nome if estagio.supervisor else 'Não informado' }}</div>
            <div class="field"><span class="label">E-mail:</span> {{ estagio.supervisor.email if estagio.supervisor else 'Não informado' }}</div>
            <div class="field"><span class="label">Especialidade:</span> {{ estagio.supervisor.especialidade if estagio.supervisor and estagio.supervisor.especialidade else 'Não informado' }}</div>
        </div>
        
        {% if estagio.observacoes %}
        <div class="section">
            <h3>Observações</h3>
            <p>{{ estagio.observacoes }}</p>
        </div>
        {% endif %}
        
        <div class="section">
            <p><strong>Data de Geração:</strong> {{ data_geracao }}</p>
        </div>
        
        <div class="section" style="margin-top: 50px;">
            <table>
                <tr>
                    <th width="33%">Assinatura do Estagiário</th>
                    <th width="33%">Assinatura do Supervisor</th>
                    <th width="34%">Assinatura da Instituição</th>
                </tr>
                <tr>
                    <td style="height: 80px;"></td>
                    <td style="height: 80px;"></td>
                    <td style="height: 80px;"></td>
                </tr>
            </table>
        </div>
    </body>
    </html>
    """
    
    from datetime import datetime
    template = Template(html_template)
    
    return template.render(
        estagio=estagio,
        data_geracao=datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    )

def render_anexo2(estagio):
    """Renderiza relatório Anexo II em PDF (com fallback para HTML)"""
    try:
        # Lazy import do WeasyPrint
        import weasyprint
        from weasyprint import HTML
        
        html_content = render_anexo2_html(estagio)
        pdf = HTML(string=html_content).write_pdf()
        return pdf
        
    except ImportError:
        raise ImportError(
            "WeasyPrint não está instalado. Para gerar PDFs, instale com: "
            "pip install weasyprint. Usando HTML como alternativa."
        )