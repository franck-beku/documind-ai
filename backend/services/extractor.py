import os


def extract_text(file_path: str, ext: str) -> tuple:
    if ext == ".pdf":
        return extract_pdf(file_path)
    elif ext == ".docx":
        return extract_docx(file_path)
    elif ext in (".jpg", ".jpeg", ".png"):
        return extract_image(file_path)
    else:
        raise ValueError(f"Format non supporté: {ext}")


def extract_pdf(file_path: str) -> tuple:
    try:
        import fitz
        doc = fitz.open(file_path)
        pages = [page.get_text() for page in doc]
        doc.close()
        full_text = "\n\n".join(pages).strip()

        if len(full_text) < 50:
            return extract_pdf_ocr(file_path)

        return full_text, len(pages)
    except Exception as e:
        raise RuntimeError(f"Erreur extraction PDF: {e}")


def extract_pdf_ocr(file_path: str) -> tuple:
    try:
        from pdf2image import convert_from_path
        import pytesseract
        images = convert_from_path(file_path, dpi=200)
        texts  = [pytesseract.image_to_string(img, lang="fra+eng") for img in images]
        return "\n\n".join(texts).strip(), len(images)
    except Exception as e:
        raise RuntimeError(f"Erreur OCR PDF: {e}")


def extract_docx(file_path: str) -> tuple:
    try:
        from docx import Document
        doc        = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        text       = "\n\n".join(paragraphs)
        pages      = max(1, len(text.split()) // 400)
        return text, pages
    except Exception as e:
        raise RuntimeError(f"Erreur extraction DOCX: {e}")


def extract_image(file_path: str) -> tuple:
    try:
        import pytesseract
        from PIL import Image
        img  = Image.open(file_path)
        text = pytesseract.image_to_string(img, lang="fra+eng")
        return text.strip(), 1
    except Exception as e:
        raise RuntimeError(f"Erreur OCR image: {e}")