from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER
import io


def generate_pdf_report(document_info: dict, analysis: dict) -> bytes:
    """Génère un rapport PDF à partir des données d'analyse du document."""

    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    # ── Styles ────────────────────────────────────────────────────────────────
    title_style = ParagraphStyle("title", fontSize=20, fontName="Helvetica-Bold",
                                 textColor=colors.HexColor("#1e3a5f"),
                                 spaceAfter=6, alignment=TA_CENTER)
    sub_style   = ParagraphStyle("sub", fontSize=11, fontName="Helvetica",
                                 textColor=colors.grey, spaceAfter=4, alignment=TA_CENTER)
    h2_style    = ParagraphStyle("h2", fontSize=13, fontName="Helvetica-Bold",
                                 textColor=colors.HexColor("#1e3a5f"),
                                 spaceBefore=14, spaceAfter=6)
    body_style  = ParagraphStyle("body", fontSize=10, fontName="Helvetica",
                                 textColor=colors.HexColor("#333333"),
                                 spaceAfter=4, leading=14)
    risk_style  = ParagraphStyle("risk", fontSize=10, fontName="Helvetica",
                                 textColor=colors.HexColor("#cc0000"),
                                 spaceAfter=4, leading=14)

    # ── Contenu ───────────────────────────────────────────────────────────────
    story = [
        Paragraph("DocuMind AI", title_style),
        Paragraph("Rapport d'analyse de document", sub_style),
        Paragraph(f"Fichier : {document_info.get('original_filename', 'N/A')}", sub_style),
        HRFlowable(width="100%", thickness=1,
                   color=colors.HexColor("#1e3a5f"), spaceAfter=12),
    ]

    # Résumé
    story.append(Paragraph("Résumé", h2_style))
    summary = analysis.get("summary", "")
    for line in summary.split("\n"):
        line = line.strip().lstrip("•").strip()
        if line:
            story.append(Paragraph(f"• {line}", body_style))

    # Informations clés
    key_info = analysis.get("key_info", [])
    if key_info:
        story.append(Spacer(1, 8))
        story.append(Paragraph("Informations clés", h2_style))
        for item in key_info:
            story.append(Paragraph(
                f"<b>{item.get('type', '').upper()}</b> : {item.get('valeur', '')} — {item.get('contexte', '')}",
                body_style
            ))

    # Alertes et risques
    risks = analysis.get("risks", [])
    if risks:
        story.append(Spacer(1, 8))
        story.append(Paragraph("Alertes et risques", h2_style))
        for risk in risks:
            story.append(Paragraph(
                f"[{risk.get('niveau', '').upper()}] {risk.get('type', '')} — {risk.get('description', '')}",
                risk_style
            ))

    # Clauses détectées
    clauses = analysis.get("clauses", [])
    if clauses:
        story.append(Spacer(1, 8))
        story.append(Paragraph("Clauses détectées", h2_style))
        for clause in clauses:
            story.append(Paragraph(
                f"[{clause.get('type', '').upper()}] {clause.get('description', '')}",
                body_style
            ))

    doc.build(story)
    return buffer.getvalue()