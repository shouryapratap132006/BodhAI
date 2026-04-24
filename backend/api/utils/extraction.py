import fitz
from pptx import Presentation
import base64
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

def extract_pdf_text(file_obj):
    text = ""
    doc = fitz.open("pdf", file_obj.read())
    for page in doc:
        text += page.get_text()
    return text

def extract_pptx_text(file_obj):
    text = ""
    prs = Presentation(file_obj)
    for slide in prs.slides:
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                text += shape.text + "\n"
    return text

def extract_image_base64(file_obj):
    return base64.b64encode(file_obj.read()).decode('utf-8')

def describe_image_with_llm(base64_image):
    try:
        llm = ChatGroq(model="llama-3.2-11b-vision-preview", temperature=0)
        msg = HumanMessage(
            content=[
                {"type": "text", "text": "Provide a detailed textual extraction and description of this educational image. Focus heavily on reading any text inside it and explaining any diagrams/charts."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
            ]
        )
        result = llm.invoke([msg])
        return result.content
    except Exception as e:
        print(f"Vision API Error: {e}")
        return "Image processing failed."
