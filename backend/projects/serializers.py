from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from core.uploads import validate_upload

from .models import Project, ProjectCapture

MAX_CAPTURES = 3


class ProjectSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "url", "created_at"]


class CaptureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCapture
        fields = ["sha256"]


class ProjectDetailSerializer(serializers.ModelSerializer):
    script_snippet = serializers.SerializerMethodField()
    captures = CaptureSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "url",
            "description",
            "fingerprint",
            "fingerprinted_at",
            "public_key",
            "script_snippet",
            "script_seen_at",
            "captures",
        ]

    def get_script_snippet(self, project: Project) -> str:
        return f'<script src="{settings.SITE_URL}/t.js" data-project="{project.public_key}" defer></script>'


class ProjectCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    url = serializers.URLField()
    description = serializers.CharField()
    captures = serializers.ListField(
        child=serializers.FileField(),
        max_length=MAX_CAPTURES,
        required=False,
        default=list,
        error_messages={"max_length": f"{MAX_CAPTURES} captures au maximum."},
    )

    def validate_captures(self, files):
        for f in files:
            try:
                validate_upload(f)
            except DjangoValidationError as e:
                raise serializers.ValidationError(e.messages) from e
        return files
