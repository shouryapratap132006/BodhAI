from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import LearningHistory
from .serializers import LearningHistorySerializer
from .utils.extraction import extract_pdf_text, extract_pptx_text, extract_image_base64, describe_image_with_llm
from .agents.graph import graph

class HistoryView(APIView):
    def get(self, request):
        history = LearningHistory.objects.all().order_by('-created_at')
        serializer = LearningHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class LearnView(APIView):
    def post(self, request):
        input_text = request.data.get('input', '')
        mode = request.data.get('mode', 'balanced')
        file_obj = request.FILES.get('file')
        file_type = None

        if file_obj:
            filename = file_obj.name.lower()
            if filename.endswith('.pdf'):
                input_text += "\n" + extract_pdf_text(file_obj)
                file_type = 'pdf'
            elif filename.endswith('.pptx') or filename.endswith('.ppt'):
                input_text += "\n" + extract_pptx_text(file_obj)
                file_type = 'pptx'
            elif filename.endswith(('.jpg', '.jpeg', '.png')):
                base64_img = extract_image_base64(file_obj)
                description = describe_image_with_llm(base64_img)
                input_text += "\nImage Description: " + description
                file_type = 'image'

        if not input_text.strip():
            return Response({"error": "No input provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Run LangGraph Agent
        state = {
            "input": input_text,
            "mode": mode,
            "architectOutline": "",
            "explanation": "",
            "steps": [],
            "question": ""
        }
        
        try:
            result = graph.invoke(state)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save to DB
        history_item = LearningHistory.objects.create(
            input_text=input_text,
            mode=mode,
            explanation=result.get("explanation", ""),
            steps=result.get("steps", []),
            question=result.get("question", ""),
            file_type=file_type
        )

        return Response({
            "id": history_item.id,
            "explanation": history_item.explanation,
            "steps": history_item.steps,
            "question": history_item.question,
        }, status=status.HTTP_200_OK)
