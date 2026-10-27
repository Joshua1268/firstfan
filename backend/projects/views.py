from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsDev

from .certificate import render_certificate
from .models import Project
from .serializers import ProjectCreateSerializer, ProjectDetailSerializer, ProjectSummarySerializer
from .services import create_project


class ProjectListView(APIView):
    permission_classes = [IsAuthenticated, IsDev]
    parser_classes = [MultiPartParser]

    def get(self, request):
        projects = Project.objects.filter(owner=request.user).order_by("-created_at")
        return Response(ProjectSummarySerializer(projects, many=True).data)

    def post(self, request):
        serializer = ProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = create_project(owner=request.user, **serializer.validated_data)
        return Response(ProjectDetailSerializer(project).data, status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk, owner=request.user)
        return Response(ProjectDetailSerializer(project).data)


class ProjectCertificateView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk, owner=request.user)
        response = HttpResponse(render_certificate(project), content_type="text/plain; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="certificat-{project.pk}.txt"'
        return response
