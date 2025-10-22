from fastapi import APIRouter, Request, Depends, Form, UploadFile, File, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime
from typing import Optional
import os
import uuid

from ..db import SessionLocal
from .. import crud, schemas, auth, models
from ..utils_pdf import render_anexo2_html, render_anexo2
import importlib.util as _importlib_util

router = APIRouter(tags=["web"])
COOKIE_TOKEN_NAME = "token"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user_from_cookie(request: Request, db: Session):
    token = request.cookies.get(COOKIE_TOKEN_NAME)
    if not token:
        return None
    try:
        return auth.get_current_user(db, token)
    except Exception:
        return None

@router.get("/web/login", response_class=HTMLResponse)
async def web_login(request: Request):
    return request.app.state.templates.TemplateResponse("login.html", {"request": request, "error": None, "year": datetime.utcnow().year})

@router.post("/web/login")
async def web_login_post(request: Request, email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, email.lower().strip(), password)
    if not user:
        return request.app.state.templates.TemplateResponse("login.html", {"request": request, "error": "Credenciais inválidas", "year": datetime.utcnow().year}, status_code=401)
    token = auth.create_access_token({"sub": user.email, "tipo": user.tipo})
    resp = RedirectResponse(url="/web/dashboard", status_code=302)
    resp.set_cookie(COOKIE_TOKEN_NAME, token, httponly=True, samesite="lax")
    return resp

@router.get("/web/logout")
async def web_logout():
    resp = RedirectResponse(url="/web/login", status_code=302)
    resp.delete_cookie(COOKIE_TOKEN_NAME)
    return resp

@router.get("/web/dashboard", response_class=HTMLResponse)
async def web_dashboard(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    
    # Calcular métricas para o dashboard
    total_estagios = db.query(models.Estagio).count()
    estagios_ativos = db.query(models.Estagio).filter(models.Estagio.status == "ativo").count()
    total_supervisores = db.query(models.Supervisor).count()
    total_instituicoes = db.query(models.Instituicao).count()
    
    # Buscar estágios recentes (últimos 5)
    estagios_recentes = (
        db.query(models.Estagio)
        .join(models.Supervisor)
        .options(joinedload(models.Estagio.supervisor))
        .order_by(models.Estagio.id.desc())
        .limit(5)
        .all()
    )
    
    context = {
        "request": request,
        "user": user,
        "year": datetime.utcnow().year,
        "metrics": {
            "total_estagios": total_estagios,
            "estagios_ativos": estagios_ativos,
            "total_supervisores": total_supervisores,
            "total_instituicoes": total_instituicoes
        },
        "estagios_recentes": estagios_recentes
    }
    return request.app.state.templates.TemplateResponse("dashboard.html", context)

@router.get("/web/supervisores", response_class=HTMLResponse)
async def web_supervisores(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    supervisores = crud.get_supervisores(db)
    return request.app.state.templates.TemplateResponse("supervisores.html", {"request": request, "user": user, "supervisores": supervisores, "error": None, "year": datetime.utcnow().year})

@router.post("/web/supervisores")
async def web_supervisores_create(
    request: Request,
    nome: str = Form(...),
    email: str = Form(...),
    telefone: str = Form(""),
    especialidade: str = Form(""),
    numero_conselho: str = Form("") ,
    db: Session = Depends(get_db)
):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    try:
        crud.create_supervisor(db, schemas.SupervisorCreate(
            nome=nome,
            email=email,
            telefone=telefone,
            especialidade=especialidade,
            numero_conselho=numero_conselho or None
        ))
    except Exception:
        pass
    return RedirectResponse("/web/supervisores", status_code=302)

@router.post("/web/supervisores/delete/{supervisor_id}")
async def web_delete_supervisor(request: Request, supervisor_id: int, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.delete_supervisor(db, supervisor_id)
    return RedirectResponse("/web/supervisores", status_code=302)

@router.get("/web/estagios", response_class=HTMLResponse)
async def web_estagios(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    estagios = crud.get_estagios(db, user_type=user.tipo, user_id=user.id)
    supervisores = crud.get_supervisores(db)
    instituicoes = crud.get_instituicoes(db)
    cursos = crud.get_cursos(db)
    unidades = crud.get_unidades(db)
    territorios = db.query(models.Territorio).all()
    # Mensagem de importação (se houver)
    imported = request.query_params.get("imported")
    msg = None
    if imported:
        msg = f"Importação concluída: {imported} registro(s)." if imported.isdigit() else "Importação concluída."

    return request.app.state.templates.TemplateResponse("estagios.html", {
        "request": request, 
        "user": user, 
        "estagios": estagios, 
        "supervisores": supervisores, 
        "instituicoes": instituicoes, 
        "cursos": cursos, 
        "unidades": unidades, 
        "territorios": territorios,
        "import_message": msg,
        "error": None, 
        "year": datetime.utcnow().year
    })

@router.post("/web/estagios")
async def web_estagios_create(
    request: Request,
    nome: str = Form(...),
    email: str = Form(...),
    telefone: str = Form(""),
    periodo: str = Form(""),
    supervisor_id: Optional[int] = Form(None),
    instituicao_id: Optional[int] = Form(None),
    curso_id: Optional[int] = Form(None),
    unidade_id: Optional[int] = Form(None),
    disciplina: str = Form(""),
    nivel: str = Form(""),
    num_estagiarios: Optional[int] = Form(None),
    quantidade_grupos: Optional[int] = Form(None),
    dias_semana: str = Form(""),
    data_inicio: Optional[str] = Form(None),
    data_fim: Optional[str] = Form(None),
    horario_inicio: Optional[str] = Form(None),
    horario_fim: Optional[str] = Form(None),
    carga_horaria: Optional[float] = Form(None),
    status: str = Form("ativo"),
    valor_total: Optional[float] = Form(None),
    territorio_id: Optional[int] = Form(None),
    observacoes: str = Form(""),
    db: Session = Depends(get_db)
):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    try:
        estagio_obj = schemas.EstagioCreate(
            nome=nome,
            email=email,
            telefone=telefone,
            periodo=periodo,
            supervisor_id=supervisor_id or None,
            instituicao_id=instituicao_id or None,
            curso_id=curso_id or None,
            unidade_id=unidade_id or None,
            territorio_id=territorio_id or None,
            disciplina=disciplina or None,
            nivel=nivel or None,
            num_estagiarios=num_estagiarios or None,
            quantidade_grupos=quantidade_grupos or None,
            dias_semana=dias_semana or None,
            data_inicio=data_inicio,
            data_fim=data_fim,
            horario_inicio=horario_inicio,
            horario_fim=horario_fim,
            carga_horaria=carga_horaria,
            status=status or "ativo",
            valor_total=valor_total,
            observacoes=observacoes
        )
        crud.create_estagio(db, estagio_obj)
    except Exception:
        pass
    return RedirectResponse("/web/estagios", status_code=302)

@router.post("/web/estagios/delete/{estagio_id}")
async def web_delete_estagio(request: Request, estagio_id: int, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.delete_estagio(db, estagio_id)
    return RedirectResponse("/web/estagios", status_code=302)

@router.post("/web/estagios/import")
async def web_import_estagios(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    if not file.filename.endswith((".csv", ".xlsx")):
        return RedirectResponse("/web/estagios")
    try:
        content = await file.read()
        imported = 0
        if file.filename.endswith('.csv'):
            import csv, io
            csvfile = io.StringIO(content.decode('utf-8'))
            reader = csv.DictReader(csvfile)
            for row in reader:
                if row.get('nome') and row.get('email'):
                    crud.create_estagio(db, schemas.EstagioCreate(
                        nome=row['nome'], email=row['email'], telefone=row.get('telefone',''), periodo=row.get('periodo',''), supervisor_id=int(row['supervisor_id']) if row.get('supervisor_id') else None
                    ))
                    imported += 1
        elif file.filename.endswith('.xlsx'):
            # Primeiro, tentar usar o importador específico do modelo da Faculdade Guarapuava
            try:
                # Persistir o upload temporariamente
                routers_dir = os.path.dirname(__file__)
                app_dir = os.path.dirname(routers_dir)
                api_dir = os.path.dirname(app_dir)
                uploads_dir = os.path.join(api_dir, 'uploads')
                os.makedirs(uploads_dir, exist_ok=True)
                temp_path = os.path.join(uploads_dir, f"upload_{uuid.uuid4().hex}.xlsx")
                with open(temp_path, 'wb') as f:
                    f.write(content)

                try:
                    # Tenta importar como pacote (se 'tools' for pacote)
                    from tools.importar_excel import importar_excel  # type: ignore
                    sucesso = importar_excel(temp_path)
                    if sucesso:
                        # Importação completa feita pelo script dedicado
                        # Remover arquivo temporário e redirecionar
                        try:
                            os.remove(temp_path)
                        except OSError:
                            pass
                        return RedirectResponse("/web/estagios?imported=ok", status_code=302)
                except Exception:
                    # Fallback: carregar módulo diretamente via caminho (tools não é pacote)
                    try:
                        importer_path = os.path.join(api_dir, 'tools', 'importar_excel.py')
                        spec = _importlib_util.spec_from_file_location("importar_excel", importer_path)
                        if spec and spec.loader:
                            mod = _importlib_util.module_from_spec(spec)
                            spec.loader.exec_module(mod)  # type: ignore
                            if hasattr(mod, 'importar_excel'):
                                sucesso = mod.importar_excel(temp_path)  # type: ignore
                                if sucesso:
                                    try:
                                        os.remove(temp_path)
                                    except OSError:
                                        pass
                                    return RedirectResponse("/web/estagios?imported=ok", status_code=302)
                    except Exception:
                        # Segue para import genérico
                        pass
                finally:
                    # Se não retornamos ainda, tentaremos o import genérico; manteremos o arquivo para debug opcional
                    try:
                        os.remove(temp_path)
                    except OSError:
                        pass

            except Exception:
                # Qualquer falha na preparação cai para o import genérico
                pass

            # Fallback: importação genérica por cabeçalho (nome,email,...)
            try:
                import openpyxl, io
                wb = openpyxl.load_workbook(io.BytesIO(content))
                sheet = wb.active
                headers = [cell.value for cell in sheet[1]]
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    if row and row[0] and row[1]:
                        row_data = dict(zip(headers, row))
                        crud.create_estagio(db, schemas.EstagioCreate(
                            nome=row_data.get('nome'), email=row_data.get('email'), telefone=row_data.get('telefone',''), periodo=row_data.get('periodo',''), supervisor_id=int(row_data['supervisor_id']) if row_data.get('supervisor_id') else None
                        ))
                        imported += 1
            except ImportError:
                pass
    except Exception:
        pass
    return RedirectResponse(f"/web/estagios?imported={imported}", status_code=302)

@router.get("/web/catalogos", response_class=HTMLResponse)
async def web_catalogos(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    territorios = db.query(models.Territorio).all()
    return request.app.state.templates.TemplateResponse("catalogos.html", {
        "request": request, 
        "user": user, 
        "territorios": territorios,
        "instituicoes": crud.get_instituicoes(db), 
        "cursos": crud.get_cursos(db), 
        "unidades": crud.get_unidades(db), 
        "error": None, 
        "year": datetime.utcnow().year
    })

@router.post("/web/catalogos/instituicoes")
async def web_add_instituicao(request: Request, nome: str = Form(...), db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.create_instituicao(db, schemas.InstituicaoCreate(nome=nome))
    return RedirectResponse("/web/catalogos", status_code=302)

@router.post("/web/catalogos/cursos")
async def web_add_curso(request: Request, nome: str = Form(...), db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.create_curso(db, schemas.CursoCreate(nome=nome))
    return RedirectResponse("/web/catalogos", status_code=302)

@router.post("/web/catalogos/unidades")
async def web_add_unidade(request: Request, nome: str = Form(...), db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.create_unidade(db, schemas.UnidadeCreate(nome=nome))
    return RedirectResponse("/web/catalogos", status_code=302)

@router.post("/web/catalogos/instituicoes/delete/{instituicao_id}")
async def web_delete_instituicao(request: Request, instituicao_id: int, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.delete_instituicao(db, instituicao_id)
    return RedirectResponse("/web/catalogos", status_code=302)

@router.post("/web/catalogos/cursos/delete/{curso_id}")
async def web_delete_curso(request: Request, curso_id: int, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.delete_curso(db, curso_id)
    return RedirectResponse("/web/catalogos", status_code=302)

@router.post("/web/catalogos/unidades/delete/{unidade_id}")
async def web_delete_unidade(request: Request, unidade_id: int, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.delete_unidade(db, unidade_id)
    return RedirectResponse("/web/catalogos", status_code=302)

@router.post("/web/catalogos/territorios")
async def web_add_territorio(request: Request, nome: str = Form(...), descricao: str = Form(""), db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    territorio = models.Territorio(nome=nome, descricao=descricao or None)
    db.add(territorio)
    db.commit()
    return RedirectResponse("/web/catalogos", status_code=302)

@router.post("/web/catalogos/territorios/delete/{territorio_id}")
async def web_delete_territorio(request: Request, territorio_id: int, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    territorio = db.query(models.Territorio).filter(models.Territorio.id == territorio_id).first()
    if territorio:
        db.delete(territorio)
        db.commit()
    return RedirectResponse("/web/catalogos", status_code=302)

@router.get("/web/relatorios", response_class=HTMLResponse)
async def web_relatorios(request: Request, db: Session = Depends(get_db)):
    """Página de relatórios dinâmicos com funcionalidade drag and drop"""
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    
    # Obter dados necessários para os filtros
    cursos = crud.get_cursos(db)
    instituicoes = crud.get_instituicoes(db)
    unidades = crud.get_unidades(db)
    territorios = db.query(models.Territorio).all()
    supervisores = crud.get_supervisores(db)
    
    # Definir campos disponíveis dinamicamente
    campos_disponiveis = {
        "pessoa": [
            {"field": "nome", "table": "estagio", "label": "Nome", "icon": "👤"},
            {"field": "email", "table": "estagio", "label": "E-mail", "icon": "📧"},
            {"field": "telefone", "table": "estagio", "label": "Telefone", "icon": "📱"},
            {"field": "periodo", "table": "estagio", "label": "Período", "icon": "📅"},
        ],
        "academico": [
            {"field": "nome", "table": "curso", "label": "Curso", "icon": "🎓"},
            {"field": "disciplina", "table": "estagio", "label": "Disciplina", "icon": "📚"},
            {"field": "nivel", "table": "estagio", "label": "Nível", "icon": "📈"},
            {"field": "carga_horaria", "table": "estagio", "label": "Carga Horária", "icon": "⏰"},
        ],
        "estagio": [
            {"field": "nome", "table": "instituicao", "label": "Instituição", "icon": "🏥"},
            {"field": "nome", "table": "supervisor", "label": "Supervisor", "icon": "👨‍⚕️"},
            {"field": "nome", "table": "unidade", "label": "Unidade", "icon": "🏢"},
            {"field": "nome", "table": "territorio", "label": "Território", "icon": "🌍"},
            {"field": "status", "table": "estagio", "label": "Status", "icon": "📊"},
            {"field": "valor_total", "table": "estagio", "label": "Valor Total", "icon": "💰"},
            {"field": "num_estagiarios", "table": "estagio", "label": "Nº Estagiários", "icon": "👥"},
        ],
        "tempo": [
            {"field": "data_inicio", "table": "estagio", "label": "Data Início", "icon": "🗓️"},
            {"field": "data_fim", "table": "estagio", "label": "Data Fim", "icon": "🏁"},
            {"field": "horario_inicio", "table": "estagio", "label": "Horário Início", "icon": "🕐"},
            {"field": "horario_fim", "table": "estagio", "label": "Horário Fim", "icon": "🕐"},
            {"field": "created_at", "table": "estagio", "label": "Data Criação", "icon": "📝"},
        ]
    }
    
    return request.app.state.templates.TemplateResponse("relatorios.html", {
        "request": request,
        "user": user,
        "cursos": cursos,
        "instituicoes": instituicoes,
        "unidades": unidades,
        "territorios": territorios,
        "supervisores": supervisores,
        "campos_disponiveis": campos_disponiveis,
        "year": datetime.utcnow().year
    })

@router.get("/web/relatorios/anexo2/{estagio_id}")
async def web_relatorio_anexo2(request: Request, estagio_id: int, format: str = "html", db: Session = Depends(get_db)):
    """Gera o Anexo II (HTML ou PDF) autenticando via cookie."""
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    estagio = crud.get_estagio_by_id(db, estagio_id)
    if not estagio:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")
    if format.lower() == "pdf":
        try:
            pdf_bytes = render_anexo2(estagio)
            return Response(content=pdf_bytes, media_type="application/pdf")
        except Exception:
            # Fallback: retorna HTML se PDF não estiver disponível
            html = render_anexo2_html(estagio)
            return HTMLResponse(content=html)
    else:
        html = render_anexo2_html(estagio)
        return HTMLResponse(content=html)

@router.post("/web/relatorios/gerar")
async def web_gerar_relatorio(
    request: Request,
    db: Session = Depends(get_db)
):
    """Gerar relatório dinâmico baseado nos campos selecionados e filtros aplicados (JSON)."""
    user = get_current_user_from_cookie(request, db)
    if not user:
        return JSONResponse({"error": "Não autenticado"}, status_code=401)

    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Corpo da requisição inválido"}, status_code=400)

    try:
        campos_in = body.get("campos", [])
        filtros_obj = body.get("filtros", {}) or {}
        formato = (body.get("formato") or "json").lower()
        # Pivot-like aggregation inputs (optional)
        linhas_in = body.get("linhas", []) or []
        valores_in = body.get("valores", []) or []
        colunas_in = body.get("colunas", []) or []

        # Normalizar campos: aceitar objetos {field, table, ...} ou strings
        campos_list = []
        for c in campos_in:
            if isinstance(c, dict):
                field = c.get("field")
                table = c.get("table")
                if field:
                    campos_list.append({"field": field, "table": table})
            elif isinstance(c, str):
                table = None
                for tb in ["curso", "instituicao", "unidade", "supervisor", "territorio"]:
                    if c.startswith(tb + "_"):
                        table = tb
                        break
                campos_list.append({"field": c, "table": table})

        campos_str = {c["field"] for c in campos_list}

        # Normalizar linhas/valores/colunas para modo agregado
        def _normalize_items(items):
            norm = []
            for it in items:
                if isinstance(it, dict):
                    fd = it.get("field")
                    tb = it.get("table")
                    agg = it.get("agg")
                    if fd:
                        d = {"field": fd, "table": tb}
                        if agg:
                            d["agg"] = str(agg).lower()
                        norm.append(d)
                elif isinstance(it, str):
                    tb = None
                    for tbname in ["curso", "instituicao", "unidade", "supervisor", "territorio"]:
                        if it.startswith(tbname + "_"):
                            tb = tbname
                            break
                    norm.append({"field": it, "table": tb})
            return norm

        linhas_list = _normalize_items(linhas_in)
        valores_list = _normalize_items(valores_in)
        colunas_list = _normalize_items(colunas_in)

        # Se modo agregado solicitado (linhas/valores presentes), processa antes do modo simples
        if valores_list or linhas_list:
            try:
                # Campos envolvidos para decidir joins
                all_fields = {*(it["field"] for it in linhas_list), *(it["field"] for it in valores_list), *(it["field"] for it in colunas_list)}

                # Construir query base
                query = db.query()

                # Joins conforme necessidade
                if any(f.startswith("supervisor_") for f in all_fields):
                    query = query.select_from(models.Estagio).join(models.Supervisor, models.Estagio.supervisor_id == models.Supervisor.id, isouter=True)
                else:
                    query = query.select_from(models.Estagio)
                if any(f.startswith("instituicao_") for f in all_fields):
                    query = query.join(models.Instituicao, models.Estagio.instituicao_id == models.Instituicao.id, isouter=True)
                if any(f.startswith("curso_") for f in all_fields):
                    query = query.join(models.Curso, models.Estagio.curso_id == models.Curso.id, isouter=True)
                if any(f.startswith("unidade_") for f in all_fields):
                    query = query.join(models.Unidade, models.Estagio.unidade_id == models.Unidade.id, isouter=True)
                if any(f.startswith("territorio_") for f in all_fields):
                    query = query.join(models.Territorio, models.Estagio.territorio_id == models.Territorio.id, isouter=True)

                # Filtros (mesmos do modo simples)
                try:
                    if filtros_obj.get("curso_id"):
                        query = query.filter(models.Estagio.curso_id == int(filtros_obj["curso_id"]))
                    if filtros_obj.get("instituicao_id"):
                        query = query.filter(models.Estagio.instituicao_id == int(filtros_obj["instituicao_id"]))
                    if filtros_obj.get("supervisor_id"):
                        query = query.filter(models.Estagio.supervisor_id == int(filtros_obj["supervisor_id"]))
                    if filtros_obj.get("status"):
                        query = query.filter(models.Estagio.status == filtros_obj["status"])
                    if filtros_obj.get("data_inicio"):
                        from datetime import date
                        try:
                            di = date.fromisoformat(str(filtros_obj["data_inicio"]))
                            query = query.filter(models.Estagio.data_inicio >= di)
                        except Exception:
                            pass
                    if filtros_obj.get("data_fim"):
                        from datetime import date
                        try:
                            df = date.fromisoformat(str(filtros_obj["data_fim"]))
                            query = query.filter(models.Estagio.data_fim <= df)
                        except Exception:
                            pass
                except Exception:
                    pass

                # Mapeamento de campos -> colunas SQLAlchemy
                field_map = {
                    'nome': models.Estagio.nome,
                    'email': models.Estagio.email,
                    'telefone': models.Estagio.telefone,
                    'periodo': models.Estagio.periodo,
                    'disciplina': getattr(models.Estagio, 'disciplina', None),
                    'nivel': getattr(models.Estagio, 'nivel', None),
                    'carga_horaria': getattr(models.Estagio, 'carga_horaria', None),
                    'curso_nome': models.Curso.nome,
                    'instituicao_nome': models.Instituicao.nome,
                    'unidade_nome': models.Unidade.nome,
                    'data_inicio': models.Estagio.data_inicio,
                    'data_fim': models.Estagio.data_fim,
                    'horario_inicio': getattr(models.Estagio, 'horario_inicio', None),
                    'horario_fim': getattr(models.Estagio, 'horario_fim', None),
                    'status': models.Estagio.status,
                    'valor_total': getattr(models.Estagio, 'valor_total', None),
                    'supervisor_nome': models.Supervisor.nome,
                    'supervisor_email': models.Supervisor.email,
                    'supervisor_telefone': models.Supervisor.telefone,
                    'territorio_nome': models.Territorio.nome,
                    'created_at': getattr(models.Estagio, 'created_at', None),
                }

                def resolve_col(field_name):
                    col = field_map.get(field_name)
                    if col is None:
                        # Fallback: attempt attribute from Estagio directly
                        col = getattr(models.Estagio, field_name, None)
                    return col

                group_cols = []
                group_aliases = []
                for it in (linhas_list + colunas_list):
                    col = resolve_col(it['field'])
                    if col is not None:
                        alias = it['field']
                        group_cols.append(col.label(alias))
                        group_aliases.append(alias)

                agg_cols = []
                agg_aliases = []
                for it in valores_list:
                    agg = (it.get('agg') or 'count').lower()
                    fld = it['field']
                    col = resolve_col(fld)
                    alias = f"{agg}_{fld}"
                    if agg == 'count':
                        # COUNT estagio.id para consistência
                        agg_cols.append(func.count(models.Estagio.id).label(alias))
                        agg_aliases.append(alias)
                    elif col is not None:
                        if agg == 'sum':
                            agg_cols.append(func.sum(col).label(alias))
                            agg_aliases.append(alias)
                        elif agg == 'avg':
                            agg_cols.append(func.avg(col).label(alias))
                            agg_aliases.append(alias)
                        elif agg == 'min':
                            agg_cols.append(func.min(col).label(alias))
                            agg_aliases.append(alias)
                        elif agg == 'max':
                            agg_cols.append(func.max(col).label(alias))
                            agg_aliases.append(alias)
                        else:
                            # padrão para COUNT
                            agg_cols.append(func.count(models.Estagio.id).label(alias))
                            agg_aliases.append(alias)
                    else:
                        # campo inválido: usa COUNT como fallback
                        agg_cols.append(func.count(models.Estagio.id).label(alias))
                        agg_aliases.append(alias)

                # Montar seleção
                select_cols = []
                select_cols.extend(group_cols)
                select_cols.extend(agg_cols if agg_cols else [func.count(models.Estagio.id).label('count')])
                query = query.with_entities(*select_cols)
                if group_cols:
                    query = query.group_by(*group_cols)

                rows = query.all()

                # Serializar saída
                dados = []
                for row in rows:
                    rdict = {}
                    for ga in group_aliases:
                        rdict[ga] = getattr(row, ga, None)
                    if agg_cols:
                        for aa in agg_aliases:
                            rdict[aa] = getattr(row, aa, None)
                    else:
                        rdict['count'] = getattr(row, 'count', None)
                    dados.append(rdict)

                if (formato or "json") == "csv":
                    import csv, io
                    output = io.StringIO()
                    if dados:
                        writer = csv.DictWriter(output, fieldnames=list(dados[0].keys()))
                        writer.writeheader()
                        writer.writerows(dados)
                    return Response(
                        content=output.getvalue(),
                        media_type="text/csv",
                        headers={"Content-Disposition": "attachment; filename=relatorio.csv"}
                    )

                return JSONResponse({
                    "success": True,
                    "aggregate": True,
                    "dados": dados,
                    "total": len(dados),
                    "linhas": [it['field'] for it in linhas_list] + [it['field'] for it in colunas_list],
                    "valores": [{"field": it['field'], "agg": (it.get('agg') or 'count').lower()} for it in valores_list]
                })
            except Exception as e:
                return JSONResponse({"error": f"Erro no relatório agregado: {str(e)}"}, status_code=500)

        # Construir query base
        query = db.query(models.Estagio)

        # Joins conforme necessidade
        if any(f.startswith("supervisor_") for f in campos_str):
            query = query.join(models.Supervisor, models.Estagio.supervisor_id == models.Supervisor.id, isouter=True)
        if any(f.startswith("instituicao_") for f in campos_str):
            query = query.join(models.Instituicao, models.Estagio.instituicao_id == models.Instituicao.id, isouter=True)
        if any(f.startswith("curso_") for f in campos_str):
            query = query.join(models.Curso, models.Estagio.curso_id == models.Curso.id, isouter=True)
        if any(f.startswith("unidade_") for f in campos_str):
            query = query.join(models.Unidade, models.Estagio.unidade_id == models.Unidade.id, isouter=True)
        if any(f.startswith("territorio_") for f in campos_str):
            query = query.join(models.Territorio, models.Estagio.territorio_id == models.Territorio.id, isouter=True)

        # Filtros
        try:
            if filtros_obj.get("curso_id"):
                query = query.filter(models.Estagio.curso_id == int(filtros_obj["curso_id"]))
            if filtros_obj.get("instituicao_id"):
                query = query.filter(models.Estagio.instituicao_id == int(filtros_obj["instituicao_id"]))
            if filtros_obj.get("supervisor_id"):
                query = query.filter(models.Estagio.supervisor_id == int(filtros_obj["supervisor_id"]))
            if filtros_obj.get("status"):
                query = query.filter(models.Estagio.status == filtros_obj["status"]) 
            if filtros_obj.get("data_inicio"):
                try:
                    from datetime import date
                    di = date.fromisoformat(str(filtros_obj["data_inicio"]))
                    query = query.filter(models.Estagio.data_inicio >= di)
                except Exception:
                    pass
            if filtros_obj.get("data_fim"):
                try:
                    from datetime import date
                    df = date.fromisoformat(str(filtros_obj["data_fim"]))
                    query = query.filter(models.Estagio.data_fim <= df)
                except Exception:
                    pass
        except Exception:
            # Se algum filtro falhar, seguir sem ele
            pass

        # Executar
        estagios = query.all()

        # Preparar resposta
        dados = []
        for estagio in estagios:
            campo_map = {
                'nome': estagio.nome,
                'email': estagio.email,
                'telefone': estagio.telefone,
                'periodo': estagio.periodo,
                'disciplina': getattr(estagio, 'disciplina', None),
                'nivel': getattr(estagio, 'nivel', None),
                'carga_horaria': getattr(estagio, 'carga_horaria', None),
                'curso_nome': estagio.curso.nome if getattr(estagio, 'curso', None) else None,
                'instituicao_nome': estagio.instituicao.nome if getattr(estagio, 'instituicao', None) else None,
                'unidade_nome': estagio.unidade.nome if getattr(estagio, 'unidade', None) else None,
                'data_inicio': estagio.data_inicio.isoformat() if getattr(estagio, 'data_inicio', None) else None,
                'data_fim': estagio.data_fim.isoformat() if getattr(estagio, 'data_fim', None) else None,
                'horario_inicio': estagio.horario_inicio.isoformat() if getattr(estagio, 'horario_inicio', None) else None,
                'horario_fim': estagio.horario_fim.isoformat() if getattr(estagio, 'horario_fim', None) else None,
                'status': estagio.status,
                'valor_total': float(estagio.valor_total) if getattr(estagio, 'valor_total', None) is not None else None,
                'supervisor_nome': estagio.supervisor.nome if getattr(estagio, 'supervisor', None) else None,
                'supervisor_email': estagio.supervisor.email if getattr(estagio, 'supervisor', None) else None,
                'supervisor_telefone': estagio.supervisor.telefone if getattr(estagio, 'supervisor', None) else None,
                'territorio_nome': estagio.territorio.nome if getattr(estagio, 'territorio', None) else None,
                'created_at': estagio.created_at.isoformat() if getattr(estagio, 'created_at', None) else None,
            }

            registro = {}
            for c in campos_list:
                f = c["field"]
                if f in campo_map:
                    valor = campo_map[f]
                    # chave simples (ex.: data_fim, curso_nome)
                    registro[f] = valor
                    # chave com prefixo da tabela (ex.: estagio_data_fim, curso_curso_nome)
                    tb = (c.get("table") or "").strip()
                    if tb:
                        registro[f"{tb}_{f}"] = valor
            dados.append(registro)

        if (formato or "json") == "csv":
            import csv, io
            output = io.StringIO()
            if dados:
                writer = csv.DictWriter(output, fieldnames=list(dados[0].keys()))
                writer.writeheader()
                writer.writerows(dados)
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=relatorio.csv"}
            )

        return JSONResponse({
            "success": True,
            "dados": dados,
            "total": len(dados),
            "campos": list(campos_str)
        })

    except Exception as e:
        return JSONResponse({"error": f"Erro ao gerar relatório: {str(e)}"}, status_code=500)
