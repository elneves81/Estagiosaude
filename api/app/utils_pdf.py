from jinja2 import Template

    html_template = """
    """Renderiza relatório Anexo II em HTML"""
    
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .title { text-align: center; font-weight: bold; }
            .subtitle { text-align: center; margin: 8px 0 18px; }
            .info-row { width: 100%; border: 1px solid #000; border-collapse: collapse; margin: 16px 0; }
            .info-row td { border: 1px solid #000; padding: 6px 8px; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 6px 8px; font-size: 12px; vertical-align: top; }
            th { background: #f9fafb; }
            .center { text-align: center; }
            .right { text-align: right; }
            .sig-table th, .sig-table td { height: 80px; }
            @media print {
                body { margin: 0; }
            }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        <div class="title">ANEXO II</div>
        <div class="subtitle">PLANO DE ATIVIDADES DE INTEGRAÇÃO ENSINO-SERVIÇO-COMUNIDADE ESTÁGIO/RESIDÊNCIA Nº __/20__</div>

        <table class="info-row">
            <tr>
                <td width="70%"><span class="label">INSTITUIÇÃO DE ENSINO:</span> {{ estagio.instituicao.nome if estagio.instituicao else '—' }}</td>
                <td class="center" width="30%"><span class="label">Exercício:</span> {{ exercicio }}</td>
            </tr>
            <tr>
                <td colspan="2"><span class="label">Curso:</span> {{ estagio.curso.nome if estagio.curso else '—' }}</td>
            </tr>
        </table>

        <table>
            <thead>
                <tr>
                    <th>Disciplina</th>
                    <th>Descrição de atividades (descrever no mínimo cinco)</th>
                    <th>Nível</th>
                    <th>Unidade/ setor</th>
                    <th colspan="2" class="center">Data (dia/mês/ano)</th>
                    <th>Horário</th>
                    <th>Dias da semana</th>
                    <th>Quantidade de grupos</th>
                    <th>Nº de Estagiários por grupo</th>
                    <th>Carga Horária Individual</th>
                    <th>Supervisor</th>
                    <th>Nº Conselho</th>
                    <th>Valor</th>
                </tr>
                <tr>
                    <th colspan="4"></th>
                    <th class="center">Início</th>
                    <th class="center">Fim</th>
                    <th colspan="8"></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ estagio.disciplina or '—' }}</td>
                    <td>{{ estagio.observacoes or '—' }}</td>
                    <td class="center">{{ estagio.nivel or '—' }}</td>
                    <td>{{ estagio.unidade.nome if estagio.unidade else '—' }}</td>
                    <td class="center">{% if estagio.data_inicio %}{{ estagio.data_inicio.strftime('%d/%m/%Y') }}{% else %}—{% endif %}</td>
                    <td class="center">{% if estagio.data_fim %}{{ estagio.data_fim.strftime('%d/%m/%Y') }}{% else %}—{% endif %}</td>
                    <td class="center">{% if estagio.horario_inicio and estagio.horario_fim %}{{ estagio.horario_inicio.strftime('%H:%M') }} - {{ estagio.horario_fim.strftime('%H:%M') }}{% else %}—{% endif %}</td>
                    <td>{{ estagio.dias_semana or '—' }}</td>
                    <td class="center">{{ estagio.quantidade_grupos or '—' }}</td>
                    <td class="center">{{ estagio.num_estagiarios or '—' }}</td>
                    <td class="center">{{ estagio.carga_horaria or '—' }}</td>
                    <td>{{ estagio.supervisor.nome if estagio.supervisor else '—' }}</td>
                    <td class="center">{{ estagio.supervisor.numero_conselho if estagio.supervisor and estagio.supervisor.numero_conselho else '—' }}</td>
                    <td class="right">{% if estagio.valor_total %}R$ {{ '%.2f' % estagio.valor_total }}{% else %}—{% endif %}</td>
                </tr>
            </tbody>
        </table>

        <p style="margin-top: 12px; font-size: 12px;">Data de Geração: {{ data_geracao }}</p>

        <table class="sig-table" style="width:100%; margin-top: 30px;">
            <tr>
                <th width="33%">Assinatura do Estagiário</th>
                <th width="33%">Assinatura do Supervisor</th>
                <th width="34%">Assinatura da Instituição</th>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        </table>
                    <th width="33%">Assinatura do Supervisor</th>
                    <th width="34%">Assinatura da Instituição</th>
                </tr>
                <tr>
    from datetime import datetime
                    <td style="height: 80px;"></td>
                    <td style="height: 80px;"></td>
                </tr>
            </table>
        data_geracao=datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        exercicio=(estagio.data_inicio.year if getattr(estagio, 'data_inicio', None) else datetime.now().year)
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