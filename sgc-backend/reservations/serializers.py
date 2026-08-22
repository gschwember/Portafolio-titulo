from rest_framework import serializers

from users.models import User

from .models import CommonSpace, Reservation


class CommonSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommonSpace
        fields = ('id', 'code', 'name', 'capacity', 'is_active')


class ReservationSerializer(serializers.ModelSerializer):
    common_space = serializers.SlugRelatedField(slug_field='code', queryset=CommonSpace.objects.filter(is_active=True))

    class Meta:
        model = Reservation
        fields = (
            'id',
            'common_space',
            'requester_name',
            'requester_role',
            'reservation_date',
            'start_time',
            'end_time',
            'status',
            'notes',
            'extra_data',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_requester_role(self, value):
        normalized_value = str(value).lower()
        if normalized_value not in dict(User.Role.choices):
            raise serializers.ValidationError('Rol de solicitante invalido.')
        return normalized_value

    def validate(self, attrs):
        start_time = attrs.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = attrs.get('end_time', getattr(self.instance, 'end_time', None))
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({'end_time': 'La hora de termino debe ser mayor que la hora de inicio.'})

        return attrs

    def create(self, validated_data):
        request_user = self.context['request'].user

        if request_user.role == User.Role.RESIDENTE:
            validated_data['requester_name'] = request_user.get_full_name().strip() or request_user.email
            validated_data['requester_role'] = request_user.role
        else:
            validated_data.setdefault('requester_name', request_user.get_full_name().strip() or request_user.email)
            validated_data.setdefault('requester_role', request_user.role)

        return Reservation.objects.create(requester=request_user, **validated_data)
