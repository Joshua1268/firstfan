from rest_framework import serializers


class TrackSerializer(serializers.Serializer):
    k = serializers.CharField(max_length=64)
    t = serializers.CharField(max_length=64, required=False, allow_null=True, allow_blank=True)
    u = serializers.CharField(allow_blank=True, trim_whitespace=False)
